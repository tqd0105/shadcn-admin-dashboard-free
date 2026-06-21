"use client";

import Link from "next/link";
import { Search, ShoppingCart, Heart, User, Menu, LogOut, Package } from "lucide-react";
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

export function SiteHeader() {
  const { openModal } = useAuthModal();
  const { user, profile, logout } = useAuth();
  const { items } = useCartStore();

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
          <Link className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-200" href="#">Sản phẩm mới</Link>
          <Link className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-200" href="#">Bộ sưu tập</Link>
          <Link className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-200" href="#">Bán chạy</Link>
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
              {items.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white text-[10px] flex items-center justify-center rounded-full">
                  {items.length}
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
                  <Link href="/profile" className="cursor-pointer flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    <span>Tài khoản của tôi</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/orders" className="cursor-pointer flex items-center">
                    <Package className="mr-2 h-4 w-4" />
                    <span>Đơn hàng</span>
                  </Link>
                </DropdownMenuItem>
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

          <Button variant="ghost" size="icon" className="lg:hidden text-muted-foreground ml-2">
            <Menu className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
