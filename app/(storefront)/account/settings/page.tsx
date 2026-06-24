"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfile, updatePassword } from "@/lib/services/profile.service";
import { IconLoader2, IconCheck } from "@tabler/icons-react";

export default function AccountSettingsPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    password: "",
    confirm_password: "",
  });

  useEffect(() => {
    if (profile) {
      setFormData((prev) => ({
        ...prev,
        full_name: profile.full_name || "",
        phone: profile.phone || "",
      }));
    }
  }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    setSuccess("");
    setError("");

    try {
      // 1. Cập nhật profile (tên, SĐT)
      const { error: profileError } = await updateProfile(user.id, {
        full_name: formData.full_name,
        phone: formData.phone,
      });

      if (profileError) throw profileError;

      // 2. Cập nhật mật khẩu nếu có nhập
      if (formData.password) {
        if (formData.password !== formData.confirm_password) {
          throw new Error("Mật khẩu xác nhận không khớp.");
        }
        const { error: passwordError } = await updatePassword(formData.password);
        if (passwordError) throw passwordError;
      }

      setSuccess("Cập nhật thông tin thành công!");
      setFormData(prev => ({ ...prev, password: "", confirm_password: "" }));
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi khi cập nhật");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return <div className="py-10 text-center"><IconLoader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" /></div>;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Cài đặt tài khoản</h1>

      {success && (
        <div className="bg-green-50 text-green-700 p-4 rounded-lg mb-6 flex items-center">
          <IconCheck className="w-5 h-5 mr-2" /> {success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">Thông tin cá nhân</h2>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email đăng nhập</Label>
            <Input 
              id="email" 
              type="email" 
              value={user?.email || ""} 
              disabled 
              className="bg-gray-50 text-gray-500"
            />
            <p className="text-xs text-muted-foreground">Không thể thay đổi email.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Họ và tên</Label>
              <Input 
                id="full_name" 
                name="full_name"
                value={formData.full_name} 
                onChange={handleChange}
                placeholder="Nhập họ và tên..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Số điện thoại</Label>
              <Input 
                id="phone" 
                name="phone"
                value={formData.phone} 
                onChange={handleChange}
                placeholder="Nhập số điện thoại..."
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-4">
          <h2 className="text-lg font-semibold border-b pb-2">Đổi mật khẩu</h2>
          <p className="text-sm text-muted-foreground mb-4">Bỏ trống nếu bạn không muốn đổi mật khẩu.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu mới</Label>
              <Input 
                id="password" 
                name="password"
                type="password"
                value={formData.password} 
                onChange={handleChange}
                placeholder="Ít nhất 6 ký tự"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm_password">Xác nhận mật khẩu</Label>
              <Input 
                id="confirm_password" 
                name="confirm_password"
                type="password"
                value={formData.confirm_password} 
                onChange={handleChange}
                placeholder="Nhập lại mật khẩu mới"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <Button type="submit" disabled={loading} size="lg">
            {loading ? <IconLoader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Lưu thay đổi
          </Button>
        </div>
      </form>
    </div>
  );
}
