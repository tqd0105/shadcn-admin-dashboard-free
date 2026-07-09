"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { getMyOrders, updateOrderStatus } from "@/lib/services/order.service";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/auth-provider";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { IconLoader2, IconPackage, IconX } from "@tabler/icons-react";
import { Clock, Package, Truck, CheckCircle2, AlertTriangle, CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { toast } from "sonner";

function OrderTimeline({ status }: { status: string }) {
  if (status === "cancelled") {
    return (
      <div className="flex items-center gap-2 py-2 px-4 sm:px-6 bg-rose-500/10 border-b border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium">
        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
        <span>Đơn hàng này đã bị hủy.</span>
      </div>
    );
  }

  const steps = [
    { key: "pending", label: "Chờ xử lý", icon: Clock },
    { key: "paid", label: "Đã xác nhận", icon: Package },
    { key: "shipping", label: "Đang giao", icon: Truck },
    { key: "delivered", label: "Hoàn tất", icon: CheckCircle2 },
  ];

  // Chuẩn hóa trạng thái (đồng bộ hoàn toàn với danh sách trạng thái trong Admin)
  const normalized = status === "processing" ? "paid" : status === "shipped" ? "shipping" : status;
  const currentStepIndex = steps.findIndex((s) => s.key === normalized);
  const activeIndex = currentStepIndex === -1 ? 0 : currentStepIndex;

  return (
    <div className="py-2.5 px-4 sm:px-6 border-b border-border/60 bg-muted/15">
      <div className="relative flex items-center justify-between w-full max-w-xl mx-auto">
        {/* Connecting line */}
        <div className="absolute top-[13px] left-6 right-6 h-[2px] bg-border -z-0">
          <div
            className="h-full bg-green-600 dark:bg-green-500 transition-all duration-500"
            style={{ width: `${(activeIndex / (steps.length - 1)) * 100}%` }}
          />
        </div>

        {steps.map((step, idx) => {
          const isCompleted = idx < activeIndex;
          const isCurrent = idx === activeIndex;
          const StepIcon = step.icon;

          return (
            <div key={step.key} className="relative z-10 flex flex-col items-center">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center border transition-all duration-300 ${
                  isCompleted
                    ? "bg-green-600 border-green-600 text-white shadow-sm"
                    : isCurrent
                    ? "bg-background border-green-600 text-green-600 ring-4 ring-green-600/20 font-bold shadow-sm"
                    : "bg-muted border-border text-muted-foreground"
                }`}
              >
                <StepIcon className="w-3.5 h-3.5" />
              </div>
              <span
                className={`mt-1.5 text-[11px] sm:text-xs text-center transition-colors ${
                  isCurrent
                    ? "text-green-600 dark:text-green-400 font-bold"
                    : isCompleted
                    ? "text-foreground font-medium"
                    : "text-muted-foreground"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: "Chờ xử lý", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  paid: { label: "Đã thanh toán", color: "bg-blue-100 text-blue-800 border-blue-200" },
  processing: { label: "Đang xử lý", color: "bg-blue-100 text-blue-800 border-blue-200" },
  shipping: { label: "Đang giao", color: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  shipped: { label: "Đang giao", color: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  delivered: { label: "Đã giao", color: "bg-green-100 text-green-800 border-green-200" },
  cancelled: { label: "Đã hủy", color: "bg-red-100 text-red-800 border-red-200" },
};

export default function MyOrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  
  // Modal state
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<string | null>(null);

  const fetchOrders = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setTimeout(() => setLoading(true), 0);
    }
    const { data, error } = await getMyOrders();
    if (!error && data) {
      setOrders(data);
    }
    if (showLoading) {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
      } else {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchOrders(true);

        // 1. Đồng bộ qua BroadcastChannel (khi Admin mở cùng trình duyệt cập nhật trạng thái)
        let bc: BroadcastChannel | null = null;
        if (typeof window !== "undefined" && window.BroadcastChannel) {
          bc = new BroadcastChannel("admin_orders_channel");
          bc.onmessage = (event) => {
            if (event.data?.type === "ORDER_UPDATED") {
              fetchOrders(false);
            }
          };
        }

        // 2. Đồng bộ Realtime trực tiếp từ Supabase Postgres
        const channel = supabase
          .channel(`customer-orders-${user.id}`)
          .on(
            "postgres_changes",
            { event: "UPDATE", schema: "public", table: "orders", filter: `user_id=eq.${user.id}` },
            () => {
              fetchOrders(false);
            }
          )
          .subscribe();

        // 3. Tự động làm mới ngầm khi người dùng quay lại tab (focus) mà không reload UI
        const handleFocus = () => fetchOrders(false);
        window.addEventListener("focus", handleFocus);

        return () => {
          if (bc) bc.close();
          supabase.removeChannel(channel);
          window.removeEventListener("focus", handleFocus);
        };
      }
    }
  }, [user, authLoading, router, fetchOrders]);

  const confirmCancel = (id: string) => {
    setOrderToCancel(id);
    setCancelModalOpen(true);
  };

  const handleCancelOrder = async () => {
    if (!orderToCancel) return;
    const id = orderToCancel;
    
    setCancellingId(id);
    const { error } = await updateOrderStatus(id, "cancelled");
    setCancellingId(null);
    setOrderToCancel(null);
    
    if (error) {
      toast.error("Lỗi khi hủy đơn hàng: " + error.message);
    } else {
      toast.success("Đã hủy đơn hàng thành công");
      setOrders(orders.map(o => o.id === id ? { ...o, status: "cancelled" } : o));
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center py-20 min-h-[50vh]">
        <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="container mx-auto py-20 text-center space-y-4 min-h-[50vh] flex flex-col items-center justify-center">
        <IconPackage className="h-16 w-16 text-muted-foreground/50 mx-auto" />
        <h2 className="text-2xl font-bold">Chưa có đơn hàng nào</h2>
        <p className="text-muted-foreground">Bạn chưa thực hiện bất kỳ đơn đặt hàng nào.</p>
        <Button onClick={() => router.push("/products")} className="mt-4">
          Bắt đầu mua sắm
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-0">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6">Lịch sử Mua hàng</h1>
      
      <div className="space-y-5">
        {orders.map(order => {
          const paymentObj = Array.isArray(order.payments) ? (order.payments.length > 0 ? order.payments[0] : null) : order.payments;
          const isBanking = order.payment_method === "banking" || (order.payment_method !== "cod" && !!paymentObj);
          const payStatus = paymentObj?.status;

          return (
            <Card key={order.id} className="overflow-hidden gap-0 border shadow-sm">
              <CardHeader className="bg-muted/30 py-3.5 px-4 sm:px-6 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                <div>
                  <CardTitle className="text-sm sm:text-base font-mono font-bold text-foreground">
                    #{order.id.split('-')[0].toUpperCase()}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Ngày đặt: {format(new Date(order.created_at), "dd/MM/yyyy HH:mm", { locale: vi })}
                  </CardDescription>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                  <div className="sm:text-right">
                    <span className="text-[11px] text-muted-foreground sm:block">Tổng thanh toán: </span>
                    <span className="font-bold text-sm sm:text-base text-primary">{formatCurrency(order.total_amount)}</span>
                  </div>
                  <Badge variant="outline" className={`text-xs px-2.5 py-0.5 font-semibold ${STATUS_MAP[order.status]?.color || "bg-gray-100 text-gray-800"}`}>
                    {STATUS_MAP[order.status]?.label || order.status}
                  </Badge>
                </div>
              </CardHeader>

              <OrderTimeline status={order.status} />

              <CardContent className="pt-3.5 pb-4 px-4 sm:px-6 space-y-4">
                {/* Thông tin phương thức thanh toán gọn nhẹ, rõ ràng */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 rounded-lg bg-muted/40 border text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <CreditCard className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">Phương thức:</span>
                    <strong className="font-semibold text-foreground">
                      {isBanking ? "Chuyển khoản VietQR" : "Thanh toán khi nhận hàng (COD)"}
                    </strong>
                    {isBanking && paymentObj?.payment_code && (
                      <span className="font-mono font-bold text-[11px] px-1.5 py-0.5 rounded bg-background border text-primary">
                        {paymentObj.payment_code}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5">
                    <span className="text-[11px] font-medium text-muted-foreground bg-background px-2 py-0.5 rounded border">
                      {isBanking ? (
                        payStatus === 'MATCHED' ? '✅ Đã chuyển khoản' : payStatus === 'MANUAL' ? '✅ Đã xác nhận' : payStatus === 'EXPIRED' ? '❌ Hết hạn ' : '⏳ Chờ chuyển khoản'
                      ) : (
                        order.status === 'delivered' ? '✅ Đã thu tiền (COD)' : '💲 Thanh toán khi nhận'
                      )}
                    </span>
                    {isBanking && (payStatus === 'PENDING' || payStatus === 'CREATED') && order.status === 'pending' && (
                      <Button asChild size="sm" variant="outline" className="h-7 px-2.5 text-xs font-semibold border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors">
                        <Link href={`/checkout/payment/${order.id}`}>
                          Thanh toán QR
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>

                {/* Product List */}
                <div className="divide-y divide-border/60">
                  {order.order_items?.map((item: any) => (
                    <div key={item.id} className="py-3 first:pt-1 last:pb-1 flex gap-3.5 items-center">
                      <Image 
                        width={64}
                        height={64}
                        unoptimized
                        src={item.products?.image_url || "https://placehold.co/64x64"} 
                        alt="product" 
                        className="h-16 w-16 rounded-md border object-cover shrink-0" 
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm line-clamp-1">{item.products?.name}</h4>
                        {item.product_variants && (
                          <p className="text-xs text-muted-foreground mt-0.5">Phân loại: {item.product_variants.name}</p>
                        )}
                        <div className="flex justify-between items-center mt-1.5 text-xs">
                          <span className="text-muted-foreground">Số lượng: x{item.quantity}</span>
                          <span className="font-semibold text-sm text-foreground">{formatCurrency(item.price)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Action */}
                {order.status === "pending" && (
                  <div className="pt-3 border-t flex justify-end">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-destructive border-destructive/30 hover:bg-destructive/10 h-8 text-xs font-medium"
                      disabled={cancellingId === order.id}
                      onClick={() => confirmCancel(order.id)}
                    >
                      {cancellingId === order.id ? (
                        <IconLoader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <IconX className="mr-1.5 h-3.5 w-3.5" />
                      )}
                      Hủy đơn hàng
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <AlertDialog open={cancelModalOpen} onOpenChange={setCancelModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận hủy đơn hàng</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn hủy đơn hàng này không? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Đóng lại</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleCancelOrder}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Chắc chắn hủy
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
