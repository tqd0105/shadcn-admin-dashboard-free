"use client";

import { useEffect, useState, useRef, use, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { getPaymentByOrderId, createPayment, getVietQRUrl, getBankConfig, Payment } from "@/lib/services/payment.service";
import { Button } from "@/components/ui/button";
import {
  IconLoader2,
  IconCheck,
  IconCopy,
  IconClock,
  IconAlertCircle,
  IconArrowLeft,
  IconBuildingBank,
  IconQrcode,
  IconSparkles,
  IconRefresh,
  IconX,
  IconArrowBackUp,
  IconShoppingCart
} from "@tabler/icons-react";
import { toast } from "sonner";

/**
 * Hiệu ứng pháo giấy chúc mừng bằng HTML5 Canvas nguyên bản (0 dependencies)
 */
function CanvasConfetti() {
  useEffect(() => {
    const canvas = document.getElementById("payment-confetti") as HTMLCanvasElement | null;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: any[] = [];
    const colors = ["#10B981", "#3B82F6", "#F59E0B", "#EC4899", "#8B5CF6", "#06B6D4", "#EAB308"];

    for (let i = 0; i < 150; i++) {
      particles.push({
        x: canvas.width / 2,
        y: canvas.height / 3,
        vx: (Math.random() - 0.5) * 18,
        vy: (Math.random() - 0.8) * 18 - 4,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        vr: (Math.random() - 0.5) * 12,
        gravity: 0.35
      });
    }

    let animationId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let active = false;
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.rotation += p.vr;
        if (p.y < canvas.height + 50) active = true;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      }
      if (active) {
        animationId = requestAnimationFrame(animate);
      }
    };
    animate();

    const handleResize = () => {
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return <canvas id="payment-confetti" className="fixed inset-0 pointer-events-none z-50" />;
}

/**
 * Phát âm thanh chúc mừng bằng Web Audio API
 */
function playSuccessSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = ctx.currentTime;
    const freqs = [523.25, 659.25, 783.99, 1046.50]; // Hợp âm C Major (Đô - Mi - Sol - Đô cao)
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.18, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.5);
    });
  } catch (err) {
    console.error("Audio error:", err);
  }
}

export default function PaymentPage({ params }: { params: Promise<{ orderId: string }> }) {
  const resolvedParams = use(params);
  const orderId = resolvedParams.orderId;
  const router = useRouter();

  const [order, setOrder] = useState<any>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<number>(600);
  const [status, setStatus] = useState<"PENDING" | "SUCCESS" | "EXPIRED">("PENDING");
  const [refreshing, setRefreshing] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const bankConfig = getBankConfig();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const successPlayedRef = useRef(false);

  /**
   * Tạo nội dung chuyển khoản chuẩn theo ý tưởng: Tên-SĐT-MãGD
   * Ví dụ: DUNG-0123456789-LX123456
   */
  const getCustomTransferNote = () => {
    if (!payment) return "";
    const fullName = order?.addresses?.full_name || order?.shipping_address?.full_name || order?.full_name || "";
    const phoneStr = (order?.addresses?.phone || order?.shipping_address?.phone || order?.phone || "").replace(/\D/g, "");

    // Trích xuất từ cuối cùng trong Họ và Tên (Chỉ lấy tên, viết không dấu uppercase)
    let firstName = "KH";
    if (fullName) {
      const noAccent = fullName
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .replace(/[^a-zA-Z0-9\s]/g, "")
        .trim()
        .toUpperCase();
      const words = noAccent.split(/\s+/).filter(Boolean);
      if (words.length > 0) {
        firstName = words[words.length - 1];
      }
    }

    const codeWithoutDash = payment.payment_code.replace(/^LX-/i, "LX");
    if (firstName !== "KH" && phoneStr) {
      return `${firstName}-${phoneStr}-${codeWithoutDash}`;
    }
    return codeWithoutDash;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Đã sao chép ${label}!`, {
      description: text
    });
  };

  const checkStatusAndExpiry = useCallback((payData: Payment) => {
    if (payData.status === "MATCHED" || payData.status === "MANUAL") {
      setStatus("SUCCESS");
      if (!successPlayedRef.current) {
        successPlayedRef.current = true;
        playSuccessSound();
      }
      return;
    }

    const expiresAtMs = new Date(payData.expires_at).getTime();
    const remainingSeconds = Math.floor((expiresAtMs - Date.now()) / 1000);

    if (remainingSeconds <= 0 || payData.status === "EXPIRED") {
      setStatus("EXPIRED");
      setTimeLeft(0);
    } else {
      setStatus("PENDING");
      setTimeLeft(remainingSeconds);
    }
  }, []);

  // 1. Tải thông tin đơn hàng và phiên thanh toán
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Lấy thông tin đơn hàng
      const { data: orderData, error: orderErr } = await supabase
        .from("orders")
        .select("*, addresses(full_name, phone)")
        .eq("id", orderId)
        .single();

      if (orderErr || !orderData) {
        toast.error("Không tìm thấy đơn hàng!");
        router.push("/account/orders");
        return;
      }
      setOrder(orderData);

      // Lấy hoặc tạo payment
      const { data: payData } = await getPaymentByOrderId(orderId);
      if (payData) {
        setPayment(payData);
        checkStatusAndExpiry(payData);
      } else {
        // Nếu chưa có payment thì tự động tạo mới
        const { data: newPay, error: payErr } = await createPayment(orderId, orderData.total_amount);
        if (payErr || !newPay) {
          toast.error("Lỗi khởi tạo cổng thanh toán!");
        } else {
          setPayment(newPay);
          checkStatusAndExpiry(newPay);
        }
      }
    } catch (err) {
      console.error("Lỗi tải trang thanh toán:", err);
    } finally {
      setLoading(false);
    }
  }, [orderId, router, checkStatusAndExpiry]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 2. Đồng hồ đếm ngược 10 phút
  useEffect(() => {
    if (status !== "PENDING" || timeLeft <= 0) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setStatus("EXPIRED");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status, timeLeft]);

  // 3. Supabase Realtime Listener (Lắng nghe khi đơn chuyển sang MATCHED)
  useEffect(() => {
    if (!payment?.id) return;

    console.log("📡 [Realtime] Đang kết nối kênh lắng nghe thanh toán QR:", payment.id);
    const channel = supabase
      .channel(`qr-payment-${payment.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "payments",
          filter: `id=eq.${payment.id}`,
        },
        (payload) => {
          console.log("🔔 [Realtime] Nhận tín hiệu cập nhật payment:", payload);
          const newPay = payload.new as Payment;
          setPayment(newPay);
          if (newPay.status === "MATCHED" || newPay.status === "MANUAL") {
            setStatus("SUCCESS");
            if (!successPlayedRef.current) {
              successPlayedRef.current = true;
              playSuccessSound();
              toast.success("🎉 Thanh toán đã được xác nhận thành công!");
            }
          } else if (newPay.status === "EXPIRED") {
            setStatus("EXPIRED");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [payment?.id]);

  // 4. Hàm làm mới mã QR khi hết hạn
  const handleRegenerateQR = async () => {
    if (!order) return;
    setRefreshing(true);
    const { data: newPay, error } = await createPayment(order.id, order.total_amount);
    setRefreshing(false);
    if (error || !newPay) {
      toast.error("Không thể tạo mã mới, vui lòng thử lại sau.");
    } else {
      setPayment(newPay);
      setStatus("PENDING");
      const expiresAtMs = new Date(newPay.expires_at).getTime();
      setTimeLeft(Math.floor((expiresAtMs - Date.now()) / 1000));
      toast.success("Đã tạo mã thanh toán mới!");
    }
  };

  // 5. Hàm hủy thanh toán & hoàn lại sản phẩm vào giỏ hàng (hoặc quay lại bước trước)
  const handleCancelAndRestore = async (redirectTo: "/checkout" | "/cart" = "/checkout") => {
    if (!order) return;
    setCancelling(true);
    try {
      // 1. Cập nhật trạng thái đơn hàng thành cancelled
      await supabase.from("orders").update({ status: "cancelled" }).eq("id", order.id);

      // 2. Cập nhật trạng thái payment thành EXPIRED
      if (payment?.id) {
        await supabase.from("payments").update({ status: "EXPIRED" }).eq("id", payment.id);
      }

      // 3. Lấy lại danh sách sản phẩm trong đơn hàng để hoàn vào giỏ
      const { data: orderItems } = await supabase
        .from("order_items")
        .select("product_id, variant_id, quantity")
        .eq("order_id", order.id);

      if (orderItems && orderItems.length > 0) {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData.user?.id || order.user_id;

        if (userId) {
          const restorePayload = orderItems.map((item: any) => ({
            user_id: userId,
            product_id: item.product_id,
            variant_id: item.variant_id || null,
            quantity: item.quantity
          }));
          await supabase.from("cart_items").insert(restorePayload);

          // Kích hoạt sự kiện để Header/Navbar cập nhật lại huy hiệu số lượng giỏ hàng
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("cart-updated"));
          }
        }
      }

      if (redirectTo === "/checkout") {
        toast.info("Đã quay lại bước đặt hàng!", {
          description: "Các sản phẩm đã được giữ nguyên để bạn chọn lại phương thức thanh toán."
        });
      } else {
        toast.info("Đã hủy thanh toán & Hoàn giỏ hàng!", {
          description: "Toàn bộ sản phẩm đã được trả lại giỏ hàng của bạn."
        });
      }
      router.push(redirectTo);
    } catch (err) {
      console.error("Lỗi khi hủy đơn & hoàn giỏ hàng:", err);
      toast.error("Có lỗi xảy ra khi hủy thanh toán.");
      setCancelling(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <IconLoader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium animate-pulse">Đang kết nối cổng thanh toán VietQR...</p>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-10 px-4 md:px-6 mx-auto">
      {status === "SUCCESS" && <CanvasConfetti />}

      {/* Nút quay lại bước trước & Hủy thanh toán */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        {status === "PENDING" ? (
          <button
            type="button"
            onClick={() => handleCancelAndRestore("/checkout")}
            disabled={cancelling}
            className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors disabled:opacity-50 cursor-pointer"
          >
            {cancelling ? <IconLoader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <IconArrowLeft className="w-4 h-4 mr-1.5" />}
            Quay lại bước trước (Chọn địa chỉ & thanh toán)
          </button>
        ) : (
          <Link href="/account/orders" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            <IconArrowLeft className="w-4 h-4 mr-1" /> Quay lại danh sách đơn hàng
          </Link>
        )}
        {status === "PENDING" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleCancelAndRestore("/cart")}
            disabled={cancelling}
            className="text-destructive hover:text-destructive hover:bg-destructive/10 font-semibold text-xs md:text-sm cursor-pointer hidden sm:flex"
          >
            {cancelling ? <IconLoader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <IconArrowBackUp className="w-4 h-4 mr-1.5" />}
            Hủy thanh toán & Về giỏ hàng
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* CỘT TRÁI: THÔNG TIN CHUYỂN KHOẢN & QR */}
        <div className="md:col-span-7 bg-card border rounded-3xl p-6 md:p-8 shadow-xl shadow-black/5 relative overflow-hidden">
          <div className="flex items-center justify-between border-b pb-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <IconQrcode className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Cổng Thanh Toán VietQR</h1>
                <p className="text-xs text-muted-foreground">Quét mã bằng ứng dụng Ngân hàng</p>
              </div>
            </div>
            {status === "PENDING" && (
              <div className="flex items-center gap-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 px-3 py-1.5 rounded-full text-xs font-semibold border border-amber-500/20 animate-pulse">
                <IconClock className="w-4 h-4" />
                <span>{formatTime(timeLeft)}</span>
              </div>
            )}
          </div>

          {status === "SUCCESS" ? (
            /* TRẠNG THÁI THÀNH CÔNG */
            <div className="py-12 text-center space-y-6 animate-in fade-in zoom-in duration-500">
              <div className="w-20 h-20 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto ring-8 ring-green-500/5 shadow-inner">
                <IconCheck className="w-10 h-10 stroke-[3]" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-green-600 dark:text-green-400 flex items-center justify-center gap-2">
                  <span>Thanh toán thành công!</span>
                </h2>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Hệ thống đã xác thực giao dịch tự động thành công. Đơn hàng <strong className="text-foreground">#{order?.id.split("-")[0].toUpperCase()}</strong> của bạn đã được xác nhận và đang chuyển sang bộ phận đóng gói!
                </p>
              </div>
              <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild size="lg" className="font-bold shadow-lg shadow-primary/25 rounded-xl">
                  <Link href="/account/orders">Xem chi tiết đơn hàng</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="rounded-xl font-semibold">
                  <Link href="/">Tiếp tục mua sắm</Link>
                </Button>
              </div>
            </div>
          ) : status === "EXPIRED" ? (
            /* TRẠNG THÁI HẾT HẠN */
            <div className="py-12 text-center space-y-6 animate-in fade-in duration-300">
              <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto">
                <IconAlertCircle className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-destructive">Mã thanh toán đã hết hạn</h2>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Phiên làm việc 10 phút đã kết thúc để đảm bảo an toàn giao dịch. Bạn vui lòng tạo mã mới để tiếp tục.
                </p>
              </div>
              <Button onClick={handleRegenerateQR} size="lg" disabled={refreshing} className="rounded-xl font-bold shadow-md">
                {refreshing ? <IconLoader2 className="w-5 h-5 mr-2 animate-spin" /> : <IconRefresh className="w-5 h-5 mr-2" />}
                Tạo lại mã thanh toán mới
              </Button>
            </div>
          ) : (
            /* TRẠNG THÁI ĐANG CHỜ THANH TOÁN (PENDING) */
            <div className="space-y-6">
              {/* Ảnh QR Code */}
              <div className="bg-white p-6 rounded-3xl border-2 border-dashed border-primary/20 flex flex-col items-center justify-center shadow-inner relative group">
                {payment && (
                  <Image
                    width={256}
                    height={256}
                    unoptimized
                    src={getVietQRUrl({ amount: payment.amount, paymentCode: payment.payment_code, addInfo: getCustomTransferNote() })}
                    alt="VietQR Chuyển khoản"
                    className="w-80 h-80 object-contain transition-transform group-hover:scale-105 duration-300"
                  />
                )}
                {/* <div className="mt-4 text-center">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ngân hàng thụ hưởng</p>
                  <p className="text-base font-bold text-primary flex items-center justify-center gap-1.5 mt-0.5">
                    <IconBuildingBank className="w-5 h-5" /> VPBank
                  </p>
                </div> */}
              </div>

              {/* Hướng dẫn quét */}
              <div className="bg-primary/5 border border-primary/15 rounded-2xl p-4 text-xs text-primary/90 space-y-1.5">
                <p className="font-bold flex items-center gap-1.5">
                  <IconSparkles className="w-4 h-4 text-amber-500" /> Hướng dẫn chuyển khoản nhanh 100% tự động:
                </p>
                <p>1. Mở App ngân hàng bất kỳ hoặc MoMo, chọn <strong>Quét mã QR</strong>.</p>
                <p>2. Kiểm tra đúng số tiền và <strong>Nội dung chuyển khoản (Mã LX-...)</strong> đã điền sẵn.</p>
                <p>3. Xác nhận chuyển tiền &rarr; Hệ thống sẽ phát tín hiệu âm thanh và thông báo thành công ngay lập tức!</p>
              </div>
            </div>
          )}
        </div>

        {/* CỘT PHẢI: CHI TIẾT TÀI KHOẢN & ĐƠN HÀNG */}
        <div className="md:col-span-5 space-y-6">
          <div className="bg-card border rounded-3xl p-6 shadow-lg shadow-black/5 space-y-5">
            <p className="text-md text-muted-foreground border-b font-semibold pb-3 text-foreground flex items-center justify-between">
              <span>Ngân hàng thụ hưởng</span>
              <span className="text-lg font-bold text-green-700">{bankConfig.bankId}</span>
            </p>

            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Chủ tài khoản:</span>
                <span className="font-bold uppercase text-foreground">{bankConfig.accountName}</span>
              </div>

              <div className="flex justify-between items-center bg-muted/50 p-3 rounded-xl border">
                <div>
                  <span className="text-xs text-muted-foreground block">Số tài khoản:</span>
                  <span className="font-mono font-bold text-base text-foreground tracking-wider">{bankConfig.accountNo}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2.5 rounded-lg text-xs font-semibold bg-background hover:bg-primary hover:text-primary-foreground transition-all"
                  onClick={() => handleCopy(bankConfig.accountNo, "Số tài khoản")}
                >
                  <IconCopy className="w-3.5 h-3.5 mr-1" /> Copy
                </Button>
              </div>

              <div className="flex justify-between items-center bg-muted/50 p-3 rounded-xl border">
                <div>
                  <span className="text-xs text-muted-foreground block">Số tiền cần chuyển:</span>
                  <span className="font-bold text-lg text-primary">{payment ? formatCurrency(payment.amount) : "0 ₫"}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2.5 rounded-lg text-xs font-semibold bg-background hover:bg-primary hover:text-primary-foreground transition-all"
                  onClick={() => handleCopy((payment?.amount || 0).toString(), "Số tiền")}
                >
                  <IconCopy className="w-3.5 h-3.5 mr-1" /> Copy
                </Button>
              </div>

              <div className="flex justify-between items-center bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-2xl">
                <div>
                  <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 block">Nội dung chuyển khoản (Bắt buộc):</span>
                  <span className="font-mono font-black text-lg md:text-xl text-amber-600 dark:text-amber-300 tracking-wider block mt-0.5">
                    {getCustomTransferNote() || "..."}
                  </span>
                </div>
                <Button
                  variant="default"
                  size="sm"
                  className="h-9 px-3 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20 transition-all shrink-0 ml-2"
                  onClick={() => handleCopy(getCustomTransferNote(), "Nội dung chuyển khoản")}
                >
                  <IconCopy className="w-4 h-4 mr-1.5" /> Copy
                </Button>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Mã đơn hàng:</span>
                <span className="font-mono font-medium">#{order?.id.split("-")[0].toUpperCase()}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Trạng thái thanh toán:</span>
                <span className={`font-bold ${status === "SUCCESS" ? "text-green-600" : status === "EXPIRED" ? "text-destructive" : "text-amber-600"}`}>
                  {status === "SUCCESS" ? "Đã thanh toán" : status === "EXPIRED" ? "Hết hạn" : "Đang chờ thanh toán..."}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-muted/40 rounded-2xl p-4 text-xs text-muted-foreground space-y-2 border">
            <p className="font-semibold text-foreground">💡 Lưu ý quan trọng:</p>
            <p>- Bạn vui lòng nhập **ĐÚNG** Nội dung chuyển khoản là <strong className="text-foreground">{getCustomTransferNote()}</strong> để hệ thống nhận diện tự động.</p>
            <p>- Ngay sau khi ngân hàng {bankConfig.bankId} báo nhận tiền, màn hình này sẽ tự động thông báo kèm âm thanh và chuyển thành trạng thái thành công trong vòng vài giây!</p>
          </div>

          {status === "PENDING" && (
            <Button
              variant="outline"
              size="lg"
              onClick={() => handleCancelAndRestore("/cart")}
              disabled={cancelling}
              className="w-full rounded-2xl border-destructive/30 text-destructive hover:bg-destructive hover:text-white font-bold shadow-sm transition-all h-12 cursor-pointer flex sm:hidden"
            >
              {cancelling ? <IconLoader2 className="w-5 h-5 mr-2 animate-spin" /> : <IconShoppingCart className="w-5 h-5 mr-2" />}
              Hủy thanh toán & Hoàn lại giỏ hàng
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
