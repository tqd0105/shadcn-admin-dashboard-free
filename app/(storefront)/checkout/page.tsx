"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCart } from "@/lib/services/cart.service";
import { placeOrder } from "@/lib/services/checkout.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/components/providers/auth-provider";
import { IconLoader2, IconCheck } from "@tabler/icons-react";
import Link from "next/link";

export default function CheckoutPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    street: "",
    city: "",
    paymentMethod: "cod"
  });

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        setFormData(prev => ({ ...prev, fullName: user.user_metadata?.full_name || "" }));
        loadCart();
      } else {
        router.push("/login");
      }
    }
  }, [user, authLoading, router]);

  const loadCart = async () => {
    setLoading(true);
    const { data, error } = await getCart();
    if (!error && data) {
      setCartItems(data);
    }
    setLoading(false);
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      const basePrice = Number(item.products?.price || 0);
      const discount = Number(item.products?.discount_percent || 0);
      const modifier = Number(item.product_variants?.price_modifier || 0);
      const discountedBase = basePrice - (basePrice * discount / 100);
      return total + ((discountedBase + modifier) * item.quantity);
    }, 0);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) return;

    setSubmitting(true);
    const { error } = await placeOrder(formData);
    setSubmitting(false);

    if (error) {
      alert("Đặt hàng thất bại: " + error.message);
    } else {
      setSuccess(true);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center py-20">
        <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="container mx-auto py-20 text-center space-y-6">
        <div className="mx-auto w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
          <IconCheck className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-bold">Đặt hàng thành công!</h1>
        <p className="text-muted-foreground text-lg">
          Cảm ơn bạn đã mua sắm. Đơn hàng của bạn đang được xử lý.
        </p>
        <div className="pt-6">
          <Button asChild size="lg">
            <Link href="/dashboard/orders">Quản lý Đơn hàng (Admin View)</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">Giỏ hàng trống</h1>
        <Button asChild>
          <Link href="/cart">Quay lại Giỏ hàng</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">Thanh toán</h1>

      <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-12">
        <div className="space-y-8">
          {/* Thông tin giao hàng */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold border-b pb-2">Thông tin nhận hàng</h2>
            
            <div className="space-y-2">
              <Label htmlFor="fullName">Họ và Tên</Label>
              <Input 
                id="fullName" 
                required 
                value={formData.fullName}
                onChange={e => setFormData({...formData, fullName: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Số điện thoại</Label>
              <Input 
                id="phone" 
                required 
                type="tel"
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label htmlFor="city">Tỉnh / Thành phố</Label>
                <Input 
                  id="city" 
                  required 
                  value={formData.city}
                  onChange={e => setFormData({...formData, city: e.target.value})}
                />
              </div>
              <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label htmlFor="street">Địa chỉ cụ thể (Số nhà, đường...)</Label>
                <Input 
                  id="street" 
                  required 
                  value={formData.street}
                  onChange={e => setFormData({...formData, street: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* Phương thức thanh toán */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold border-b pb-2">Phương thức thanh toán</h2>
            <RadioGroup 
              value={formData.paymentMethod} 
              onValueChange={v => setFormData({...formData, paymentMethod: v})}
              className="space-y-3"
            >
              <div className="flex items-center space-x-3 border p-4 rounded-md cursor-pointer hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="cod" id="cod" />
                <Label htmlFor="cod" className="cursor-pointer font-medium flex-1">Thanh toán khi nhận hàng (COD)</Label>
              </div>
              <div className="flex items-center space-x-3 border p-4 rounded-md cursor-pointer hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="banking" id="banking" />
                <Label htmlFor="banking" className="cursor-pointer font-medium flex-1">Chuyển khoản ngân hàng</Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <div>
          {/* Tóm tắt đơn hàng */}
          <div className="rounded-xl border bg-card p-6 shadow-sm sticky top-24">
            <h2 className="text-xl font-bold mb-6">Đơn hàng của bạn</h2>
            
            <div className="space-y-4 max-h-[300px] overflow-auto pr-2 mb-6">
              {cartItems.map((item) => {
                const basePrice = Number(item.products?.price || 0);
                const discount = Number(item.products?.discount_percent || 0);
                const modifier = Number(item.product_variants?.price_modifier || 0);
                const price = basePrice - (basePrice * discount / 100) + modifier;

                return (
                  <div key={item.id} className="flex justify-between text-sm">
                    <div className="flex gap-3">
                      <div className="relative">
                        <img 
                          src={item.products?.image_url} 
                          alt="img" 
                          className="h-12 w-12 rounded border object-cover" 
                        />
                        <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="flex flex-col justify-center">
                        <span className="font-medium line-clamp-1 max-w-[150px]">{item.products?.name}</span>
                        {item.product_variants && <span className="text-xs text-muted-foreground">{item.product_variants.name}</span>}
                      </div>
                    </div>
                    <span className="font-medium self-center">{formatCurrency(price * item.quantity)}</span>
                  </div>
                );
              })}
            </div>

            <div className="space-y-3 text-sm mb-6 border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Tạm tính</span>
                <span className="font-medium text-base">{formatCurrency(calculateTotal())}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Phí vận chuyển</span>
                <span className="font-medium">Miễn phí</span>
              </div>
              
              <div className="border-t pt-4 mt-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-base">Tổng cộng</span>
                  <span className="text-2xl font-bold text-primary">{formatCurrency(calculateTotal())}</span>
                </div>
              </div>
            </div>
            
            <Button type="submit" className="w-full h-12 text-base font-semibold" size="lg" disabled={submitting}>
              {submitting ? <IconLoader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
              {submitting ? "Đang xử lý..." : "Đặt hàng ngay"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
