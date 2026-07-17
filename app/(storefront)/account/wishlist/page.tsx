"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { getWishlist, removeFromWishlist } from "@/lib/services/wishlist.service";
import { useAuth } from "@/components/providers/auth-provider";
import { addToCart } from "@/lib/services/cart.service";
import { IconLoader2, IconHeartBroken, IconTrash, IconShoppingCart } from "@tabler/icons-react";
import { LuxeLoading } from "@/components/storefront/luxe-loading";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { toast } from "sonner";

export default function WishlistPage() {
  const { user, role, loading: authLoading } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWishlist = useCallback(async () => {
    setTimeout(() => setLoading(true), 0);
    const { data, error } = await getWishlist();
    if (!error && data) {
      setItems(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user && !authLoading) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchWishlist();
    }
  }, [user, authLoading, fetchWishlist]);

  const handleRemove = async (id: string) => {
    const { error } = await removeFromWishlist(id);
    if (!error) {
      setItems(items.filter(item => item.id !== id));
      toast.success("Đã xóa khỏi danh sách yêu thích");
    } else {
      toast.error("Không thể xóa sản phẩm");
    }
  };

  const handleAddToCart = async (product: any) => {
    if (role === "admin" || role === "staff") {
      toast.error(
        role === "admin"
          ? "Quản trị viên (Admin) không được mua hàng cá nhân để bảo đảm tính trung thực về doanh thu!"
          : "Nhân viên (Staff) không thể mua hàng bằng tài khoản nội bộ. Vui lòng dùng tài khoản Khách hàng!"
      );
      return;
    }

    // If product has variants, it's better to direct user to product page.
    // For simplicity here, we try to add it. If it requires variant, we could link them instead.
    const { error } = await addToCart(product.id, 1);
    if (error) {
      toast.error(error.message || "Lỗi khi thêm vào giỏ");
    } else {
      toast.success("Đã thêm vào giỏ hàng");
      window.dispatchEvent(new Event("cart-updated"));
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);
  };

  if (authLoading || loading) return <LuxeLoading label="Đang tải danh sách yêu thích..." />;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Sản phẩm yêu thích</h1>

      {items.length === 0 ? (
        <div className="text-center py-16 bg-muted/50 rounded-xl border border-dashed">
          <IconHeartBroken className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground">Danh sách trống</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-6">Bạn chưa lưu sản phẩm nào vào danh sách yêu thích.</p>
          <Button asChild>
            <Link href="/products">Tiếp tục mua sắm</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-12">
          {Object.entries(
            items.reduce((acc, item) => {
              const groupName = item.wishlist_groups?.name || "Mặc định (Chưa phân loại)";
              if (!acc[groupName]) acc[groupName] = [];
              acc[groupName].push(item);
              return acc;
            }, {} as Record<string, any[]>)
          ).map(([groupName, groupItems]: [string, any]) => (
            <div key={groupName}>
              <h2 className="text-xl font-bold mb-4 pb-2 border-b text-foreground">{groupName} <span className="text-sm font-normal text-muted-foreground ml-2">({(groupItems as any[]).length} sản phẩm)</span></h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {(groupItems as any[]).map((item) => {
                  const p = item.products;
                  if (!p) return null;
                  
                  const price = Number(p.price);
                  const discount = Number(p.discount_percent || 0);
                  const finalPrice = price - (price * discount / 100);

                  return (
                    <div key={item.id} className="group border rounded-xl overflow-hidden hover:shadow-md transition-all bg-card flex flex-col">
                      <Link href={`/product/${p.id}`} className="relative aspect-square overflow-hidden bg-muted block">
                        <Image 
                          fill
                          unoptimized
                          src={p.image_url} 
                          alt={p.name}
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        {discount > 0 && (
                          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                            -{discount}%
                          </span>
                        )}
                      </Link>
                      <div className="p-4 flex flex-col flex-1">
                        <Link href={`/product/${p.id}`}>
                          <h3 className="font-medium text-foreground line-clamp-2 hover:text-primary transition-colors">
                            {p.name}
                          </h3>
                        </Link>
                        <div className="mt-2 mb-2">
                          <span className="font-bold text-lg text-primary">{formatCurrency(finalPrice)}</span>
                          {discount > 0 && (
                            <span className="text-sm text-muted-foreground line-through ml-2">
                              {formatCurrency(price)}
                            </span>
                          )}
                        </div>
                        
                        {item.note && (
                          <div className="mb-4 text-sm bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 p-2.5 rounded-md border border-yellow-500/20 italic line-clamp-3">
                            <span className="font-semibold not-italic block mb-0.5 text-xs uppercase">Ghi chú:</span>
                            {item.note}
                          </div>
                        )}

                        <div className="mt-auto flex gap-2 pt-2">
                          <Button 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => handleAddToCart(p)}
                          >
                            <IconShoppingCart className="w-4 h-4 mr-2" /> Thêm giỏ
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon"
                            className="shrink-0 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                            onClick={() => handleRemove(item.id)}
                          >
                            <IconTrash className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
