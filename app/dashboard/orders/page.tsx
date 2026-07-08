"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import RoleGuard from "@/components/guards/role-guard";
import { getOrders, updateOrderStatus, getOrderById, deleteOrderAdmin } from "@/lib/services/order.service";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Badge } from "@/components/ui/badge";
import {
  IconSearch,
  IconLoader2,
  IconReceipt,
  IconEye,
  IconPackage,
  IconTrash,
  IconFilter,
  IconCalendar,
  IconArrowsSort,
  IconX,
} from "@tabler/icons-react";
import { format } from "date-fns";

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: "Chờ xử lý", color: "bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20 border-yellow-500/20" },
  paid: { label: "Đã thanh toán", color: "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-blue-500/20" },
  shipping: { label: "Đang giao", color: "bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/20 border-indigo-500/20" },
  delivered: { label: "Đã giao", color: "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20" },
  cancelled: { label: "Đã hủy", color: "bg-red-500/10 text-red-600 hover:bg-red-500/20 border-red-500/20" },
};

function OrdersContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentSearch = searchParams.get("search") || "";
  const currentPage = Number(searchParams.get("page")) || 1;
  const currentStatus = searchParams.get("status") || "all";
  const currentSort = searchParams.get("sort") || "newest";
  const currentDate = searchParams.get("date") || "all";

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [searchInput, setSearchInput] = useState(currentSearch);

  // Detail Dialog State
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Delete State
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Helper đọc unread ids từ localStorage
  const getUnreadFromStorage = () => {
    if (typeof window === "undefined") return new Set<string>();
    try {
      const list = JSON.parse(localStorage.getItem("admin_unread_order_ids") || "[]");
      return new Set<string>(list);
    } catch {
      return new Set<string>();
    }
  };

  // Live Glowing Pool cho các đơn mới nổ trong phiên làm việc (bền vững qua F5)
  const [liveOrderIds, setLiveOrderIds] = useState<Set<string>>(getUnreadFromStorage);

  const loadOrders = useCallback(async () => {
    setTimeout(() => setLoading(true), 0);
    const { data, total, totalPages, error } = await getOrders(
      currentSearch,
      currentPage,
      10,
      { status: currentStatus, sort: currentSort, date: currentDate }
    );
    if (!error && data) {
      setOrders(data);
      setTotal(total);
      setTotalPages(totalPages);
    }

    // Lọc bỏ các ID đơn hàng unread đã bị xóa khỏi CSDL
    const unreadList = Array.from(getUnreadFromStorage());
    if (unreadList.length > 0) {
      const { data: existingOrders } = await supabase
        .from("orders")
        .select("id")
        .in("id", unreadList);
      if (existingOrders) {
        const validIds = new Set(existingOrders.map((o) => o.id));
        const cleanedList = unreadList.filter((id) => validIds.has(id));
        if (cleanedList.length !== unreadList.length) {
          try {
            localStorage.setItem("admin_unread_order_ids", JSON.stringify(cleanedList));
          } catch {}
        }
        setLiveOrderIds(validIds);
      } else {
        setLiveOrderIds(getUnreadFromStorage());
      }
    } else {
      setLiveOrderIds(new Set());
    }
    setLoading(false);
  }, [currentSearch, currentPage, currentStatus, currentSort, currentDate]);

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all" && value !== "newest" && value !== "") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  const clearAllFilters = () => {
    setSearchInput("");
    router.push(pathname);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadOrders();

    const channel = supabase
      .channel("dashboard-orders-table-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, (payload) => {
        if (payload.new?.id) {
          setLiveOrderIds((prev) => new Set(prev).add(payload.new.id));
        }
        loadOrders();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        loadOrders();
      })
      .on("broadcast", { event: "NEW_ORDER" }, (payload) => {
        if (payload.payload?.id) {
          setLiveOrderIds((prev) => new Set(prev).add(payload.payload.id));
        }
        loadOrders();
      })
      .on("broadcast", { event: "ORDER_UPDATED" }, () => {
        loadOrders();
      })
      .subscribe();

    const handleLocalOrder = (event: any) => {
      if (event.detail?.id) {
        try {
          const list = JSON.parse(localStorage.getItem("admin_unread_order_ids") || "[]");
          if (!list.includes(event.detail.id)) {
            list.push(event.detail.id);
            localStorage.setItem("admin_unread_order_ids", JSON.stringify(list));
          }
        } catch {}
        setLiveOrderIds(getUnreadFromStorage());
        loadOrders();
      }
    };
    window.addEventListener("ADMIN_LOCAL_NEW_ORDER", handleLocalOrder);

    let bc: BroadcastChannel | null = null;
    if (typeof window !== "undefined" && window.BroadcastChannel) {
      bc = new BroadcastChannel("admin_orders_channel");
      bc.onmessage = (event) => {
        if (event.data?.type === "NEW_ORDER" && event.data.order?.id) {
          try {
            const list = JSON.parse(localStorage.getItem("admin_unread_order_ids") || "[]");
            if (!list.includes(event.data.order.id)) {
              list.push(event.data.order.id);
              localStorage.setItem("admin_unread_order_ids", JSON.stringify(list));
            }
          } catch {}
          setLiveOrderIds(getUnreadFromStorage());
        }
        loadOrders();
      };
    }

    return () => {
      window.removeEventListener("ADMIN_LOCAL_NEW_ORDER", handleLocalOrder);
      supabase.removeChannel(channel);
      if (bc) bc.close();
    };
  }, [loadOrders]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (searchInput) params.set("search", searchInput);
    else params.delete("search");
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    const { error } = await updateOrderStatus(id, newStatus);
    if (error) {
      alert("Lỗi khi cập nhật trạng thái");
    } else {
      loadOrders(); // Reload sau khi đổi trạng thái
    }
  };

  const handleDeleteOrder = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    const { error } = await deleteOrderAdmin(deleteId);
    setIsDeleting(false);
    setDeleteId(null);
    if (error) {
      toast.error("Lỗi khi xóa đơn hàng!");
    } else {
      try {
        const unread = JSON.parse(localStorage.getItem("admin_unread_order_ids") || "[]");
        const next = unread.filter((item: string) => item !== deleteId);
        localStorage.setItem("admin_unread_order_ids", JSON.stringify(next));
      } catch {}
      setLiveOrderIds((prev) => {
        const next = new Set(prev);
        if (deleteId) next.delete(deleteId);
        return next;
      });
      toast.success("Đã xóa đơn hàng thành công!");
      loadOrders();
    }
  };

  const handleViewDetails = async (id: string) => {
    try {
      const unread = JSON.parse(localStorage.getItem("admin_unread_order_ids") || "[]");
      const next = unread.filter((item: string) => item !== id);
      localStorage.setItem("admin_unread_order_ids", JSON.stringify(next));
    } catch {}
    setLiveOrderIds(getUnreadFromStorage());
    setDetailOpen(true);
    setLoadingDetail(true);
    const { data, error } = await getOrderById(id);
    if (!error && data) {
      setSelectedOrder(data);
    }
    setLoadingDetail(false);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(val);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Quản lý Đơn hàng</h1>
        <p className="text-muted-foreground">Theo dõi và cập nhật trạng thái đơn hàng.</p>
      </div>

      {/* Bộ lọc Nhanh dạng Thẻ Trạng Thái (Status Quick Tabs) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none border-b">
        <button
          onClick={() => updateFilter("status", "all")}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-xs shrink-0 transition-all cursor-pointer ${
            currentStatus === "all"
              ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-[1.02]"
              : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <IconFilter className="w-3.5 h-3.5" /> Tất cả đơn hàng
        </button>
        {Object.entries(STATUS_MAP).map(([key, info]) => {
          const isActive = currentStatus === key;
          return (
            <button
              key={key}
              onClick={() => updateFilter("status", key)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-xs shrink-0 transition-all cursor-pointer border ${
                isActive
                  ? `${info.color} shadow-sm font-extrabold ring-2 ring-primary/20 scale-[1.02]`
                  : "bg-background/80 text-muted-foreground border-border/50 hover:bg-muted hover:text-foreground"
              }`}
            >
              {info.label}
            </button>
          );
        })}
      </div>

      {/* Thanh Bộ Lọc Kết Hợp (Search + Date + Sort + Reset) */}
      <div className="flex flex-col gap-3 p-4 rounded-2xl bg-card border shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <form onSubmit={handleSearch} className="flex flex-1 items-center gap-2 min-w-[260px]">
            <div className="relative w-full max-w-md">
              <IconSearch className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm theo Mã UUID, tên khách, email..."
                className="pl-9 bg-background rounded-xl border-border/80 focus:border-primary h-10 text-sm"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
            <Button type="submit" variant="secondary" className="h-10 px-4 rounded-xl font-bold shrink-0 cursor-pointer">
              Tìm kiếm
            </Button>
          </form>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Bộ lọc thời gian */}
            <div className="flex items-center">
              <Select value={currentDate} onValueChange={(val) => updateFilter("date", val)}>
                <SelectTrigger className="w-[160px] h-10 rounded-xl bg-background border-border/80 font-medium text-xs">
                  <div className="flex items-center gap-1.5 truncate">
                    <IconCalendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <SelectValue placeholder="Thời gian" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Mọi thời điểm</SelectItem>
                  <SelectItem value="today">Hôm nay</SelectItem>
                  <SelectItem value="7days">7 ngày qua</SelectItem>
                  <SelectItem value="30days">30 ngày qua</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sắp xếp */}
            <div className="flex items-center">
              <Select value={currentSort} onValueChange={(val) => updateFilter("sort", val)}>
                <SelectTrigger className="w-[170px] h-10 rounded-xl bg-background border-border/80 font-medium text-xs">
                  <div className="flex items-center gap-1.5 truncate">
                    <IconArrowsSort className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <SelectValue placeholder="Sắp xếp" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Mới nhất trước</SelectItem>
                  <SelectItem value="oldest">Cũ nhất trước</SelectItem>
                  <SelectItem value="amount_desc">Giá trị cao nhất</SelectItem>
                  <SelectItem value="amount_asc">Giá trị thấp nhất</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Nút xóa bộ lọc */}
            {(currentStatus !== "all" || currentDate !== "all" || currentSort !== "newest" || currentSearch !== "") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="h-10 px-3 rounded-xl text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 gap-1.5 shrink-0 cursor-pointer transition-all"
              >
                <IconX className="w-4 h-4" /> Xóa bộ lọc
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Floating Explosion Banner khi có nhiều đơn hàng mới nổ trong phiên */}
      {liveOrderIds.size > 0 && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 p-3 sm:p-3.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 dark:bg-emerald-500/15 backdrop-blur-md shadow-lg animate-in slide-in-from-top-2 duration-500">
          <div className="flex items-center gap-2.5 text-emerald-800 dark:text-emerald-300">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-xs sm:text-sm font-bold">
              ✨ Có {liveOrderIds.size} đơn hàng mới vừa được đặt mua! Vui lòng kiểm tra các đơn hàng được đánh dấu bên dưới!
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              try { localStorage.removeItem("admin_unread_order_ids"); } catch {}
              setLiveOrderIds(new Set());
            }}
            className="h-7 border-emerald-500/50 hover:bg-emerald-500 hover:text-white text-xs font-bold shrink-0 cursor-pointer transition-all shadow-sm"
          >
            Đánh dấu đã đọc tất cả
          </Button>
        </div>
      )}

      <div className="rounded-md border bg-card overflow-x-auto shadow-sm">
        <Table className="min-w-[700px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">Mã đơn</TableHead>
              <TableHead>Khách hàng</TableHead>
              <TableHead>Ngày đặt</TableHead>
              <TableHead>Tổng tiền</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <IconLoader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Không tìm thấy đơn hàng nào.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => {
                const isLiveNew = liveOrderIds.has(order.id);
                return (
                  <TableRow
                    key={order.id}
                    className={
                      isLiveNew
                        ? "bg-emerald-500/15 dark:bg-emerald-500/20 border-l-4 border-l-emerald-500 transition-colors duration-700 hover:bg-emerald-500/25"
                        : ""
                    }
                  >
                    <TableCell className="font-mono text-xs uppercase" title={order.id}>
                      <div className="flex items-center gap-1.5">
                        {isLiveNew && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-emerald-500 text-white animate-pulse shadow-sm shrink-0">
                            MỚI
                          </span>
                        )}
                        <span>{order.id.split("-")[0]}</span>
                      </div>
                    </TableCell>
                  <TableCell>
                    <div className="font-medium">{order.profiles?.full_name || "Chưa xác định tên"}</div>
                    <div className="text-xs text-muted-foreground">{order.profiles?.email}</div>
                  </TableCell>
                  <TableCell>
                    {format(new Date(order.created_at), "dd/MM/yyyy HH:mm")}
                  </TableCell>
                  <TableCell className="font-medium text-primary">
                    {formatCurrency(order.total_amount)}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={order.status}
                      onValueChange={(val) => handleStatusChange(order.id, val)}
                    >
                      <SelectTrigger className={`h-8 text-xs font-semibold ${STATUS_MAP[order.status]?.color} border w-[130px]`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(STATUS_MAP).map(([key, info]) => (
                          <SelectItem key={key} value={key}>
                            {info.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleViewDetails(order.id)} title="Xem chi tiết">
                        <IconEye className="h-4 w-4 text-blue-600" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(order.id)} title="Xóa đơn hàng">
                        <IconTrash className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination (Tương tự như Product list) */}
      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString());
              params.set("page", String(currentPage - 1));
              router.push(`${pathname}?${params.toString()}`);
            }}
          >
            Trang trước
          </Button>
          <span className="text-sm text-muted-foreground">
            Trang {currentPage} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString());
              params.set("page", String(currentPage + 1));
              router.push(`${pathname}?${params.toString()}`);
            }}
          >
            Trang sau
          </Button>
        </div>
      )}

      <Dialog open={detailOpen} onOpenChange={setDetailOpen} >
        <DialogContent className="md:min-w-3xl  max-h-[90vh] overflow-y-auto p-4 md:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base md:text-lg">
              <IconReceipt className="h-5 w-5 shrink-0" />
              <span className="truncate">Chi tiết Đơn hàng #{selectedOrder?.id?.split("-")[0].toUpperCase()}</span>
            </DialogTitle>
          </DialogHeader>

          {loadingDetail ? (
            <div className="flex justify-center py-10">
              <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : selectedOrder ? (
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-lg border bg-muted/30 p-4">
                  <h3 className="font-semibold mb-2 text-sm md:text-base">Thông tin Khách hàng</h3>
                  <div className="space-y-1 text-xs md:text-sm">
                    <p className="break-all"><span className="text-muted-foreground">Tên:</span> {selectedOrder.profiles?.full_name}</p>
                    <p className="break-all"><span className="text-muted-foreground">Email:</span> {selectedOrder.profiles?.email}</p>
                  </div>
                </div>
                <div className="rounded-lg border bg-muted/30 p-4">
                  <h3 className="font-semibold mb-2 text-sm md:text-base">Địa chỉ Giao hàng</h3>
                  {selectedOrder.addresses ? (
                    <div className="space-y-1 text-xs md:text-sm">
                      <p className="break-words"><span className="text-muted-foreground">Người nhận:</span> {selectedOrder.addresses.full_name || selectedOrder.profiles?.full_name}</p>
                      <p><span className="text-muted-foreground">SĐT:</span> {selectedOrder.addresses.phone}</p>
                      <p className="break-words"><span className="text-muted-foreground">Địa chỉ:</span> {selectedOrder.addresses.street}, {selectedOrder.addresses.city}</p>
                    </div>
                  ) : (
                    <p className="text-xs md:text-sm text-muted-foreground">Không có dữ liệu địa chỉ.</p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm md:text-base">
                  <IconPackage className="h-4 w-4 shrink-0" /> Danh sách sản phẩm
                </h3>
                <div className="rounded-md border overflow-x-auto">
                  <Table className="min-w-[500px]">
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead>Sản phẩm</TableHead>
                        <TableHead>Biến thể</TableHead>
                        <TableHead className="text-right">Đơn giá</TableHead>
                        <TableHead className="text-center">SL</TableHead>
                        <TableHead className="text-right">Thành tiền</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrder.order_items?.map((item: any) => (
                        <TableRow key={item.id}>
                          <TableCell className="flex items-center gap-3">
                            <Image width={40} height={40} unoptimized src={item.products?.image_url || "https://placehold.co/100x100"} alt="img" className="h-10 w-10 rounded-md object-cover border shrink-0" />
                            <span className="font-medium line-clamp-2">{item.products?.name}</span>
                          </TableCell>
                          <TableCell className="text-xs md:text-sm text-muted-foreground">
                            {item.product_variants?.name || "-"}
                          </TableCell>
                          <TableCell className="text-right text-xs md:text-sm whitespace-nowrap">
                            {formatCurrency(item.price)}
                          </TableCell>
                          <TableCell className="text-center text-xs md:text-sm font-medium">
                            x{item.quantity}
                          </TableCell>
                          <TableCell className="text-right text-xs md:text-sm font-semibold whitespace-nowrap">
                            {formatCurrency(item.price * item.quantity)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                <div className="mt-4 flex justify-end">
                  <div className="w-full sm:w-64 space-y-2 text-xs md:text-sm">
                    {selectedOrder.coupons && (
                      <div className="flex justify-between text-green-600">
                        <span>Giảm giá ({selectedOrder.coupons.code}):</span>
                        <span>-{selectedOrder.coupons.discount_percent}%</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t pt-2 font-bold text-base md:text-lg">
                      <span>Tổng:</span>
                      <span className="text-primary">{formatCurrency(selectedOrder.total_amount)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có chắc chắn muốn xóa đơn hàng này?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này sẽ xóa vĩnh viễn đơn hàng #{deleteId?.split("-")[0].toUpperCase()} cùng tất cả danh sách sản phẩm bên trong khỏi cơ sở dữ liệu và không thể khôi phục.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteOrder}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600 text-white font-semibold"
            >
              {isDeleting ? "Đang xóa..." : "Xóa vĩnh viễn"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <RoleGuard allowedRoles={["admin"]}>
      <Suspense fallback={<div>Loading orders...</div>}>
        <OrdersContent />
      </Suspense>
    </RoleGuard>
  );
}
