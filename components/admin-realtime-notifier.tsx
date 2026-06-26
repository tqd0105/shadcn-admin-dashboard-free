"use client";

import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function AdminRealtimeNotifier() {
  const router = useRouter();
  const initialized = useRef(false);
  const notifiedIds = useRef(new Set<string>());
  const audioCtxRef = useRef<any>(null);

  // Mở khóa AudioContext khi Admin có bất kỳ thao tác click/phím nào để lách luật chặn âm thanh
  const getAudioCtx = () => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) audioCtxRef.current = new AudioCtx();
    }
    // đánh thức phòng thu hoạt động trở lại khi bị ngủ đông
    if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  const playSingleChime = (delaySec: number) => {
    try {
      const ctx = getAudioCtx();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      const t = ctx.currentTime + delaySec;
      osc.type = "sine";
      osc.frequency.setValueAtTime(659.25, t); // Nốt E5
      osc.frequency.setValueAtTime(783.99, t + 0.1); // Nốt G5

      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);

      osc.start(t);
      osc.stop(t + 0.45);
    } catch (err) {
      console.warn("Lỗi phát âm thanh:", err);
    }
  };

  // Phát chuông báo 3 tiếng liên tiếp rực rỡ (Ting Ting... Ting Ting... Ting Ting)
  const playCashChime = () => {
    playSingleChime(0);
    playSingleChime(0.55);
    playSingleChime(1.1);
  };

  const triggerOrderNotification = (order: any) => {
    if (!order?.id || notifiedIds.current.has(order.id)) return;
    notifiedIds.current.add(order.id);

    playCashChime();

    const shortId = order.id ? order.id.split("-")[0].toUpperCase() : "";
    const amountStr = order.total_amount ? Number(order.total_amount).toLocaleString("vi-VN") + " đ" : "";

    toast.success("🔔 ĐƠN HÀNG MỚI NỔ!", {
      description: `Khách hàng vừa đặt đơn #${shortId} trị giá ${amountStr}`,
      duration: 10000,
      action: {
        label: "Xem ngay",
        onClick: () => router.push("/dashboard/orders"),
      },
    });
  };

  const triggerUpdateNotification = (data: { id: string; status: string }) => {
    if (!data?.id) return;
    playSingleChime(0);

    const shortId = data.id.split("-")[0].toUpperCase();
    if (data.status === "cancelled") {
      toast.error("⚠️ ĐƠN HÀNG VỪA BỊ HỦY!", {
        description: `Khách hàng vừa thao tác hủy đơn #${shortId}`,
        duration: 8000,
        action: { label: "Kiểm tra", onClick: () => router.push("/dashboard/orders") }
      });
    } else {
      toast.info("🔄 ĐƠN HÀNG CẬP NHẬT!", {
        description: `Đơn #${shortId} chuyển trạng thái: ${data.status}`,
        duration: 5000,
      });
    }
  };

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const unlock = () => {
      const ctx = getAudioCtx();
      if (ctx && ctx.state === "suspended") ctx.resume();
    };
    window.addEventListener("click", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });

    let bc: BroadcastChannel | null = null;
    if (typeof window !== "undefined" && window.BroadcastChannel) {
      bc = new BroadcastChannel("admin_orders_channel");
      bc.onmessage = (event) => {
        if (event.data?.type === "NEW_ORDER" && event.data.order) {
          triggerOrderNotification(event.data.order);
        } else if (event.data?.type === "ORDER_UPDATED") {
          triggerUpdateNotification(event.data);
        }
      };
    }

    const channel = supabase
      .channel("global-admin-orders-notifier")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, (payload) => {
        triggerOrderNotification(payload.new);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders" }, (payload) => {
        triggerUpdateNotification(payload.new as any);
      })
      .on("broadcast", { event: "NEW_ORDER" }, (payload) => {
        if (payload.payload) triggerOrderNotification(payload.payload);
      })
      .on("broadcast", { event: "ORDER_UPDATED" }, (payload) => {
        if (payload.payload) triggerUpdateNotification(payload.payload);
      })
      .subscribe();

    return () => {
      window.removeEventListener("click", unlock);
      window.removeEventListener("keydown", unlock);
      if (bc) bc.close();
      supabase.removeChannel(channel);
    };
  }, [router]);

  return null;
}
