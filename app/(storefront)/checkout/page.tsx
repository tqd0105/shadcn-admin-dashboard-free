"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCart } from "@/lib/services/cart.service";
import { placeOrder } from "@/lib/services/checkout.service";
import { getAddresses } from "@/lib/services/address.service";
import { supabase } from "@/lib/supabase/client";
import { validateCoupon, Coupon } from "@/lib/services/coupon.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/components/providers/auth-provider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { IconLoader2, IconCheck } from "@tabler/icons-react";
import { toast } from "sonner";
import Link from "next/link";

export default function CheckoutPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    street: "",
    city: "",
    paymentMethod: "cod"
  });

  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [saveNewAddress, setSaveNewAddress] = useState<boolean>(true);
  const [createdOrder, setCreatedOrder] = useState<any>(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        setFormData(prev => ({ ...prev, fullName: user.user_metadata?.full_name || "" }));
        loadCart();
        loadAddresses();
      } else {
        router.push("/login");
      }
    }
  }, [user, authLoading, router]);

  const loadAddresses = async () => {
    const { data } = await getAddresses();
    if (data && data.length > 0) {
      setSavedAddresses(data);
      const defaultAddr = data.find((a: any) => a.is_default) || data[0];
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr.id);
        setFormData(prev => ({
          ...prev,
          fullName: defaultAddr.full_name || prev.fullName,
          phone: defaultAddr.phone || "",
          street: defaultAddr.street || "",
          city: defaultAddr.city || ""
        }));
      }
    }
  };

  const loadCart = async () => {
    setLoading(true);
    const { data, error } = await getCart();
    if (!error && data) {
      setCartItems(data);
    }
    setLoading(false);
  };

  const getSubtotal = () => {
    return cartItems.reduce((total, item) => {
      const basePrice = Number(item.products?.price || 0);
      const discount = Number(item.products?.discount_percent || 0);
      const modifier = Number(item.product_variants?.price_modifier || 0);
      const discountedBase = basePrice - (basePrice * discount / 100);
      return total + ((discountedBase + modifier) * item.quantity);
    }, 0);
  };

  const calculateTotal = () => {
    let total = getSubtotal();
    if (appliedCoupon) {
      total = total - (total * appliedCoupon.discount_percent / 100);
    }
    return total;
  };

  const handleApplyCoupon = async () => {
    if (!couponCodeInput.trim()) return;
    setCouponError("");
    const { data, error } = await validateCoupon(couponCodeInput);
    if (error || !data) {
      setCouponError(error?.message || "Mã không hợp lệ");
      setAppliedCoupon(null);
    } else {
      setAppliedCoupon(data);
      setCouponError("");
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCodeInput("");
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) return;

    // Bước 3: Validate số điện thoại Việt Nam
    const phoneRegex = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;
    if (!phoneRegex.test(formData.phone.trim())) {
      toast.error("Số điện thoại không hợp lệ!", {
        description: "Vui lòng nhập đúng định dạng số di động Việt Nam (10 chữ số, ví dụ 098... hoặc 039...)."
      });
      return;
    }

    setSubmitting(true);
    const { data: order, error } = await placeOrder({
      ...formData,
      couponId: appliedCoupon ? appliedCoupon.id : undefined,
      selectedAddressId: selectedAddressId || undefined,
      saveToAddressBook: !selectedAddressId ? saveNewAddress : false
    });
    setSubmitting(false);

    if (error || !order) {
      toast.error("Đặt hàng thất bại!", {
        description: error?.message || "Lỗi kết nối máy chủ"
      });
    } else {
      setCreatedOrder(order);
      if (formData.paymentMethod === "banking") {
        setQrModalOpen(true);
      } else {
        toast.success("Đặt hàng thành công!");
        setSuccess(true);
      }
    }
  };

  const handleCancelPayment = async () => {
    setQrModalOpen(false);
    if (createdOrder?.id) {
      await supabase.from("orders").update({ status: "cancelled" }).eq("id", createdOrder.id);
      if (user && cartItems.length > 0) {
        const restorePayload = cartItems.map(item => ({
          user_id: user.id,
          product_id: item.product_id,
          variant_id: item.variant_id || null,
          quantity: item.quantity
        }));
        await supabase.from("cart_items").insert(restorePayload);
      }
    }
    toast.info("Đã hủy thanh toán!", {
      description: "Các sản phẩm đã được hoàn lại vào giỏ hàng của bạn."
    });
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
            <Link href="/account/orders">Quản lý Đơn hàng </Link>
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

            {savedAddresses.length > 0 && (
              <div className="bg-primary/5 p-4 rounded-lg border border-primary/20 space-y-2">
                <Label className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1">
                  ★ Chọn nhanh từ Sổ địa chỉ đã lưu:
                </Label>
                <select
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:ring-2 focus:ring-primary outline-none cursor-pointer text-foreground"
                  value={selectedAddressId}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedAddressId(val);
                    const addr = savedAddresses.find(a => a.id === val);
                    if (addr) {
                      setFormData(prev => ({
                        ...prev,
                        fullName: addr.full_name || prev.fullName,
                        phone: addr.phone || "",
                        street: addr.street || "",
                        city: addr.city || ""
                      }));
                    }
                  }}
                >
                  <option value="">-- Tự nhập địa chỉ mới bên dưới --</option>
                  {savedAddresses.map(addr => (
                    <option key={addr.id} value={addr.id}>
                      {addr.full_name} ({addr.phone}) - {addr.street}, {addr.city} {addr.is_default ? " [Mặc định]" : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="fullName">Họ và Tên</Label>
              <Input
                id="fullName"
                required
                value={formData.fullName}
                onChange={e => setFormData({ ...formData, fullName: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Số điện thoại</Label>
              <Input
                id="phone"
                required
                type="tel"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label htmlFor="city">Tỉnh / Thành phố</Label>
                <Input
                  id="city"
                  required
                  value={formData.city}
                  onChange={e => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
              <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label htmlFor="street">Địa chỉ cụ thể</Label>
                <Input
                  id="street"
                  required
                  value={formData.street}
                  onChange={e => setFormData({ ...formData, street: e.target.value })}
                />
              </div>
            </div>

            {!selectedAddressId && (
              <div className="flex items-center gap-2 pt-2 border-t">
                <input
                  type="checkbox"
                  id="saveNewAddr"
                  checked={saveNewAddress}
                  onChange={e => setSaveNewAddress(e.target.checked)}
                  className="w-4 h-4 rounded border-input text-primary focus:ring-primary cursor-pointer accent-primary"
                />
                <Label htmlFor="saveNewAddr" className="text-xs cursor-pointer text-muted-foreground font-normal">
                  Lưu địa chỉ mới này vào Sổ địa chỉ để mua sắm nhanh hơn lần sau
                </Label>
              </div>
            )}
          </div>

          {/* Phương thức thanh toán */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold border-b pb-2">Phương thức thanh toán</h2>
            <RadioGroup
              value={formData.paymentMethod}
              onValueChange={v => setFormData({ ...formData, paymentMethod: v })}
              className="space-y-3"
            >
              <div className="flex items-center space-x-3 border p-4 rounded-md cursor-pointer hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="cod" id="cod" />
                <Label htmlFor="cod" className="cursor-pointer font-medium flex-1">Thanh toán khi nhận hàng (COD)</Label>
              </div>
              <div className="flex items-center space-x-3 border p-4 rounded-md cursor-pointer hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="banking" id="banking" />
                <Label htmlFor="banking" className="cursor-pointer font-medium flex-1 flex items-center justify-between">
                  <span>Chuyển khoản VietQR / MoMo</span>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded font-bold">Quét QR tự động</span>
                </Label>
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

            {/* Mã giảm giá */}
            <div className="mb-6 border-t pt-4">
              <Label htmlFor="coupon" className="mb-2 block">Mã giảm giá</Label>
              <div className="flex gap-2">
                <Input
                  id="coupon"
                  placeholder="Nhập mã giảm giá..."
                  value={couponCodeInput}
                  onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                  disabled={!!appliedCoupon}
                />
                {!appliedCoupon ? (
                  <Button type="button" variant="secondary" onClick={handleApplyCoupon}>Áp dụng</Button>
                ) : (
                  <Button type="button" variant="destructive" onClick={handleRemoveCoupon}>Hủy</Button>
                )}
              </div>
              {couponError && <p className="text-red-500 text-xs mt-2">{couponError}</p>}
              {appliedCoupon && (
                <p className="text-green-600 text-xs mt-2 flex items-center gap-1">
                  <IconCheck className="w-3 h-3" /> Đã áp dụng mã giảm {appliedCoupon.discount_percent}%
                </p>
              )}
            </div>

            <div className="space-y-3 text-sm mb-6 border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Tạm tính</span>
                <span className="font-medium text-base">{formatCurrency(getSubtotal())}</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between items-center text-green-600">
                  <span>Giảm giá ({appliedCoupon.code})</span>
                  <span className="font-medium">-{formatCurrency(getSubtotal() * appliedCoupon.discount_percent / 100)}</span>
                </div>
              )}
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

      {/* Modal Quét Mã Chuyển Khoản VietQR */}
      <Dialog open={qrModalOpen} onOpenChange={(open) => { if (!open) handleCancelPayment(); }}>
        <DialogContent className="max-w-md text-center p-6 space-y-4">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-primary flex items-center justify-center gap-2">
              Thanh toán Chuyển khoản (Demo)
            </DialogTitle>
          </DialogHeader>
          <div className="bg-muted/60 p-4 rounded-xl space-y-2 text-sm text-left border">
            <div className="flex justify-between"><span>Ngân hàng:</span> <strong>Techcombank</strong></div>
            <div className="flex justify-between"><span>Số tài khoản:</span> <strong className="tracking-wider">123456789</strong></div>
            <div className="flex justify-between"><span>Chủ tài khoản:</span> <strong>Trần Quang Dũng</strong></div>
            <div className="flex justify-between border-t pt-2"><span>Số tiền:</span> <strong className="text-primary text-base font-bold">{createdOrder ? formatCurrency(createdOrder.total_amount) : ""}</strong></div>
            <div className="flex justify-between items-center"><span>Nội dung CK:</span> <strong className="text-amber-600 bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded tracking-wide">THANHTOAN {createdOrder?.id.split("-")[0].toUpperCase()}</strong></div>
          </div>
          <div className="border p-3 rounded-2xl bg-white inline-block mx-auto shadow-md">
            <img
              src={`https://img.vietqr.io/image/TCB-123456789-compact2.png?accountName=TRAN%20QUANG%20DUNG&amount=${createdOrder?.total_amount || 0}&addInfo=THANHTOAN%20${createdOrder?.id.split("-")[0].toUpperCase() || ""}&accountName=LUXE%20COMMERCE`}
              alt="VietQR Chuyển khoản"
              className="w-56 h-56 mx-auto object-contain"
            />
          </div>
          <p className="text-xs text-muted-foreground px-2">
            Mở App Ngân hàng hoặc MoMo quét mã QR trên để thanh toán.
          </p>
          <DialogFooter className="sm:justify-center pt-2">
            <Button size="lg" className="w-full font-bold shadow-lg shadow-primary/25" onClick={() => {
              setQrModalOpen(false);
              toast.success("Đã ghi nhận thanh toán!", { description: "Đơn hàng của bạn đang được xác nhận." });
              setSuccess(true);
            }}>
              <IconCheck className="w-5 h-5 mr-2" /> Tôi đã chuyển khoản xong
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
