"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCart, updateCartItemQuantity, removeFromCart } from "@/lib/services/cart.service";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { IconLoader2, IconTrash, IconMinus, IconPlus, IconShoppingCart } from "@tabler/icons-react";
import { useAuth } from "@/components/providers/auth-provider";
import Link from "next/link";

export default function CartPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        loadCart();
      } else {
        setLoading(false);
      }
    }
  }, [user, authLoading]);

  const loadCart = async () => {
    setLoading(true);
    const { data, error } = await getCart();
    if (!error && data) {
      setCartItems(data);
    }
    setLoading(false);
  };

  const handleUpdateQuantity = async (id: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    setUpdatingId(id);
    const { error } = await updateCartItemQuantity(id, newQuantity);
    if (!error) {
      setCartItems(items => items.map(item => item.id === id ? { ...item, quantity: newQuantity } : item));
    }
    setUpdatingId(null);
  };

  const handleRemove = async (id: string) => {
    setUpdatingId(id);
    const { error } = await removeFromCart(id);
    if (!error) {
      setCartItems(items => items.filter(item => item.id !== id));
    }
    setUpdatingId(null);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);
  };

  const calculateItemPrice = (item: any) => {
    const basePrice = Number(item.products?.price || 0);
    const discount = Number(item.products?.discount_percent || 0);
    const modifier = Number(item.product_variants?.price_modifier || 0);
    
    const discountedBase = basePrice - (basePrice * discount / 100);
    return discountedBase + modifier;
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      return total + (calculateItemPrice(item) * item.quantity);
    }, 0);
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center py-20">
        <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <IconShoppingCart className="h-16 w-16 text-muted-foreground/50" />
        <h2 className="text-2xl font-bold">Bạn chưa đăng nhập</h2>
        <p className="text-muted-foreground">Vui lòng đăng nhập để xem giỏ hàng của bạn.</p>
        <Button asChild>
          <Link href="/login">Đăng nhập ngay</Link>
        </Button>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <IconShoppingCart className="h-16 w-16 text-muted-foreground/50" />
        <h2 className="text-2xl font-bold">Giỏ hàng trống</h2>
        <p className="text-muted-foreground">Chưa có sản phẩm nào trong giỏ hàng của bạn.</p>
        <Button asChild>
          <Link href="/dashboard/products">Tiếp tục mua sắm</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">Giỏ hàng của bạn</h1>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-4">
          <div className="rounded-md border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px] sm:w-auto">Sản phẩm</TableHead>
                  <TableHead className="hidden sm:table-cell">Đơn giá</TableHead>
                  <TableHead className="text-center">Số lượng</TableHead>
                  <TableHead className="text-right">Tạm tính</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cartItems.map((item) => {
                  const price = calculateItemPrice(item);
                  const isUpdating = updatingId === item.id;
                  return (
                    <TableRow key={item.id} className={isUpdating ? "opacity-50 pointer-events-none" : ""}>
                      <TableCell>
                        <div className="flex items-center gap-4">
                          <img 
                            src={item.products?.image_url || "https://placehold.co/100x100"} 
                            alt="product" 
                            className="h-16 w-16 md:h-20 md:w-20 rounded-md object-cover border shrink-0" 
                          />
                          <div className="flex flex-col">
                            <p className="font-semibold text-sm md:text-base line-clamp-2">{item.products?.name}</p>
                            {item.product_variants && (
                              <p className="text-xs md:text-sm text-muted-foreground mt-1">Phân loại: {item.product_variants.name}</p>
                            )}
                            {/* Hiển thị đơn giá ở mobile */}
                            <div className="sm:hidden mt-2">
                              <span className="font-medium text-sm text-primary">{formatCurrency(price)}</span>
                              {item.products?.discount_percent > 0 && (
                                <span className="text-xs text-muted-foreground line-through ml-2">
                                  {formatCurrency(Number(item.products.price))}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell font-medium">
                        <div className="flex flex-col">
                          <span>{formatCurrency(price)}</span>
                          {item.products?.discount_percent > 0 && (
                            <span className="text-xs text-muted-foreground line-through">
                              {formatCurrency(Number(item.products.price))}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1 sm:gap-2">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-7 w-7 sm:h-8 sm:w-8 shrink-0"
                            onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <IconMinus className="h-3 w-3" />
                          </Button>
                          <span className="w-6 sm:w-8 text-center font-medium text-sm sm:text-base">{item.quantity}</span>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-7 w-7 sm:h-8 sm:w-8 shrink-0"
                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                          >
                            <IconPlus className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-primary text-sm sm:text-base">
                        {formatCurrency(price * item.quantity)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleRemove(item.id)}
                        >
                          <IconTrash className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                )})}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="md:col-span-1">
          <div className="rounded-xl border bg-card p-6 shadow-sm sticky top-24">
            <h2 className="text-xl font-bold mb-6">Tóm tắt đơn hàng</h2>
            <div className="space-y-4 text-sm mb-6">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Tạm tính</span>
                <span className="font-medium text-base">{formatCurrency(calculateTotal())}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Phí vận chuyển</span>
                <span className="font-medium text-muted-foreground text-xs italic">Sẽ tính ở bước sau</span>
              </div>
              
              <div className="border-t pt-4 mt-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-base">Tổng cộng</span>
                  <span className="text-2xl font-bold text-primary">{formatCurrency(calculateTotal())}</span>
                </div>
                <p className="text-xs text-muted-foreground text-right">(Đã bao gồm VAT nếu có)</p>
              </div>
            </div>
            
            <Button className="w-full h-12 text-base font-semibold" size="lg" asChild>
              <Link href="/checkout">Tiến hành thanh toán</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
