import Link from "next/link";
import { CreditCard, FacebookIcon, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconBrandInstagram } from "@tabler/icons-react";

export function SiteFooter() {
  return (
    <footer className="bg-secondary/20 mt-20">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 px-4 md:px-10 py-16 max-w-7xl mx-auto w-full">
        <div className="col-span-1">
          <Link href="/" className="group text-xl md:text-2xl font-black tracking-tighter inline-flex items-center gap-2.5 mb-6 transition-all duration-300">
            <span className="flex items-center tracking-tight">
              <span className="bg-gradient-to-r from-violet-500 via-purple-400 to-fuchsia-400 dark:from-violet-300 dark:via-purple-200 dark:to-fuchsia-300 bg-clip-text text-transparent animate-shimmer-metallic drop-shadow-[0_0_12px_rgba(168,85,247,0.45)]">
                Luxe
              </span>
              <span className="ml-0.5 bg-gradient-to-r from-slate-700 via-slate-500 to-slate-800 dark:from-slate-100 dark:via-white dark:to-slate-300 bg-clip-text text-transparent drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
                Commerce
              </span>
            </span>
          </Link>
          <p className="text-sm text-muted-foreground mb-6">Trải nghiệm mua sắm đẳng cấp với những sản phẩm được tuyển chọn kỹ lưỡng.</p>
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"><FacebookIcon /></div>
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"><IconBrandInstagram /></div>
          </div>
        </div>

        <div className="col-span-1">
          <h4 className="text-sm font-semibold mb-6 uppercase tracking-wider">Thông tin</h4>
          <ul className="space-y-4">
            <li><Link className="text-sm text-muted-foreground hover:text-primary transition-colors" href="#">Về chúng tôi</Link></li>
            <li><Link className="text-sm text-muted-foreground hover:text-primary transition-colors" href="#">Cửa hàng</Link></li>
          </ul>
        </div>

        <div className="col-span-1">
          <h4 className="text-sm font-semibold mb-6 uppercase tracking-wider">Hỗ trợ</h4>
          <ul className="space-y-4">
            <li><Link className="text-sm text-muted-foreground hover:text-primary transition-colors" href="#">Chính sách đổi trả</Link></li>
            <li><Link className="text-sm text-muted-foreground hover:text-primary transition-colors" href="#">Chính sách bảo mật</Link></li>
            <li><Link className="text-sm text-muted-foreground hover:text-primary transition-colors" href="#">Điều khoản dịch vụ</Link></li>
          </ul>
        </div>

        <div className="col-span-1">
          <h4 className="text-sm font-semibold mb-6 uppercase tracking-wider">Bản tin</h4>
          <p className="text-sm text-muted-foreground mb-4">Đăng ký để nhận ưu đãi và tin tức mới nhất.</p>
          <form className="flex gap-2">
            <input 
              className="w-full bg-background py-2 px-4 rounded-md border focus:ring-2 focus:ring-primary focus:border-primary text-sm" 
              placeholder="Email của bạn" 
              type="email"
            />
            <Button type="button">Gửi</Button>
          </form>
        </div>
      </div>

      <div className="border-t px-4 md:px-10 py-6 max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-sm text-muted-foreground text-center md:text-left">
          © 2026 LuxeCommerce. All rights reserved.
        </p>
        <div className="flex gap-4">
          <Wallet className="w-6 h-6 text-muted-foreground" />
          <CreditCard className="w-6 h-6 text-muted-foreground" />
        </div>
      </div>
    </footer>
  );
}
