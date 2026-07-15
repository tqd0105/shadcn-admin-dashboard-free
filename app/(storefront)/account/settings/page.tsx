"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfile, updatePassword, uploadAvatar } from "@/lib/services/profile.service";
import { IconLoader2, IconUpload, IconCamera } from "@tabler/icons-react";
import { Eye, EyeOff } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import Image from "next/image";

export default function AccountSettingsPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const authProvider = user?.app_metadata?.provider || "email";
  const isOAuth = ["google", "github", "facebook", "apple"].includes(authProvider);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    password: "",
    confirm_password: "",
  });
  
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setFormData((prev) => ({
        ...prev,
        full_name: profile.full_name || "",
        phone: profile.phone || "",
      }));
      setAvatarUrl(profile.avatar_url || user?.user_metadata?.avatar_url || null);
    }
  }, [profile, user]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !user) return;
    const file = e.target.files[0];
    
    setUploadingAvatar(true);
    
    try {
      const newAvatarUrl = await uploadAvatar(user.id, file);
      setAvatarUrl(newAvatarUrl);
      
      // Update profile immediately with new avatar
      await updateProfile(user.id, { avatar_url: newAvatarUrl });
      toast.success("Ảnh đại diện đã được cập nhật!");
    } catch (err: any) {
      toast.error("Lỗi tải lên ảnh: " + (err.message || err.toString()));
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    // Validation
    if (formData.phone) {
      // Regex for Vietnamese phone numbers
      const phoneRegex = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;
      if (!phoneRegex.test(formData.phone.replace(/\s+/g, ''))) {
        toast.error("Số điện thoại không hợp lệ. Vui lòng kiểm tra lại (VD: 0912345678).");
        return;
      }
    }

    if (formData.full_name && formData.full_name.trim().length < 2) {
      toast.error("Họ và tên quá ngắn.");
      return;
    }

    if (!isOAuth && formData.password) {
      if (formData.password.length < 8) {
        toast.error("Mật khẩu mới phải có ít nhất 8 ký tự.");
        return;
      }
      if (!/[A-Z]/.test(formData.password)) {
        toast.error("Mật khẩu mới phải chứa ít nhất 1 chữ in hoa.");
        return;
      }
      if (!/[0-9]/.test(formData.password)) {
        toast.error("Mật khẩu mới phải chứa ít nhất 1 chữ số.");
        return;
      }
      if (formData.password !== formData.confirm_password) {
        toast.error("Mật khẩu xác nhận không khớp.");
        return;
      }
    }

    setLoading(true);

    try {
      // 1. Cập nhật profile (tên, SĐT)
      const { error: profileError } = await updateProfile(user.id, {
        full_name: formData.full_name,
        phone: formData.phone,
      });

      if (profileError) throw profileError;

      // 2. Cập nhật mật khẩu nếu có nhập (chỉ áp dụng khi không phải OAuth)
      if (!isOAuth && formData.password) {
        const { error: passwordError } = await updatePassword(formData.password);
        if (passwordError) throw passwordError;
      }

      toast.success("Cập nhật thông tin thành công!");
      setFormData(prev => ({ ...prev, password: "", confirm_password: "" }));
    } catch (err: any) {
      toast.error(err.message || "Đã xảy ra lỗi khi cập nhật");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return <div className="py-10 text-center"><IconLoader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" /></div>;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Cài đặt tài khoản</h1>

      <div className="mb-8 flex flex-col sm:flex-row items-center gap-6 p-6 border rounded-xl bg-card">
        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
          <Avatar className="h-24 w-24  shadow-md group-hover:opacity-80 transition-opacity">
            <AvatarImage src={avatarUrl || ""} />
            <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
              {user?.email?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
            {uploadingAvatar ? (
              <IconLoader2 className="w-6 h-6 text-white animate-spin" />
            ) : (
              <IconCamera className="w-8 h-8 text-white" />
            )}
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/png, image/jpeg, image/webp" 
            onChange={handleAvatarChange}
            disabled={uploadingAvatar}
          />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Ảnh đại diện</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-3">
            Hỗ trợ PNG, JPG, WEBP. Kích thước tối đa 5MB.
          </p>
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploadingAvatar}>
            {uploadingAvatar ? "Đang tải lên..." : "Chọn ảnh mới"}
          </Button>
        </div>
      </div>

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
              className="bg-muted text-muted-foreground"
            />
            <p className="text-xs text-muted-foreground">Không thể thay đổi email lúc này.</p>
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
                type="tel"
                value={formData.phone} 
                onChange={handleChange}
                placeholder="Ví dụ: 0912345678"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-4">
          <h2 className="text-lg font-semibold border-b pb-2">Bảo mật & Đăng nhập</h2>
          
          {isOAuth ? (
            <div className="p-5 rounded-xl border border-blue-200 dark:border-blue-800/60 bg-blue-50/50 dark:bg-blue-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="p-3 rounded-xl   bg-white dark:bg-gray-900 border shadow-2xs shrink-0 flex items-center justify-center">
                  <Image src="/icons/google.png" alt="Google" width={40} height={40} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-foreground">Đăng nhập qua tài khoản Google</h4>
                    <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full bg-green-600 dark:bg-green-900/60 text-white dark:text-green-300 border border-green-200 dark:border-green-800">
                      Đã liên kết
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Tài khoản của bạn được bảo mật và quản lý xác thực trực tiếp bởi <strong>Google</strong>. Bạn không cần và không áp dụng việc đổi mật khẩu tại đây.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">Bỏ trống nếu bạn không muốn đổi mật khẩu.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Mật khẩu mới</Label>
                  <div className="relative">
                    <Input 
                      id="password" 
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password} 
                      onChange={handleChange}
                      placeholder="Ít nhất 8 ký tự, 1 chữ hoa, 1 số"
                      className="pr-10"
                    />
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm_password">Xác nhận mật khẩu</Label>
                  <div className="relative">
                    <Input 
                      id="confirm_password" 
                      name="confirm_password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirm_password} 
                      onChange={handleChange}
                      placeholder="Nhập lại mật khẩu mới"
                      className="pr-10"
                    />
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className=" flex justify-end">
          <Button type="submit" disabled={loading} size="lg">
            {loading ? <IconLoader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Lưu thay đổi
          </Button>
        </div>
      </form>
    </div>
  );
}
