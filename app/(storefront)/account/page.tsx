"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getMyOrders } from "@/lib/services/order.service";
import { getWishlist } from "@/lib/services/wishlist.service";
import { getAddresses } from "@/lib/services/address.service";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import Image from "next/image";

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: "Chờ xử lý", color: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" },
  processing: { label: "Đang xử lý", color: "bg-blue-100 text-blue-800 hover:bg-blue-100" },
  shipped: { label: "Đang giao", color: "bg-indigo-100 text-indigo-800 hover:bg-indigo-100" },
  delivered: { label: "Đã giao", color: "bg-green-100 text-green-800 hover:bg-green-100" },
  cancelled: { label: "Đã hủy", color: "bg-red-100 text-red-800 hover:bg-red-100" },
};

export default function AccountOverviewPage() {
  const { profile, user } = useAuth();
  
  const [stats, setStats] = useState({
    ordersCount: 0,
    wishlistCount: 0,
    addressCount: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      Promise.all([
        getMyOrders(),
        getWishlist(),
        getAddresses()
      ]).then(([ordersRes, wishlistRes, addressRes]) => {
        setStats({
          ordersCount: ordersRes.data?.length || 0,
          wishlistCount: wishlistRes.data?.length || 0,
          addressCount: addressRes.data?.length || 0,
        });
        
        if (ordersRes.data) {
          setRecentOrders(ordersRes.data.slice(0, 3));
        }
        setLoading(false);
      });
    }
  }, [user]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Tổng quan tài khoản</h1>
      
      <div className="bg-secondary/30 p-6 rounded-xl border border-secondary">
        <p className="text-lg">
          Xin chào, <span className="font-bold text-primary">{profile?.full_name || user?.email?.split('@')[0]}</span>!
        </p>
        <p className="text-muted-foreground mt-2">
          Từ trang quản lý tài khoản, bạn có thể xem lịch sử mua hàng, quản lý địa chỉ giao hàng và thay đổi thông tin bảo mật.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/account/orders" className="group border rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-primary/50 transition-colors bg-card">
          <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Image src="/icons/cart.png" alt="Đơn hàng" width={28} height={28} className="object-contain" />
          </div>
          <h3 className="font-semibold group-hover:text-primary transition-colors">Đơn hàng</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {loading ? "..." : `${stats.ordersCount} đơn hàng`}
          </p>
        </Link>

        <Link href="/account/wishlist" className="group border rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-primary/50 transition-colors bg-card">
          <div className="w-14 h-14 bg-pink-50 dark:bg-pink-900/20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Image src="/icons/love.png" alt="Yêu thích" width={28} height={28} className="object-contain" />
          </div>
          <h3 className="font-semibold group-hover:text-primary transition-colors">Yêu thích</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {loading ? "..." : `${stats.wishlistCount} sản phẩm`}
          </p>
        </Link>

        <Link href="/account/addresses" className="group border rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-primary/50 transition-colors bg-card">
          <div className="w-14 h-14 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Image src="/icons/location.png" alt="Địa chỉ" width={28} height={28} className="object-contain" />
          </div>
          <h3 className="font-semibold group-hover:text-primary transition-colors">Địa chỉ</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {loading ? "..." : `${stats.addressCount} địa chỉ đã lưu`}
          </p>
        </Link>
      </div>

      <div className="mt-10 border-t pt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Đơn hàng gần đây</h2>
          <Link href="/account/orders" className="text-sm text-primary hover:underline flex items-center">
            Xem tất cả <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
        
        {loading ? (
          <div className="bg-muted/50 rounded-lg p-8 text-center text-muted-foreground animate-pulse">
            Đang tải dữ liệu đơn hàng...
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="bg-muted/50 rounded-lg p-8 text-center text-muted-foreground">
            Bạn chưa có đơn hàng nào.
          </div>
        ) : (
          <div className="space-y-4">
            {recentOrders.map(order => (
              <div key={order.id} className="border rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-primary/50 transition-colors">
                <div>
                  <p className="font-semibold text-sm">Mã đơn: <span className="font-mono text-muted-foreground">#{order.id.split('-')[0].toUpperCase()}</span></p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Ngày đặt: {format(new Date(order.created_at), "dd MMMM, yyyy", { locale: vi })}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant="secondary" className={STATUS_MAP[order.status]?.color || ""}>
                    {STATUS_MAP[order.status]?.label || order.status}
                  </Badge>
                  <span className="font-bold">{formatCurrency(order.total_amount)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
