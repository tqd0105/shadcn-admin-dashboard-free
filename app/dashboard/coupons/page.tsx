"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconLoader2,
} from "@tabler/icons-react";
import { 
  Coupon, 
  getCoupons, 
  createCoupon, 
  updateCoupon, 
  deleteCoupon,
  setFeaturedCoupon
} from "@/lib/services/coupon.service";

export default function CouponsPage() {
  const { role } = useAuth();
  const router = useRouter();

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Form states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [formData, setFormData] = useState({
    code: "",
    title: "",
    discount_percent: 0,
    valid_until: "",
    usage_limit: 0,
    is_active: true,
  });

  useEffect(() => {
    if (role && role !== "admin") {
      router.push("/dashboard");
    }
  }, [role, router]);

  useEffect(() => {
    async function fetchCoupons() {
      setLoading(true);
      const { data } = await getCoupons();
      if (data) {
        setCoupons(data);
      }
      setLoading(false);
    }
    fetchCoupons();
  }, [refreshTrigger]);

  const handleOpenCreateDialog = () => {
    setDialogMode("create");
    setFormData({
      code: "",
      title: "",
      discount_percent: 10,
      valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      usage_limit: 0,
      is_active: true,
    });
    setFormError("");
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (coupon: Coupon) => {
    setDialogMode("edit");
    setSelectedCoupon(coupon);
    setFormData({
      code: coupon.code,
      title: coupon.title || "",
      discount_percent: coupon.discount_percent,
      valid_until: new Date(coupon.valid_until).toISOString().slice(0, 16),
      usage_limit: coupon.usage_limit || 0,
      is_active: coupon.is_active,
    });
    setFormError("");
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formData.code.trim()) {
      setFormError("Vui lòng nhập mã giảm giá");
      return;
    }
    if (formData.discount_percent <= 0 || formData.discount_percent > 100) {
      setFormError("Phần trăm giảm phải từ 1 đến 100");
      return;
    }

    setIsSubmitting(true);

    const payload = {
      ...formData,
      code: formData.code.toUpperCase().trim(),
      usage_limit: formData.usage_limit > 0 ? formData.usage_limit : undefined,
      valid_until: new Date(formData.valid_until).toISOString(),
    };

    if (dialogMode === "create") {
      const { error } = await createCoupon(payload);
      if (error) {
        setFormError(error.message || "Lỗi khi tạo mã");
      } else {
        setIsDialogOpen(false);
        setRefreshTrigger((prev) => prev + 1);
      }
    } else if (dialogMode === "edit" && selectedCoupon) {
      const { error } = await updateCoupon(selectedCoupon.id, payload);
      if (error) {
        setFormError(error.message || "Lỗi khi cập nhật mã");
      } else {
        setIsDialogOpen(false);
        setRefreshTrigger((prev) => prev + 1);
      }
    }

    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa mã này?")) return;
    const { error } = await deleteCoupon(id);
    if (error) {
      alert("Lỗi khi xóa: " + error.message);
    } else {
      setRefreshTrigger((prev) => prev + 1);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await updateCoupon(id, { is_active: !currentStatus });
    if (error) {
      alert("Lỗi khi cập nhật trạng thái");
    } else {
      setRefreshTrigger((prev) => prev + 1);
    }
  };

  const handleToggleFeatured = async (id: string, currentStatus: boolean) => {
    if (currentStatus) {
      // Un-feature it
      const { error } = await updateCoupon(id, { is_featured: false });
      if (!error) setRefreshTrigger((prev) => prev + 1);
    } else {
      // Set as featured
      const { error } = await setFeaturedCoupon(id);
      if (!error) setRefreshTrigger((prev) => prev + 1);
    }
  };

  if (role !== "admin") return null;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Mã giảm giá (Coupons)</h1>
          <p className="text-gray-500 text-sm">Quản lý các mã giảm giá và hiển thị trên trang chủ</p>
        </div>
        <Button onClick={handleOpenCreateDialog}>
          <IconPlus className="w-4 h-4 mr-2" /> Thêm Mã mới
        </Button>
      </div>

      <div className=" rounded-xl shadow-sm border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã code</TableHead>
              <TableHead>Tiêu đề (Home)</TableHead>
              <TableHead>Giảm giá</TableHead>
              <TableHead>Đã dùng</TableHead>
              <TableHead>Hạn sử dụng</TableHead>
              <TableHead>Active</TableHead>
              <TableHead>Hiện trang chủ</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  <IconLoader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                </TableCell>
              </TableRow>
            ) : coupons.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-gray-500">
                  Chưa có mã giảm giá nào.
                </TableCell>
              </TableRow>
            ) : (
              coupons.map((coupon) => (
                <TableRow key={coupon.id}>
                  <TableCell className="font-mono font-bold text-indigo-600">
                    {coupon.code}
                  </TableCell>
                  <TableCell>{coupon.title || "-"}</TableCell>
                  <TableCell>{coupon.discount_percent}%</TableCell>
                  <TableCell>
                    {coupon.used_count} / {coupon.usage_limit || "∞"}
                  </TableCell>
                  <TableCell>
                    {new Date(coupon.valid_until).toLocaleDateString("vi-VN")}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={coupon.is_active}
                      onCheckedChange={() => handleToggleActive(coupon.id, coupon.is_active)}
                    />
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={coupon.is_featured}
                      onCheckedChange={() => handleToggleFeatured(coupon.id, coupon.is_featured)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenEditDialog(coupon)}
                    >
                      <IconEdit className="w-4 h-4 text-gray-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(coupon.id)}
                    >
                      <IconTrash className="w-4 h-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "create" ? "Thêm mã giảm giá mới" : "Chỉnh sửa mã giảm giá"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            {formError && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                {formError}
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Mã code</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="VD: WELCOME20"
                  className="uppercase font-mono"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Phần trăm giảm (%)</Label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={formData.discount_percent}
                  onChange={(e) => setFormData({ ...formData, discount_percent: parseInt(e.target.value) || 0 })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tiêu đề (Hiển thị trang chủ)</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="VD: Mã giảm 20% cho đơn hàng đầu tiên"
              />
              <p className="text-xs text-gray-500">Dùng để mời gọi khách hàng copy mã nếu mã này được chọn hiển thị ở trang chủ.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Hạn sử dụng</Label>
                <Input
                  type="datetime-local"
                  value={formData.valid_until}
                  onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Giới hạn lượt dùng</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.usage_limit}
                  onChange={(e) => setFormData({ ...formData, usage_limit: parseInt(e.target.value) || 0 })}
                />
                <p className="text-xs text-gray-500">Để 0 là không giới hạn</p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label>Kích hoạt (Cho phép sử dụng)</Label>
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSubmitting}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <IconLoader2 className="w-4 h-4 mr-2 animate-spin" />}
                Lưu mã giảm giá
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
