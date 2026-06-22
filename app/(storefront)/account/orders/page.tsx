"use client";

import { useEffect, useState } from "react";
import { getMyOrders, updateOrderStatus } from "@/lib/services/order.service";
import { useAuth } from "@/components/providers/auth-provider";
import { useRouter } from "next/navigation";
import { IconLoader2, IconPackage, IconX } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: "Chờ xử lý", color: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" },
  processing: { label: "Đang xử lý", color: "bg-blue-100 text-blue-800 hover:bg-blue-100" },
  shipped: { label: "Đang giao", color: "bg-indigo-100 text-indigo-800 hover:bg-indigo-100" },
  delivered: { label: "Đã giao", color: "bg-green-100 text-green-800 hover:bg-green-100" },
  cancelled: { label: "Đã hủy", color: "bg-red-100 text-red-800 hover:bg-red-100" },
};

export default function MyOrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
      } else {
        fetchOrders();
      }
    }
  }, [user, authLoading, router]);

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await getMyOrders();
    if (!error && data) {
      setOrders(data);
    }
    setLoading(false);
  };

  const handleCancelOrder = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn hủy đơn hàng này không?")) return;
    
    setCancellingId(id);
    const { error } = await updateOrderStatus(id, "cancelled");
    setCancellingId(null);
    
    if (error) {
      alert("Lỗi khi hủy đơn hàng: " + error.message);
    } else {
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
    <div className="container mx-auto py-10 px-4 md:px-0">
      <h1 className="text-3xl font-bold mb-8">Lịch sử Mua hàng</h1>
      
      <div className="space-y-6">
        {orders.map(order => (
          <Card key={order.id} className="overflow-hidden">
            <CardHeader className="bg-muted/30 pb-4 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-base sm:text-lg mb-1 font-mono">#{order.id.split('-')[0].toUpperCase()}</CardTitle>
                <CardDescription>
                  Đặt ngày: {format(new Date(order.created_at), "dd MMMM yyyy HH:mm", { locale: vi })}
                </CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Tổng tiền</p>
                  <p className="font-bold text-primary">{formatCurrency(order.total_amount)}</p>
                </div>
                <Badge className={STATUS_MAP[order.status]?.color || "bg-gray-100 text-gray-800"}>
                  {STATUS_MAP[order.status]?.label || order.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {/* Product List */}
              <div className="space-y-4">
                {order.order_items?.map((item: any) => (
                  <div key={item.id} className="flex gap-4">
                    <img 
                      src={item.products?.image_url || "https://placehold.co/80x80"} 
                      alt="product" 
                      className="h-20 w-20 rounded-md border object-cover shrink-0" 
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm sm:text-base line-clamp-2">{item.products?.name}</h4>
                      {item.product_variants && (
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1">Phân loại: {item.product_variants.name}</p>
                      )}
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-sm">x{item.quantity}</span>
                        <span className="font-medium text-sm sm:text-base">{formatCurrency(item.price)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action */}
              {order.status === "pending" && (
                <div className="pt-4 border-t flex justify-end">
                  <Button 
                    variant="outline" 
                    className="text-destructive hover:bg-destructive/10"
                    disabled={cancellingId === order.id}
                    onClick={() => handleCancelOrder(order.id)}
                  >
                    {cancellingId === order.id ? (
                      <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <IconX className="mr-2 h-4 w-4" />
                    )}
                    Hủy đơn hàng
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
