"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { 
  User, 
  Package, 
  MapPin, 
  Heart, 
  Settings, 
  LogOut 
} from "lucide-react";
import { IconLoader2 } from "@tabler/icons-react";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <IconLoader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const menuItems = [
    { name: "Tổng quan", href: "/account", icon: User },
    { name: "Lịch sử mua hàng", href: "/account/orders", icon: Package },
    { name: "Sổ địa chỉ", href: "/account/addresses", icon: MapPin },
    { name: "Yêu thích", href: "/account/wishlist", icon: Heart },
    { name: "Cài đặt", href: "/account/settings", icon: Settings },
  ];

  return (
    <div className="container mx-auto px-4 py-10 max-w-7xl min-h-[calc(100vh-200px)] animate-fade-in">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <aside className="w-full md:w-64 shrink-0">
          <div className="bg-white rounded-xl shadow-sm border p-4 sticky top-24">
            <div className="mb-6 px-4">
              <h2 className="text-xl font-bold">Tài khoản</h2>
              <p className="text-sm text-muted-foreground truncate">{user.email}</p>
            </div>
            
            <nav className="flex flex-col space-y-1">
              {menuItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    )}
                  >
                    <item.icon className={cn("mr-3 w-5 h-5", isActive ? "text-primary" : "text-gray-500")} />
                    {item.name}
                  </Link>
                );
              })}
              
              <hr className="my-2" />
              
              <button
                onClick={() => logout()}
                className="flex items-center px-4 py-3 text-sm font-medium rounded-lg text-red-600 hover:bg-red-50 transition-colors w-full text-left"
              >
                <LogOut className="mr-3 w-5 h-5 text-red-500" />
                Đăng xuất
              </button>
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <div className="bg-white rounded-xl shadow-sm border p-6 min-h-[400px]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
