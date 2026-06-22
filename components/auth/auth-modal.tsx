"use client";

import { useAuthModal } from "@/lib/store/use-auth-modal";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { IconLoader2 } from "@tabler/icons-react";
import { supabase } from "@/lib/supabase/client";
import { isEmailRegistered, sendOtp, verifyOtp, completeRegister } from "@/lib/services/register.service";

export function AuthModal() {
  const { isOpen, closeModal, view, setView } = useAuthModal();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [regStep, setRegStep] = useState<"email" | "otp" | "password">("email");

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("Đăng nhập thành công!");
      closeModal();
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
    setLoading(true);
    setErrorMsg("");
    try {
      await completeRegister(fullName, password);
      toast.success("Đăng ký hoàn tất! Chào mừng bạn.");
      closeModal();
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
                    <button 
                      type="button" 
                      className="text-sm text-primary hover:underline"
                      onClick={() => setView("forgot_password")}
                    >
                      Quên mật khẩu?
                    </button>
                  </div>
                  <Input 
                    id="password" 
                    type="password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
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
                      <Input 
                        id="reg-password" 
                        type="password" 
                        required 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        minLength={6}
                      />
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
