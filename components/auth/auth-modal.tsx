"use client";

import { useAuthModal } from "@/lib/store/use-auth-modal";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { IconLoader2 } from "@tabler/icons-react";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { isEmailRegistered, sendOtp, verifyOtp, completeRegister } from "@/lib/services/register.service";
import { getProfile } from "@/lib/services/profile.service";
import { getRole } from "@/lib/services/role.service";
import { useAuth } from "@/components/providers/auth-provider";
import { useRouter } from "next/navigation";

export function AuthModal() {
  const router = useRouter();
  const { showLockedAlert } = useAuth();
  const { isOpen, closeModal, view, setView } = useAuthModal();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [regStep, setRegStep] = useState<"email" | "otp" | "password">("email");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setErrorMsg("");
        setPassword("");
        setOtp("");
        setRegStep("email");
        setView("login");
      }, 300); // Wait for modal slide-out animation to finish before clearing
      return () => clearTimeout(timer);
    }
  }, [isOpen, setView]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const targetPath = typeof window !== "undefined" && window.location.pathname === "/cart" ? "/checkout" : (typeof window !== "undefined" ? window.location.pathname : "/");
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}${targetPath}`,
        },
      });
      if (error) throw error;
      // Supabase sẽ redirect sang Google, không cần closeModal
    } catch (err: any) {
      toast.error(err.message || "Lỗi đăng nhập bằng Google");
      setErrorMsg(err.message || "Không thể kết nối đến Google.");
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      let userRole = "customer";
      if (authData?.user) {
        const { data: profileData } = await getProfile(authData.user.id);
        if (profileData?.is_locked) {
          await supabase.auth.signOut();
          closeModal();
          showLockedAlert();
          return;
        }
        if (profileData?.role_id) {
          const { data: roleData } = await getRole(profileData.role_id);
          if (roleData?.name) {
            userRole = roleData.name;
          }
        }
      }
      toast.success("Đăng nhập thành công!");
      closeModal();
      if (userRole === "admin" || userRole === "staff") {
        router.push("/dashboard");
      } else if (typeof window !== "undefined" && window.location.pathname === "/cart") {
        router.push("/checkout");
      } else {
        router.push("/");
      }
    } catch (err: any) {
      let msg = err.message || "Lỗi đăng nhập";
      if (msg === "Invalid login credentials") msg = "Email hoặc mật khẩu không chính xác.";
      toast.error(msg);
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    try {
      const exists = await isEmailRegistered(email);
      if (exists) {
        toast.error("Email này đã được đăng ký. Vui lòng đăng nhập.");
        setView("login");
        return;
      }
      const { error } = await sendOtp(email);
      if (error) throw error;
      toast.success("Mã xác thực đã được gửi đến email của bạn!");
      setRegStep("otp");
    } catch (err: any) {
      toast.error(err.message || "Lỗi gửi mã OTP");
      setErrorMsg(err.message || "Lỗi gửi mã OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    try {
      const { error } = await verifyOtp(email, otp);
      if (error) throw error;
      toast.success("Xác thực email thành công!");
      setRegStep("password");
    } catch (err: any) {
      toast.error(err.message || "Mã OTP không hợp lệ");
      setErrorMsg("Mã OTP không chính xác hoặc đã hết hạn.");
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setErrorMsg("Mật khẩu phải có ít nhất 8 ký tự.");
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setErrorMsg("Mật khẩu phải chứa ít nhất 1 chữ in hoa.");
      return;
    }
    if (!/[0-9]/.test(password)) {
      setErrorMsg("Mật khẩu phải chứa ít nhất 1 chữ số.");
      return;
    }
    setLoading(true);
    setErrorMsg("");
    try {
      await completeRegister(fullName, password);
      toast.success("Đăng ký hoàn tất! Chào mừng bạn.");
      closeModal();
      if (typeof window !== "undefined" && window.location.pathname === "/cart") {
        router.push("/checkout");
      }
    } catch (err: any) {
      toast.error(err.message || "Lỗi cập nhật thông tin");
      setErrorMsg(err.message || "Đã xảy ra lỗi khi hoàn tất đăng ký.");
    } finally {
      setLoading(false);
    }
  };

  // Reset steps when changing view
  const switchView = (newView: "login" | "register" | "forgot_password") => {
    setErrorMsg("");
    setView(newView);
    if (newView === "register") setRegStep("email");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeModal()}>
      <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden border-none shadow-2xl">
        <div className="flex flex-col">
          <div className="bg-primary/5 p-6 text-center border-b">
            <h2 className="text-2xl font-bold text-primary tracking-tight">LuxeCommerce</h2>
            <p className="text-muted-foreground text-sm mt-2">
              {view === "login" ? "Đăng nhập để trải nghiệm mua sắm" : "Tạo tài khoản mới"}
            </p>
          </div>
          <div className="p-6">
            {view === "login" ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="name@example.com" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Mật khẩu</Label>
                    {/* <button 
                      type="button" 
                      className="text-sm text-primary hover:underline"
                      onClick={() => setView("forgot_password")}
                    >
                      Quên mật khẩu?
                    </button> */}
                  </div>
                  <div className="relative">
                    <Input 
                      id="password" 
                      type={showLoginPassword ? "text" : "password"} 
                      required 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-10"
                    />
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                
                {errorMsg && (
                  <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md font-medium">
                    {errorMsg}
                  </div>
                )}

                <Button type="submit" className="w-full h-11" disabled={loading}>
                  {loading && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Đăng nhập
                </Button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">hoặc</span></div>
                </div>

                <Button type="button" variant="outline" className="w-full h-11 gap-2" disabled={loading} onClick={handleGoogleLogin}>
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Đăng nhập bằng Google
                </Button>

                <div className="text-center text-sm mt-4">
                  Chưa có tài khoản?{" "}
                  <button type="button" className="text-primary font-semibold hover:underline" onClick={() => setView("register")}>
                    Đăng ký ngay
                  </button>
                </div>
              </form>
            ) : view === "register" ? (
              <div className="space-y-4">
                {regStep === "email" && (
                  <form onSubmit={handleRegisterEmail} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reg-email">Email</Label>
                      <Input 
                        id="reg-email" 
                        type="email" 
                        placeholder="name@example.com" 
                        required 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    
                    {errorMsg && (
                      <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md font-medium">
                        {errorMsg}
                      </div>
                    )}

                    <Button type="submit" className="w-full h-11" disabled={loading}>
                      {loading && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Gửi mã xác thực
                    </Button>
                  </form>
                )}

                {regStep === "otp" && (
                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <p className="text-sm text-muted-foreground text-center">
                      Vui lòng nhập mã gồm 6 chữ số đã được gửi đến <span className="font-medium text-foreground">{email}</span>
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="otp">Mã xác thực</Label>
                      <Input 
                        id="otp" 
                        type="text" 
                        placeholder="123456" 
                        maxLength={6}
                        required 
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className="text-center tracking-widest text-lg"
                      />
                    </div>
                    
                    {errorMsg && (
                      <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md font-medium">
                        {errorMsg}
                      </div>
                    )}

                    <Button type="submit" className="w-full h-11" disabled={loading || otp.length < 6}>
                      {loading && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Xác nhận mã
                    </Button>
                    <div className="text-center">
                      <button type="button" className="text-sm text-primary hover:underline" onClick={() => setRegStep("email")} disabled={loading}>
                        Đổi email khác
                      </button>
                    </div>
                  </form>
                )}

                {regStep === "password" && (
                  <form onSubmit={handleCompleteRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullname">Họ và tên</Label>
                      <Input 
                        id="fullname" 
                        type="text" 
                        placeholder="Nguyễn Văn A" 
                        required 
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-password">Mật khẩu</Label>
                      <div className="relative">
                        <Input 
                          id="reg-password" 
                          type={showRegPassword ? "text" : "password"} 
                          required 
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          minLength={8}
                          placeholder="Ít nhất 8 ký tự, 1 hoa, 1 số"
                          className="pr-10"
                        />
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground"
                          onClick={() => setShowRegPassword(!showRegPassword)}
                        >
                          {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                    
                    {errorMsg && (
                      <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md font-medium">
                        {errorMsg}
                      </div>
                    )}

                    <Button type="submit" className="w-full h-11" disabled={loading}>
                      {loading && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Hoàn tất đăng ký
                    </Button>
                  </form>
                )}

                {regStep === "email" && (
                  <div className="text-center text-sm mt-4">
                    Đã có tài khoản?{" "}
                    <button type="button" className="text-primary font-semibold hover:underline" onClick={() => switchView("login")}>
                      Đăng nhập
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4 text-center">
                <p className="text-sm text-muted-foreground">Tính năng quên mật khẩu đang được phát triển.</p>
                <Button variant="outline" className="w-full" onClick={() => setView("login")}>
                  Quay lại đăng nhập
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
