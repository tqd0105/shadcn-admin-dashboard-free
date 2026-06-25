"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import RoleGuard from "@/components/guards/role-guard";
import { getOrders, updateOrderStatus, getOrderById, deleteOrderAdmin } from "@/lib/services/order.service";
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

  const loadOrders = useCallback(async () => {
    setLoading(true);
    const { data, total, totalPages, error } = await getOrders(
      currentSearch,
      currentPage,
      10,
      { status: currentStatus }
    );
    if (!error && data) {
      setOrders(data);
      setTotal(total);
      setTotalPages(totalPages);
    }
    setLoading(false);
  }, [currentSearch, currentPage, currentStatus]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadOrders();
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
      toast.success("Đã xóa đơn hàng thành công!");
      loadOrders();
    }
  };

  const handleViewDetails = async (id: string) => {
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

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <form onSubmit={handleSearch} className="flex flex-1 items-center gap-2">
          <div className="relative w-full max-w-sm">
            <IconSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm theo Mã UUID..."
              className="pl-8"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <Button type="submit" variant="secondary">Tìm</Button>
        </form>

        <div className="flex items-center gap-2">
          <Select
            value={currentStatus}
            onValueChange={(val) => {
              const params = new URLSearchParams(searchParams.toString());
              if (val !== "all") params.set("status", val);
              else params.delete("status");
              params.set("page", "1");
              router.push(`${pathname}?${params.toString()}`);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              {Object.entries(STATUS_MAP).map(([key, info]) => (
                <SelectItem key={key} value={key}>{info.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

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
              orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-xs uppercase" title={order.id}>
                    {order.id.split("-")[0]}
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
              ))
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
                            <img src={item.products?.image_url || "https://placehold.co/100x100"} alt="img" className="h-10 w-10 rounded-md object-cover border shrink-0" />
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
