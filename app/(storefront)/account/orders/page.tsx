"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Image from "next/image";
import { getMyOrders, updateOrderStatus } from "@/lib/services/order.service";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/auth-provider";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { IconLoader2, IconPackage, IconX } from "@tabler/icons-react";
import { Clock, Package, Truck, CheckCircle2, AlertTriangle, CreditCard, Star, Search, SearchX, Calendar, RotateCcw, Filter, CheckCheck, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProductReviewModal, ReviewItemData } from "@/components/storefront/product-review-modal";
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
    { key: "delivered", label: "Đã giao", icon: CheckCircle2 },
    { key: "completed", label: "Đã nhận hàng", icon: CheckCheck },
  ];

  // Chuẩn hóa trạng thái (đồng bộ hoàn toàn với danh sách trạng thái trong Admin)
  const normalized = status === "processing" ? "paid" : status === "shipped" ? "shipping" : status;
  const currentStepIndex = steps.findIndex((s) => s.key === normalized);
  const activeIndex = currentStepIndex === -1 ? 0 : currentStepIndex;

  return (
    <>
      {/* Mobile view (< 640px): Compact Stepper with exact dot alignment */}
      <div className="flex sm:hidden flex-col gap-3 py-3.5 px-3 border-b border-border/60 bg-muted/20">
        <div className="flex items-center justify-between text-xs font-semibold px-1">
          <div className="flex items-center gap-2 text-primary">
            {(() => {
              const CurrentIcon = steps[activeIndex]?.icon || Clock;
              return <CurrentIcon className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" />;
            })()}
            <span className="text-green-700 dark:text-green-400 font-bold">
              Bước {activeIndex + 1}/{steps.length}: {steps[activeIndex]?.label}
            </span>
          </div>
          <span className="text-[11px] font-medium text-muted-foreground shrink-0">
            {activeIndex === steps.length - 1 ? "Hoàn tất" : "Đang tiến hành"}
          </span>
        </div>

        {/* Unified Step Track: Connecting line stops EXACTLY at the center of the active dot */}
        <div className="relative flex items-center justify-between w-full px-2 py-1">
          {/* Background line connecting center of first dot to center of last dot */}
          <div className="absolute top-1/2 -translate-y-1/2 left-[16px] right-[16px] h-[3px] bg-border/80 -z-0">
            <div
              className="h-full bg-green-600 dark:bg-green-500 transition-all duration-500 rounded-full"
              style={{ width: `${(activeIndex / (steps.length - 1)) * 100}%` }}
            />
          </div>

          {/* 5 mini dots directly positioned on the track line */}
          {steps.map((step, idx) => {
            const isCompleted = idx < activeIndex;
            const isCurrent = idx === activeIndex;
            return (
              <div
                key={step.key}
                className="relative z-10 flex flex-col items-center justify-center"
              >
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isCompleted
                      ? "bg-green-600 dark:bg-green-500 text-white shadow-2xs scale-105"
                      : isCurrent
                      ? "bg-background border-2 border-green-600 ring-4 ring-green-600/25 shadow-sm scale-110"
                      : "bg-muted border border-border"
                  }`}
                >
                  {isCompleted && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  {isCurrent && <div className="w-1.5 h-1.5 rounded-full bg-green-600" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Desktop & Tablet view (>= 640px): Horizontal Circles Timeline */}
      <div className="hidden sm:block py-3 px-6 border-b border-border/60 bg-muted/15">
        <div className="relative flex items-center justify-between w-full max-w-xl mx-auto">
          {/* Connecting line stopping EXACTLY at center of circle */}
          <div className="absolute top-[13px] left-[14px] right-[14px] h-[2px] bg-border -z-0">
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
                  className={`mt-1.5 text-xs text-center transition-colors whitespace-nowrap ${
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
    </>
  );
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: "Chờ xử lý", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  paid: { label: "Đã thanh toán", color: "bg-blue-100 text-blue-800 border-blue-200" },
  processing: { label: "Đang xử lý", color: "bg-blue-100 text-blue-800 border-blue-200" },
  shipping: { label: "Đang giao", color: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  shipped: { label: "Đang giao", color: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  delivered: { label: "Chờ xác nhận", color: "bg-cyan-100 text-cyan-800 border-cyan-200" },
  completed: { label: "Đã nhận hàng", color: "bg-green-100 text-green-800 border-green-200" },
  cancelled: { label: "Đã hủy", color: "bg-red-100 text-red-800 border-red-200" },
};

const STATUS_GROUPS: Record<string, string[]> = {
  pending: ["pending", "processing", "paid"],
  shipping: ["shipping", "shipped"],
  delivered: ["delivered"],
  completed: ["completed"],
  cancelled: ["cancelled"],
};

const TIME_RANGE_DAYS: Record<string, number> = {
  "30days": 30,
  "90days": 90,
  "180days": 180,
};

const matchStatus = (orderStatus: string, filterKey: string): boolean => {
  if (filterKey === "all") return true;
  return (STATUS_GROUPS[filterKey] || [filterKey]).includes(orderStatus);
};

const matchTimeRange = (createdAt: string, filterKey: string, currentTime: number): boolean => {
  if (filterKey === "all" || !TIME_RANGE_DAYS[filterKey]) return true;
  return new Date(createdAt).getTime() >= currentTime - TIME_RANGE_DAYS[filterKey] * 24 * 60 * 60 * 1000;
};

const matchSearchQuery = (order: any, query: string): boolean => {
  if (!query) return true;
  const q = query.toLowerCase();
  const shortId = order.id.split("-")[0].toLowerCase();
  
  if (order.id.toLowerCase().includes(q) || shortId.includes(q) || `#${shortId}`.includes(q)) return true;
  
  const paymentObj = Array.isArray(order.payments) ? order.payments[0] : order.payments;
  if (paymentObj?.payment_code?.toLowerCase().includes(q)) return true;
  
  return Boolean(
    order.order_items?.some((item: any) => 
      (item.products?.name?.toLowerCase() || "").includes(q) || 
      (item.product_variants?.name?.toLowerCase() || "").includes(q)
    )
  );
};

export default function MyOrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>("all");
  const [currentTime] = useState(() => Date.now());

  // Modal state
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<string | null>(null);

  // Confirm receive state
  const [confirmReceiveModalOpen, setConfirmReceiveModalOpen] = useState(false);
  const [orderToReceive, setOrderToReceive] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  // Review modal state
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [itemToReview, setItemToReview] = useState<ReviewItemData | null>(null);
  const [reviewedProductIds, setReviewedProductIds] = useState<Set<string>>(new Set());

  const handleConfirmReceivedOrder = async () => {
    if (!orderToReceive) return;
    setConfirmingId(orderToReceive);
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: "completed" })
        .eq("id", orderToReceive)
        .eq("user_id", user?.id);

      if (error) throw error;

      toast.success("Đã xác nhận nhận được hàng. Cảm ơn quý khách đã mua sắm!");
      
      setOrders(prev =>
        prev.map(o => (o.id === orderToReceive ? { ...o, status: "completed" } : o))
      );
      if (typeof window !== "undefined" && window.BroadcastChannel) {
        new BroadcastChannel("admin_orders_channel").postMessage({
          type: "ORDER_UPDATED",
          id: orderToReceive,
          status: "completed",
        });
      }
    } catch (err: any) {
      console.error("Lỗi xác nhận nhận hàng:", err);
      toast.error(err.message || "Không thể xác nhận nhận hàng. Vui lòng thử lại sau.");
    } finally {
      setConfirmingId(null);
      setOrderToReceive(null);
      setConfirmReceiveModalOpen(false);
    }
  };

  // Filtered orders using declarative helper predicates (No nested if/else ladders)
  const filteredOrders = useMemo(() => {
    const trimmedQuery = searchQuery.trim();
    return orders.filter(
      (order) =>
        matchStatus(order.status, selectedStatus) &&
        matchTimeRange(order.created_at, selectedTimeRange, currentTime) &&
        matchSearchQuery(order, trimmedQuery)
    );
  }, [orders, selectedStatus, selectedTimeRange, searchQuery, currentTime]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: 0, pending: 0, shipping: 0, delivered: 0, completed: 0, cancelled: 0 };
    const trimmedQuery = searchQuery.trim();

    orders.forEach((order) => {
      if (!matchTimeRange(order.created_at, selectedTimeRange, currentTime) || !matchSearchQuery(order, trimmedQuery)) {
        return;
      }
      counts.all++;
      for (const [groupKey, statuses] of Object.entries(STATUS_GROUPS)) {
        if (statuses.includes(order.status)) {
          counts[groupKey] = (counts[groupKey] || 0) + 1;
          break;
        }
      }
    });
    return counts;
  }, [orders, selectedTimeRange, searchQuery, currentTime]);

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedStatus("all");
    setSelectedTimeRange("all");
  };

  const fetchOrders = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setTimeout(() => setLoading(true), 0);
    }
    const { data, error } = await getMyOrders();
    if (!error && data) {
      setOrders(data);
    }

    if (user?.id) {
      const { data: myReviews } = await supabase
        .from("product_reviews")
        .select("product_id")
        .eq("user_id", user.id);
      if (myReviews) {
        setReviewedProductIds(new Set(myReviews.map((r) => r.product_id)));
      }
    }

    if (showLoading) {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
      } else {
        setTimeout(() => {
          fetchOrders(true);
        }, 0);

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
      
      {/* 1. Status Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-4 border-b border-border/60 scrollbar-none">
        {[
          { key: "all", label: "Tất cả", icon: Package },
          { key: "pending", label: "Chờ xử lý", icon: Clock },
          { key: "shipping", label: "Đang giao", icon: Truck },
          { key: "delivered", label: "Chờ xác nhận", icon: CheckCircle2 },
          { key: "completed", label: "Đã nhận hàng", icon: CheckCheck },
          { key: "cancelled", label: "Đã hủy", icon: AlertTriangle },
        ].map((tab) => {
          const isActive = selectedStatus === tab.key;
          const count = statusCounts[tab.key] || 0;
          const TabIcon = tab.icon;

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setSelectedStatus(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all shrink-0 border ${
                isActive
                  ? "bg-primary text-primary-foreground border-primary shadow-xs"
                  : "bg-card hover:bg-muted/60 text-muted-foreground border-border/70"
              }`}
            >
              <TabIcon className="size-3.5" />
              <span>{tab.label}</span>
              <span
                className={`ml-0.5 px-1.5 py-0.5 text-[10px] rounded-full font-bold ${
                  isActive
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 2. Smart Search & Time Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6 bg-card/60 p-3.5 rounded-xl border border-border/70 shadow-2xs">
        {/* Search Box */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="Tìm theo mã đơn (#ORD...), mã thanh toán hoặc tên sản phẩm..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9 h-9 text-xs bg-background border-border/60 focus-visible:ring-primary rounded-lg w-full"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              title="Xóa từ khóa"
            >
              <IconX className="size-3.5" />
            </button>
          )}
        </div>

        {/* Time Range Selector & Reset Button */}
        <div className="flex items-center gap-2 overflow-x-auto shrink-0 justify-end">
          <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg border border-border/40">
            {[
              { key: "all", label: "Tất cả thời gian" },
              { key: "30days", label: "30 ngày" },
              { key: "90days", label: "3 tháng" },
              { key: "180days", label: "6 tháng" },
            ].map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setSelectedTimeRange(t.key)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all shrink-0 ${
                  selectedTimeRange === t.key
                    ? "bg-background text-foreground shadow-2xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {(searchQuery || selectedStatus !== "all" || selectedTimeRange !== "all") && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={resetFilters}
              className="h-8 px-2.5 text-xs text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-600 shrink-0 flex items-center gap-1.5"
            >
              <RotateCcw className="size-3" />
              <span className="hidden sm:inline">Xóa bộ lọc</span>
            </Button>
          )}
        </div>
      </div>

      {/* 3. Filtered Orders List or Empty State */}
      {filteredOrders.length === 0 ? (
        <div className="bg-card/40 border border-dashed rounded-2xl py-16 px-4 text-center flex flex-col items-center justify-center space-y-3 my-4 animate-in fade-in duration-300">
          <div className="size-12 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground">
            <SearchX className="size-6" />
          </div>
          <h3 className="text-base font-semibold text-foreground">Không tìm thấy đơn hàng phù hợp</h3>
          <p className="text-xs text-muted-foreground max-w-sm">
            Không có đơn hàng nào khớp với bộ lọc trạng thái, khoảng thời gian hoặc từ khóa tìm kiếm của bạn.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={resetFilters}
            className="mt-2 text-xs h-8 px-4 font-medium"
          >
            <RotateCcw className="size-3.5 mr-1.5" />
            Xóa bộ lọc & xem tất cả ({orders.length} đơn)
          </Button>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredOrders.map(order => {
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-xl bg-muted/30 border text-xs">
                  <div className="flex items-center gap-2 min-w-0 flex-wrap">
                    <CreditCard className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">Phương thức:</span>
                    <strong className="font-semibold text-foreground">
                      {isBanking ? "Chuyển khoản VietQR" : "Thanh toán khi nhận hàng (COD)"}
                    </strong>
                    {isBanking && paymentObj?.payment_code && (
                      <span className="font-mono font-bold text-[11px] px-1.5 py-0.5 rounded bg-background border text-primary shadow-2xs">
                        {paymentObj.payment_code}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-2.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50">
                    <span className="text-[11px] font-semibold text-muted-foreground bg-background px-2.5 py-1 rounded-md border shadow-2xs">
                      {isBanking ? (
                        payStatus === 'MATCHED' ? '✅ Đã chuyển khoản' : payStatus === 'MANUAL' ? '✅ Đã xác nhận' : payStatus === 'EXPIRED' ? '❌ Hết hạn ' : '⏳ Chờ chuyển khoản'
                      ) : (
                        (order.status === 'delivered' || order.status === 'completed') ? '✅ Đã thu tiền (COD)' : '💲 Thanh toán khi nhận'
                      )}
                    </span>
                    {isBanking && (payStatus === 'PENDING' || payStatus === 'CREATED') && order.status === 'pending' && (
                      <Button asChild size="sm" variant="outline" className="h-7 px-3 text-xs font-bold border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors shadow-2xs">
                        <Link href={`/checkout/payment/${order.id}`}>
                          Thanh toán QR
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>

                {/* Product List */}
                <div className="divide-y divide-border/60">
                  {order.order_items?.map((item: any) => {
                    const productId = item.product_id || item.products?.id;
                    return (
                      <div key={item.id} className="py-3.5 first:pt-2 last:pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group/item">
                        <div className="flex gap-3.5 items-start sm:items-center min-w-0 flex-1">
                          <Link 
                            href={productId ? `/product/${productId}` : "#"} 
                            className="shrink-0 block overflow-hidden rounded-md border bg-muted/20"
                            title="Xem chi tiết sản phẩm"
                          >
                            <Image 
                              width={64}
                              height={64}
                              unoptimized
                              src={item.products?.image_url || "https://placehold.co/64x64"} 
                              alt={item.products?.name || "product"} 
                              className="h-16 w-16 object-cover transition-transform duration-300 group-hover/item:scale-105" 
                            />
                          </Link>
                          <div className="flex-1 min-w-0">
                            <Link 
                              href={productId ? `/product/${productId}` : "#"} 
                              className="font-semibold text-sm line-clamp-2 sm:line-clamp-1 hover:text-primary transition-colors block"
                            >
                              {item.products?.name || "Sản phẩm không xác định"}
                            </Link>
                            {item.product_variants && (
                              <p className="text-xs text-muted-foreground mt-0.5">Phân loại: <span className="font-medium text-foreground/80">{item.product_variants.name}</span></p>
                            )}
                            <div className="flex items-center gap-3 mt-1.5 text-xs">
                              <span className="text-muted-foreground">Số lượng: <strong className="text-foreground">x{item.quantity}</strong></span>
                              <span className="text-muted-foreground/40">•</span>
                              <span className="font-bold text-sm text-primary">{formatCurrency(item.price)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Nút Xem chi tiết / Mua lại & Đánh giá dành riêng cho từng sản phẩm */}
                        {productId && (
                          <div className="flex items-center justify-end gap-2 sm:shrink-0 pt-2.5 sm:pt-0 border-t sm:border-t-0 border-border/40">
                            <Button
                              asChild
                              size="sm"
                              variant="outline"
                              className="h-8 px-3 text-xs font-semibold hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all shadow-2xs"
                            >
                              <Link href={`/product/${productId}`}>
                                Xem sản phẩm
                              </Link>
                            </Button>

                            {/* Nút Đánh giá sản phẩm khi đơn hàng đã giao hoặc hoàn tất (delivered / completed) */}
                            {(order.status === "delivered" || order.status === "completed") && (
                              reviewedProductIds.has(productId) ? (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  disabled
                                  className="h-8 px-3 text-xs font-bold text-green-600 dark:text-green-400 bg-green-50/80 dark:bg-green-950/40 border border-green-200 dark:border-green-800"
                                >
                                  <CheckCircle2 className="size-3.5 mr-1" /> Đã đánh giá
                                </Button>
                              ) : (
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={() => {
                                    setItemToReview({
                                      productId: productId,
                                      productName: item.products?.name || "Sản phẩm",
                                      productImage: item.products?.image_url,
                                      variantName: item.product_variants?.name,
                                      price: item.price,
                                      orderId: order.id
                                    });
                                    setReviewModalOpen(true);
                                  }}
                                  className="h-8 px-3.5 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-sm transition-all hover:scale-105 active:scale-95"
                                >
                                  <Star className="size-3.5 mr-1.5 fill-white text-white animate-pulse duration-1000" /> Đánh giá
                                </Button>
                              )
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Action */}
                {order.status === "pending" && (
                  <div className="pt-3 border-t flex justify-end">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="w-full sm:w-auto text-destructive border-destructive/30 hover:bg-destructive/10 h-8 text-xs font-semibold shadow-2xs"
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

                {order.status === "delivered" && (
                  <div className="pt-3 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-cyan-50/50 dark:bg-cyan-950/20 p-3 rounded-lg border border-cyan-200/60 dark:border-cyan-800/40">
                    <div className="flex items-center gap-2 text-xs text-cyan-800 dark:text-cyan-300 font-medium">
                      <CheckCircle2 className="size-4 shrink-0 text-cyan-600 dark:text-cyan-400 animate-pulse" />
                      <span>Đơn hàng đã được giao tới bạn. Hãy kiểm tra sản phẩm và xác nhận nhé!</span>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      disabled={confirmingId === order.id}
                      onClick={() => {
                        setOrderToReceive(order.id);
                        setConfirmReceiveModalOpen(true);
                      }}
                      className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-bold h-9 px-4 shadow-sm shrink-0 cursor-pointer transition-transform active:scale-95"
                    >
                      {confirmingId === order.id ? (
                        <IconLoader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <CheckCheck className="mr-1.5 h-4 w-4" />
                      )}
                      Xác nhận đã nhận hàng
                    </Button>
                  </div>
                )}

                {order.status === "completed" && (
                  <div className="pt-3 border-t flex items-center justify-between gap-3 text-xs text-green-600 dark:text-green-400 font-medium bg-green-50/50 dark:bg-green-950/20 p-2.5 rounded-lg border border-green-200/60 dark:border-green-800/40">
                    <div className="flex items-center gap-2">
                      <CheckCheck className="size-4 shrink-0" />
                      <span>Bạn đã xác nhận nhận hàng và hoàn tất đơn đặt hàng này. Cảm ơn quý khách!</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
        </div>
      )}

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

      <AlertDialog open={confirmReceiveModalOpen} onOpenChange={setConfirmReceiveModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận đã nhận được hàng?</AlertDialogTitle>
            <AlertDialogDescription>
              Vui lòng xác nhận bạn đã nhận đủ sản phẩm, nguyên vẹn và hài lòng với đơn hàng này. Sau khi xác nhận, trạng thái đơn hàng sẽ chuyển sang Đã nhận hàng.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Chưa, tôi kiểm tra thêm</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmReceivedOrder}
              disabled={!!confirmingId}
              className="bg-green-600 hover:bg-green-700 text-white font-bold"
            >
              {confirmingId ? "Đang xử lý..." : "Xác nhận đã nhận hàng"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal đánh giá sản phẩm hiện đại, chuyên nghiệp */}
      <ProductReviewModal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        item={itemToReview}
        onSuccess={(reviewedProductId) => {
          setReviewedProductIds((prev) => new Set(prev).add(reviewedProductId));
        }}
      />
    </div>
  );
}
