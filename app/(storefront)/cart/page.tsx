"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
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
import { IconLoader2, IconTrash, IconMinus, IconPlus, IconShoppingCart, IconReceipt2 } from "@tabler/icons-react";
import { useAuth } from "@/components/providers/auth-provider";
import Link from "next/link";

export default function CartPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadCart = useCallback(async () => {
    setTimeout(() => setLoading(true), 0);
    const { data, error } = await getCart();
    if (!error && data) {
      setCartItems(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadCart();
      } else {
        setTimeout(() => setLoading(false), 0);
      }
    }
  }, [user, authLoading, loadCart]);

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
      window.dispatchEvent(new Event("cart-updated"));
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
          <Link href="/products">Tiếp tục mua sắm</Link>
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
                  <TableHead>Sản phẩm</TableHead>
                  <TableHead className="hidden md:table-cell">Đơn giá</TableHead>
                  <TableHead className="hidden sm:table-cell text-center">Số lượng</TableHead>
                  <TableHead className="hidden sm:table-cell text-right">Tạm tính</TableHead>
                  <TableHead className="hidden sm:table-cell w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cartItems.map((item) => {
                  const price = calculateItemPrice(item);
                  const isUpdating = updatingId === item.id;
                  return (
                    <TableRow key={item.id} className={isUpdating ? "opacity-50 pointer-events-none" : ""}>
                      <TableCell className="p-4 sm:p-2">
                        <div className="flex gap-4">
                          <Image 
                            width={96}
                            height={96}
                            unoptimized
                            src={item.products?.image_url || "https://placehold.co/100x100"} 
                            alt="product" 
                            className="h-20 w-20 sm:h-24 sm:w-24 rounded-md object-cover border shrink-0" 
                          />
                          <div className="flex flex-col flex-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-semibold text-sm md:text-base line-clamp-2">{item.products?.name}</p>
                                {item.product_variants && (
                                  <p className="text-xs md:text-sm text-muted-foreground mt-1">Phân loại: {item.product_variants.name}</p>
                                )}
                              </div>
                              {/* Mobile Delete Button */}
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="sm:hidden h-8 w-8 text-muted-foreground hover:text-destructive -mt-2 -mr-2 shrink-0"
                                onClick={() => handleRemove(item.id)}
                              >
                                <IconTrash className="h-4 w-4" />
                              </Button>
                            </div>

                            {/* Mobile Price and Quantity */}
                            <div className="sm:hidden mt-auto pt-4 flex items-end justify-between flex-1">
                              <div>
                                <span className="font-medium text-sm text-primary block">{formatCurrency(price)}</span>
                                {item.products?.discount_percent > 0 && (
                                  <span className="text-xs text-muted-foreground line-through block mt-0.5">
                                    {formatCurrency(Number(item.products.price))}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1 border rounded-md">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-7 w-7 rounded-none"
                                  onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                                  disabled={item.quantity <= 1}
                                >
                                  <IconMinus className="h-3 w-3" />
                                </Button>
                                <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-7 w-7 rounded-none"
                                  onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                >
                                  <IconPlus className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell font-medium">
                        <div className="flex flex-col">
                          <span>{formatCurrency(price)}</span>
                          {item.products?.discount_percent > 0 && (
                            <span className="text-xs text-muted-foreground line-through">
                              {formatCurrency(Number(item.products.price))}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
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
                      <TableCell className="hidden sm:table-cell text-right font-semibold text-primary text-sm sm:text-base">
                        {formatCurrency(price * item.quantity)}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-right">
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
                  <span className="font-bold text-base flex items-center gap-2">
                    <IconReceipt2 className="h-5 w-5 hidden md:block lg:hidden" />
                    <span className="md:hidden lg:block">Tổng cộng</span>
                  </span>
                  <span className="text-xl lg:text-2xl font-bold text-primary">{formatCurrency(calculateTotal())}</span>
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
