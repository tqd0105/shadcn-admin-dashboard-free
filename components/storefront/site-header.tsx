"use client";

import Link from "next/link";
import { Search, ShoppingCart, Heart, User, Menu, LogOut, Package, HomeIcon, BoxIcon, UserIcon, LogOutIcon, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthModal } from "@/lib/store/use-auth-modal";
import { useCartStore } from "@/lib/store/use-cart-store";
import { useAuth } from "@/components/providers/auth-provider";
import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { supabase } from "@/lib/supabase/client";

export function SiteHeader() {
  const { openModal } = useAuthModal();
  const { user, profile, role, logout } = useAuth();
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setCartCount(0);
      return;
    }
    const fetchCount = async () => {
      const { count } = await supabase.from('cart_items').select('id', { count: 'exact' }).eq('user_id', user.id);
      if (count !== null) setCartCount(count);
    };
    fetchCount();

    const channel = supabase.channel('cart-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cart_items', filter: `user_id=eq.${user.id}` }, () => {
        fetchCount();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return (
    <header className="border-b bg-background sticky top-0 z-50">
      <div className="flex justify-between items-center w-full px-4 md:px-10 max-w-7xl mx-auto h-16 z-50">
        {/* Brand */}
        <Link href="/" className="text-xl font-bold tracking-tight flex-shrink-0 text-primary">
          LuxeCommerce
        </Link>

        {/* Search (Center, Desktop) */}
        <div className="hidden md:flex flex-1 max-w-2xl mx-10 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <input
            className="w-full bg-secondary/50 py-2.5 pl-12 pr-4 rounded-full border-transparent focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition-shadow outline-none"
            placeholder="Tìm kiếm sản phẩm cao cấp..."
            type="text"
          />
        </div>

        {/* Navigation Links (Desktop) */}
        <nav className="hidden lg:flex items-center gap-6 ml-auto mr-10">
          <Link className="text-sm font-medium text-primary border-b-2 border-primary pb-1" href="/">Trang chủ</Link>
          <Link className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-200" href="/products">Sản phẩm</Link>
          <Link className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-200" href="#">Bộ sưu tập</Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button variant="ghost" size="icon" className="md:hidden">
            <Search className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="hidden sm:inline-flex text-muted-foreground hover:text-primary">
            <Heart className="w-5 h-5" />
          </Button>
          <Link href="/cart" className="relative">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary relative">
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white text-[10px] flex items-center justify-center rounded-full">
                  {cartCount}
                </span>
              )}
            </Button>
          </Link>
          
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="hidden md:inline-flex text-muted-foreground hover:text-primary relative ml-2">
                  <User className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{profile?.full_name || user.email?.split('@')[0]}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/account" className="cursor-pointer flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    <span>Tài khoản của tôi</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/account/orders" className="cursor-pointer flex items-center">
                    <Package className="mr-2 h-4 w-4" />
                    <span>Lịch sử Mua hàng</span>
                  </Link>
                </DropdownMenuItem>
                {role === "admin" && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="cursor-pointer flex items-center text-primary font-medium">
                        <Shield className="mr-2 w-5 h-5" />  
                        <span>Quản trị (Admin)</span>
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => logout()} className="cursor-pointer text-red-600 focus:text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Đăng xuất</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button 
              className="hidden md:inline-flex rounded-full ml-2"
              onClick={() => openModal('login')}
            >
              Đăng nhập
            </Button>
          )}

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden text-muted-foreground ml-2">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px] z-[100]">
              <SheetHeader>
                <SheetTitle className="text-left font-bold text-primary text-xl">LuxeCommerce</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-4 px-4 py-8">
                <Link className="text-base font-medium hover:text-primary transition-colors flex items-center" href="/">
                  <HomeIcon  className="w-5 h-5 mr-2" />
                  <span>Trang chủ</span></Link>
                <Link className="text-base font-medium hover:text-primary transition-colors flex items-center" href="/products">
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  <span>Sản phẩm</span>
                </Link>
                <Link className="text-base font-medium hover:text-primary transition-colors flex items-center" href="#">
                  <BoxIcon className="w-5 h-5 mr-2" />
                  <span>Bộ sưu tập</span>
                </Link>
                <hr className="my-2 border-outline-variant" />
                {user ? (
                  <>
                    <Link className="text-base font-medium hover:text-primary transition-colors flex items-center" href="/account">
                      <UserIcon className="w-5 h-5 mr-2" />
                      <span>Tài khoản của tôi</span>
                    </Link>
                    <Link className="text-base font-medium hover:text-primary transition-colors flex items-center" href="/account/orders">
                      <Package className="w-5 h-5 mr-2" />
                      <span>Lịch sử Mua hàng</span>
                    </Link>
                    {role === "admin" && (
                      <Link className="text-base font-medium text-primary flex items-center" href="/dashboard">
                        <Shield className="w-5 h-5 mr-2" />
                        <span>Quản trị (Admin)</span>
                      </Link>
                    )}
                    <button onClick={() => logout()} className="text-base font-medium text-red-600 flex items-center mt-2">
                      <LogOutIcon className="w-5 h-5 mr-2" />
                      <span>Đăng xuất</span>
                    </button>
                  </>
                ) : (
                  <Button onClick={() => openModal('login')} className="w-full mt-4">
                    Đăng nhập / Đăng ký
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
