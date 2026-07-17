"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Search, ShoppingCart, Heart, Bell, User, Menu, LogOut, Package, HomeIcon, BoxIcon, UserIcon, LogOutIcon, Shield, MapPin, Settings, Sparkles, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuthModal } from "@/lib/store/use-auth-modal";
import { useCartStore } from "@/lib/store/use-cart-store";
import { useAuth } from "@/components/providers/auth-provider";
import { useEffect, useState, useRef } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "./theme-toggle";
import { NotificationDropdown } from "@/components/notifications/notification-dropdown";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/lib/supabase/client";
import { getProduct } from "@/lib/services/product.service";
import { getGuestCartItems } from "@/lib/services/cart.service";


export function SiteHeader() {
  const { openModal } = useAuthModal();
  const { user, profile, role, logout } = useAuth();
  const [cartCount, setCartCount] = useState(0);
  const [isBumping, setIsBumping] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const initialLoadDone = useRef(false);

  // Search Suggestions State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const fetchResults = async () => {
      if (searchQuery.trim().length === 0) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      const { data } = await getProduct(searchQuery, 1, 5);
      if (data) {
        setSearchResults(data);
      }
      setIsSearching(false);
    };

    const debounceTimer = setTimeout(fetchResults, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setShowSuggestions(false), 0);
    return () => clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    if (cartCount > 0 && initialLoadDone.current) {
      const startTimer = setTimeout(() => setIsBumping(true), 0);
      const endTimer = setTimeout(() => setIsBumping(false), 300);
      return () => {
        clearTimeout(startTimer);
        clearTimeout(endTimer);
      };
    }
  }, [cartCount]);

  useEffect(() => {
    if (!user) {
      const updateGuestCount = () => {
        const items = getGuestCartItems();
        const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);
        setCartCount(totalQty);
        initialLoadDone.current = true;
      };
      setTimeout(updateGuestCount, 0);
      window.addEventListener("cart-updated", updateGuestCount);
      return () => {
        window.removeEventListener("cart-updated", updateGuestCount);
      };
    }
    const fetchCount = async () => {
      const { count } = await supabase.from('cart_items').select('id', { count: 'exact' }).eq('user_id', user.id);
      if (count !== null) setCartCount(count);
      initialLoadDone.current = true;
    };
    fetchCount();

    // Listen to custom event for instant updates from other components
    const handleCartUpdate = () => fetchCount();
    window.addEventListener("cart-updated", handleCartUpdate);

    const channel = supabase.channel('cart-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cart_items', filter: `user_id=eq.${user.id}` }, () => {
        fetchCount();
      })
      .subscribe();

    return () => {
      window.removeEventListener("cart-updated", handleCartUpdate);
      supabase.removeChannel(channel);
    };
  }, [user]);
  return (
    <header className="border-b bg-background sticky top-0 z-50">
      <div className="flex flex-wrap md:flex-nowrap justify-between items-center w-full px-4 md:px-10 max-w-7xl mx-auto py-3 md:py-0 md:h-20 z-50 gap-y-3 md:gap-y-0">
        {/* Brand */}
        <div className="flex items-center gap-2 md:gap-4 order-1">
          {/* Mobile Menu */}
          <div className="flex lg:hidden items-center">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="mr-2">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[310px] sm:w-[360px] p-0 flex flex-col h-full bg-background overflow-hidden border-r">
                <SheetTitle className="sr-only">Menu Điều Hướng</SheetTitle>
                {/* 1. Header Khu Vực Tài Khoản */}
                <div className="p-6 pb-5 bg-muted/30 border-b">
                  {user ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 border-2 border-primary/20 shadow-sm">
                          <AvatarImage src={profile?.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture} />
                          <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                            {user.email?.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-base truncate text-foreground">
                            {profile?.full_name || user.user_metadata?.full_name || "Khách hàng"}
                          </h4>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                          <div className="mt-1 flex items-center gap-1.5">
                            {role === "admin" ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-destructive/15 text-destructive">
                                {/* <Shield className="w-3 h-3" />  */}
                                Quản trị viên
                              </span>
                            ) : role === "staff" ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 ">
                                {/* <Shield className="w-3 h-3" /> */}
                                 Nhân viên
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary">
                                Thành viên
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Nút vào Bảng Quản Trị dành riêng cho Admin */}
                      {role === "admin" && (
                        <SheetClose asChild>
                          <Link
                            href="/dashboard"
                            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 text-white font-bold text-sm shadow-md shadow-red-500/20 hover:opacity-95 transition-opacity"
                          >
                            <Image src="/icons/dashboard3.png" alt="Logo" width={20} height={20} /> Bảng Quản Trị (Admin)
                          </Link>
                        </SheetClose>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-2 space-y-3">

                      <div>
                        <h4 className="font-bold text-base text-foreground uppercase">Chào mừng đến LuxeCommerce</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Đăng nhập để nhận ưu đãi & theo dõi đơn hàng
                        </p>
                      </div>
                      <SheetClose asChild>
                        <Button
                          onClick={() => openModal("login")}
                          className="w-full font-bold shadow-md shadow-primary/20"
                          size="lg"
                        >
                          Đăng nhập / Đăng ký
                        </Button>
                      </SheetClose>
                    </div>
                  )}
                </div>

                {/* 2. Menu Điều Hướng Cuộn */}
                <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
                  {/* Khám Phá */}
                  <div className="space-y-1">
                    <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 mb-2">
                      Khám phá
                    </p>
                    <SheetClose asChild>
                      <Link
                        href="/"
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-colors",
                          pathname === "/" ? "bg-primary/10 text-primary font-bold" : "text-foreground/80 hover:bg-muted"
                        )}
                      >
                        <HomeIcon className="w-4 h-4" /> Trang chủ
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link
                        href="/products"
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-colors",
                          pathname?.startsWith("/products") ? "bg-primary/10 text-primary font-bold" : "text-foreground/80 hover:bg-muted"
                        )}
                      >
                        <Package className="w-4 h-4" /> Tất cả sản phẩm
                      </Link>
                    </SheetClose>
                    {/* Cart link — ẩn với Admin và Staff */}
                    {role !== "admin" && role !== "staff" && (
                      <SheetClose asChild>
                        <Link
                          href="/cart"
                          className={cn(
                            "flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-sm transition-colors",
                            pathname === "/cart" ? "bg-primary/10 text-primary font-bold" : "text-foreground/80 hover:bg-muted"
                          )}
                        >
                          <span className="flex items-center gap-3">
                            <ShoppingCart className="w-4 h-4 text-blue-500" /> Giỏ hàng
                          </span>
                          {cartCount > 0 && (
                            <span className="bg-red-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                              {cartCount}
                            </span>
                          )}
                        </Link>
                      </SheetClose>
                    )}
                    {/* <SheetClose asChild>
                      <Link
                        href="/account/wishlist"
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-colors",
                          pathname === "/account/wishlist" ? "bg-primary/10 text-primary font-bold" : "text-foreground/80 hover:bg-muted"
                        )}
                      >
                        <Heart className="w-4 h-4 text-rose-500" /> Sản phẩm yêu thích
                      </Link>
                    </SheetClose> */}
                  </div>

                  {/* Cá Nhân (Chỉ hiện khi đăng nhập — Customer) */}
                  {user && role !== "admin" && role !== "staff" && (
                    <div className="space-y-1 pt-2 border-t">
                      <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 mb-2">
                        Tài khoản của tôi
                      </p>
                      <SheetClose asChild>
                        <Link
                          href="/cart"
                          className="flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-sm text-foreground/80 hover:bg-muted transition-colors"
                        >
                          <span className="flex items-center gap-3">
                            <ShoppingCart className="w-4 h-4 text-blue-500" /> Giỏ hàng
                          </span>
                          {cartCount > 0 && (
                            <span className="bg-red-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                              {cartCount}
                            </span>
                          )}
                        </Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link
                          href="/account/orders"
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm text-foreground/80 hover:bg-muted transition-colors"
                        >
                          <BoxIcon className="w-4 h-4 text-amber-500" /> Lịch sử đơn hàng
                        </Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link
                          href="/account/addresses"
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm text-foreground/80 hover:bg-muted transition-colors"
                        >
                          <MapPin className="w-4 h-4 text-emerald-500" /> Sổ địa chỉ nhận hàng
                        </Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link
                          href="/account/settings"
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm text-foreground/80 hover:bg-muted transition-colors"
                        >
                          <Settings className="w-4 h-4 text-gray-500" /> Cài đặt tài khoản
                        </Link>
                      </SheetClose>
                    </div>
                  )}

                  {/* Staff: shortcut vào Staff Dashboard */}
                  {user && role === "staff" && (
                    <div className="space-y-1 pt-2 border-t">
                      <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 mb-2">
                        Khu vực nội bộ
                      </p>
                      <SheetClose asChild>
                        <Link
                          href="/dashboard"
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-colors"
                        >
                            <Image src="/icons/dashboard5.png" alt="Logo" width={20} height={20} />         
                           Bảng điều hành (Staff)
                        </Link>
                      </SheetClose>
                    </div>
                  )}
                </div>

                {/* 3. Chân Drawer */}
                <div className="p-4 border-t bg-muted/20 space-y-3 mt-auto">
                  <div className="flex items-center justify-between px-2 py-1">
                    <span className="text-sm font-semibold text-foreground/80">Giao diện (Sáng/Tối)</span>
                    <ThemeToggle />
                  </div>
                  {user && (
                    <SheetClose asChild>
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 font-bold text-sm h-11 px-4 rounded-xl"
                        onClick={logout}
                      >
                        <LogOut className="w-4 h-4 mr-3" /> Đăng xuất tài khoản
                      </Button>
                    </SheetClose>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
          <Link href="/" className="group text-xl md:text-2xl font-black tracking-tighter flex-shrink-0 flex items-center gap-2.5 transition-all duration-300">
            <div className="relative">
              <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-violet-600 via-purple-500 to-indigo-500 blur-lg opacity-50 group-hover:opacity-80 transition duration-800 animate-pulse" />
              <Image src="/icons/luxecommerce.png" alt="Logo" width={34} height={34} className="relative  " />
            </div>
            <span className="flex items-center tracking-tight ">
              <span className="bg-gradient-to-r from-violet-500 via-purple-400 to-fuchsia-400 dark:from-violet-300 dark:via-purple-200 dark:to-fuchsia-300 bg-clip-text text-transparent animate-shimmer-metallic drop-shadow-[0_0_12px_rgba(168,85,247,0.45)]">
                Luxe
              </span>
              <span className="ml-0.5  bg-gradient-to-r from-slate-700 via-slate-500 to-slate-800 dark:from-slate-100 dark:via-white dark:to-slate-300 bg-clip-text text-transparent drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
                Commerce
              </span>
              <Image src="/icons/star.png" alt="Logo" width={25} height={25} className="ml-1.5 animate__animated animate__flash animate__infinite inline-block" />
            </span>
          </Link>
        </div>

        {/* Search (Row 2 on Mobile, Center on Desktop) */}
        <div ref={searchRef} className="flex w-full md:w-auto order-3 md:order-2 md:flex-1 max-w-2xl md:mx-10 relative">
          <form action="/products" method="GET" className="w-full relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input
              name="search"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              className="w-full bg-secondary/50 py-2.5 pl-12 pr-4 rounded-full border-transparent focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition-shadow outline-none"
              placeholder="Tìm kiếm sản phẩm cao cấp..."
              type="text"
              required
              autoComplete="off"
            />
          </form>

          {/* Suggestions Dropdown */}
          {showSuggestions && searchQuery.trim().length > 0 && (
            <div className="absolute top-full mt-2 w-full bg-background border rounded-xl shadow-lg overflow-hidden z-50">
              {isSearching ? (
                <div className="p-4 text-center text-sm text-muted-foreground">Đang tìm kiếm...</div>
              ) : searchResults.length > 0 ? (
                <div className="py-2">
                  {searchResults.map((product) => {
                    const price = product.price;
                    const salePrice = product.discount_percent ? Math.round(price * (1 - product.discount_percent / 100)) : price;
                    return (
                      <Link
                        key={product.id}
                        href={`/product/${product.id}`}
                        className="flex items-center gap-3 px-4 py-2 hover:bg-secondary/80 transition-colors"
                        onClick={() => setShowSuggestions(false)}
                      >
                        <Image width={40} height={40} unoptimized src={product.image_url || "https://placehold.co/40x40"} alt={product.name} className="w-10 h-10 object-cover rounded-md border" />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium line-clamp-1">{product.name}</span>
                          <span className="text-xs text-red-600 font-bold">
                            {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(salePrice)}
                          </span>
                        </div>
                      </Link>
                    )
                  })}
                  <div className="border-t px-4 py-3 mt-2 bg-secondary/30">
                    <Link href={`/products?search=${searchQuery}`} onClick={() => setShowSuggestions(false)} className="text-sm font-medium text-primary text-center block hover:underline">
                      Xem tất cả kết quả
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">Không tìm thấy sản phẩm nào</div>
              )}
            </div>
          )}
        </div>

        {/* Actions (Right) */}
        <div className="flex items-center gap-2 flex-shrink-0 order-2 md:order-3">
          {/* Navigation Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-6 ">
            <Link className={`text-sm font-medium transition-colors duration-200 ${pathname === "/" ? "text-primary border-b-2 border-primary pb-1" : "text-muted-foreground hover:text-primary"}`} href="/">Trang chủ</Link>
            <Link className={`text-sm font-medium transition-colors duration-200 ${pathname === "/products" || pathname?.startsWith("/products/") ? "text-primary border-b-2 border-primary pb-1" : "text-muted-foreground hover:text-primary"}`} href="/products">Sản phẩm</Link>
            {user ? (
              <Link className={`text-sm font-medium transition-colors duration-200 ${pathname === "/account/wishlist" ? "text-primary border-b-2 border-primary pb-1" : "text-muted-foreground hover:text-primary"}`} href="/account/wishlist">Yêu thích</Link>
            ) : (
              <button onClick={() => openModal('login')} className="text-sm font-medium transition-colors duration-200 text-muted-foreground hover:text-primary cursor-pointer">Yêu thích</button>
            )}
            <div className="flex items-center ">
              <ThemeToggle />
            </div>
          </nav>

          {/* 1. Khi ĐÃ đăng nhập: Thông báo nằm ở trái ngoài cùng của cụm icon */}
          {user && <NotificationDropdown userId={user.id} />}

          {/* 2. Icon Giỏ hàng — ẩn với Admin và Staff */}
          {role !== "admin" && role !== "staff" && (
            <Link
              href="/cart"
              className="relative inline-block"
            >
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "text-muted-foreground hover:text-primary relative transition-all duration-300",
                  isBumping ? "scale-125 text-primary" : "scale-100"
                )}
              >
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-[11px] font-bold flex items-center justify-center rounded-full border-2 border-background shadow-sm">
                    {cartCount}
                  </span>
                )}
              </Button>
            </Link>
          )}

          {/* 3. Phải ngoài cùng: Avatar (nếu đăng nhập) hoặc Nút Đăng nhập (nếu chưa) */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="inline-flex rounded-full border-2 border-transparent hover:border-primary/20 transition-all ml-1.5 md:ml-2 h-9 w-9 p-0 shrink-0">
                  <Avatar className="h-full w-full">
                    <AvatarImage src={profile?.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                      {user.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 p-2 rounded-xl shadow-xl border-border/50 z-[100]">
                <DropdownMenuLabel className="font-normal p-2.5 bg-muted/40 rounded-xl mb-2 flex items-center gap-3 border border-border/40">
                  <Avatar className="h-10 w-10 shrink-0 ring-2 ring-primary/20">
                    <AvatarImage src={profile?.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture} />
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-bold">
                      {user.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col space-y-0.5 overflow-hidden flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1.5">
                      <p className="text-sm font-semibold truncate text-foreground">
                        {profile?.full_name || user.email?.split('@')[0]}
                      </p>
                      {role && (
                        <span className={`inline-flex items-center px-1.5 py-0.2 rounded-md text-[10px] font-bold tracking-tight shrink-0 border ${
                          role === "admin"
                            ? " text-red-600 dark:text-red-400 border-red-300 dark:border-red-800"
                            : role === "staff"
                            ? " text-blue-600 dark:text-blue-400 border-blue-500 dark:border-blue-800"
                            : " text-emerald-600 dark:text-emerald-400 border-emerald-500 dark:border-emerald-800"
                        }`}>
                          {role === "admin" ? "Admin" : role === "staff" ? "Staff" : "Customer"}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border/50 mb-2" />

                <DropdownMenuItem asChild className="px-4 py-1.5 rounded-lg cursor-pointer transition-colors hover:bg-secondary focus:bg-secondary outline-none">
                  <Link href="/account" className="flex items-center w-full">
                    <div className="  flex items-center justify-center mr-3 shrink-0">
                      <Image src="/icons/user.png" alt="Tài khoản" width={25} height={25} className="object-contain" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">Tài khoản của tôi</span>
                      <span className="text-[10px] text-muted-foreground">Quản lý thông tin cá nhân</span>
                    </div>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild className="px-4 py-1.5 rounded-lg cursor-pointer transition-colors hover:bg-secondary focus:bg-secondary outline-none mt-1">
                  <Link href="/account/orders" className="flex items-center w-full">
                    <div className="  flex items-center justify-center mr-3 shrink-0">
                      <Image src="/icons/cart-history.png" alt="Đơn hàng" width={25} height={25} className="object-contain" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">Lịch sử mua hàng</span>
                      <span className="text-[10px] text-muted-foreground">Theo dõi đơn hàng của bạn</span>
                    </div>
                  </Link>
                </DropdownMenuItem>

                {role === "admin" && (
                  <>
                    <DropdownMenuSeparator className="bg-border/50 my-2" />
                    <DropdownMenuItem asChild className="px-4 py-1.5 rounded-lg cursor-pointer transition-colors hover:bg-primary/10 focus:bg-primary/10 outline-none">
                      <Link href="/dashboard" className="flex items-center w-full group">
                        <div className="flex items-center justify-center mr-3 shrink-0 group-hover:scale-110 transition-transform">
                          <Image src="/icons/dashboard2.png" alt="Admin" width={25} height={25} className="object-contain" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-sm text-primary">Trang Quản trị</span>
                          <span className="text-[10px] text-primary/70">Dành riêng cho Admin</span>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}

                {role === "staff" && (
                  <>
                    <DropdownMenuSeparator className="bg-border/50 my-2" />
                    <DropdownMenuItem asChild className="px-4 py-1.5 rounded-lg cursor-pointer transition-colors hover:bg-amber-500/10 focus:bg-amber-500/10 outline-none">
                      <Link href="/dashboard" className="flex items-center w-full group">
                        <div className="flex items-center justify-center mr-3 shrink-0 group-hover:scale-110 transition-transform">
                          <Image src="/icons/dashboard2.png" alt="Staff" width={25} height={25} className="object-contain" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-sm text-amber-600 dark:text-amber-400">Bảng điều hành</span>
                          <span className="text-[10px] text-amber-600/70 dark:text-amber-400/70">Khu vực dành cho Nhân viên</span>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}

                <DropdownMenuSeparator className="bg-border/50 my-2" />

                <DropdownMenuItem onClick={() => logout()} className="px-4 py-1.5 rounded-lg cursor-pointer transition-colors text-red-600 focus:text-red-700 focus:bg-red-50 dark:focus:bg-red-950/50 outline-none w-full">
                  <div className=" flex items-center justify-center mr-3 shrink-0">
                    <Image src="/icons/logout.png" alt="Đăng xuất" width={25} height={25} className="object-contain" />
                  </div>
                  <span className="font-medium text-sm">Đăng xuất</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="inline-flex md:hidden rounded-full hover:bg-primary/10 transition-all ml-1.5 h-9 w-9 p-0 shrink-0"
                onClick={() => openModal('login')}
                title="Đăng nhập"
              >
                <Image src="/icons/login.png" alt="Đăng nhập" width={40} height={40} className="object-contain" />
              </Button>
              <Button
                className="hidden md:inline-flex rounded-full ml-2 font-bold px-4 py-1.5 h-9 text-sm shadow-md shadow-primary/20 transition-all active:scale-95 shrink-0"
                onClick={() => openModal('login')}
              >
                Đăng nhập
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
