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
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 transition-all duration-300 shadow-lg">
      <div className="flex flex-wrap md:flex-nowrap justify-between items-center w-full px-4 md:px-8 max-w-[1440px] mx-auto py-3 md:py-0 md:h-[80px] z-50 gap-y-3 md:gap-y-0">
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
              <SheetContent side="left" className="w-[310px] sm:w-[360px] p-0 flex flex-col h-full bg-background/60 backdrop-blur-2xl overflow-hidden border-r border-border/50 shadow-2xl">
                <SheetTitle className="sr-only">Menu Điều Hướng</SheetTitle>
                {/* 1. Header Khu Vực Tài Khoản */}
                <div className="p-6 pb-5 bg-card/40 border-b border-border/50 relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50" />
                  <div className="relative z-10">
                  {user ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-14 w-14 border-2 border-primary/20 shadow-md ring-4 ring-primary/5">
                          <AvatarImage src={profile?.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture} className="object-cover" />
                          <AvatarFallback className="bg-gradient-to-br from-primary to-primary/50 text-primary-foreground font-bold text-lg">
                            {user.email?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-[17px] truncate text-foreground">
                            {profile?.full_name || user.user_metadata?.full_name || "Khách hàng"}
                          </h4>
                          <p className="text-[13px] text-muted-foreground truncate">{user.email}</p>
                          <div className="mt-1.5 flex items-center gap-1.5">
                            {role && (
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide shadow-sm ${role === "admin"
                                  ? "bg-red-500/10 text-red-600 dark:text-red-400"
                                  : role === "staff"
                                    ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                    : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                }`}>
                                {role === "admin" ? "Admin" : role === "staff" ? "Staff" : "Thành viên"}
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
                            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-[14px] bg-gradient-to-r from-red-600 to-amber-600 text-white font-bold text-[14.5px] shadow-md shadow-red-500/20 hover:opacity-90 hover:scale-[1.02] transition-all duration-300"
                          >
                            <Image src="/icons/dashboard3.png" alt="Logo" width={22} height={22} className="object-contain" /> Bảng Quản Trị (Admin)
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
                          "flex items-center gap-3 px-3.5 py-3 rounded-[14px] font-bold text-[14.5px] transition-all duration-200",
                          pathname === "/" ? "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20" : "text-foreground/70 hover:bg-muted/50 hover:text-foreground"
                        )}
                      >
                        <Image src="/icons/home_black.png" alt="Home" width={22} height={22} className="dark:hidden" />
                        <Image src="/icons/home_white.png" alt="Home" width={22} height={22} className="hidden dark:block" />
                        Trang chủ
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link
                        href="/products"
                        className={cn(
                          "flex items-center gap-3 px-3.5 py-3 rounded-[14px] font-bold text-[14.5px] transition-all duration-200",
                          pathname?.startsWith("/products") ? "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20" : "text-foreground/70 hover:bg-muted/50 hover:text-foreground"
                        )}
                      >
                        <Image src="/icons/product_black.png" alt="Products" width={22} height={22} className="dark:hidden" />
                        <Image src="/icons/product_white.png" alt="Products" width={22} height={22} className="hidden dark:block" />
                        Tất cả sản phẩm
                      </Link>
                    </SheetClose>
                    {/* Cart link — ẩn với Admin và Staff */}
                    {/* {role !== "admin" && role !== "staff" && (
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
                    )} */}
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
                    <div className="space-y-1 pt-2 border-t border-border/40">
                      <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 mb-2 mt-2">
                        Tài khoản của tôi
                      </p>
                      <SheetClose asChild>
                        <Link
                          href="/cart"
                          className="flex items-center justify-between px-3.5 py-3 rounded-[14px] font-bold text-[14.5px] text-foreground/70 hover:bg-muted/50 hover:text-foreground transition-all duration-200"
                        >
                          <span className="flex items-center gap-3">
                            <ShoppingCart className="w-5 h-5 text-blue-500" /> Giỏ hàng
                          </span>
                          {cartCount > 0 && (
                            <span className="bg-red-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                              {cartCount}
                            </span>
                          )}
                        </Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link
                          href="/account/orders"
                          className="flex items-center gap-3 px-3.5 py-3 rounded-[14px] font-bold text-[14.5px] text-foreground/70 hover:bg-muted/50 hover:text-foreground transition-all duration-200"
                        >
                          <BoxIcon className="w-5 h-5 text-amber-500" /> Lịch sử đơn hàng
                        </Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link
                          href="/account/addresses"
                          className="flex items-center gap-3 px-3.5 py-3 rounded-[14px] font-bold text-[14.5px] text-foreground/70 hover:bg-muted/50 hover:text-foreground transition-all duration-200"
                        >
                          <MapPin className="w-5 h-5 text-emerald-500" /> Sổ địa chỉ nhận hàng
                        </Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link
                          href="/account/settings"
                          className="flex items-center gap-3 px-3.5 py-3 rounded-[14px] font-bold text-[14.5px] text-foreground/70 hover:bg-muted/50 hover:text-foreground transition-all duration-200"
                        >
                          <Settings className="w-5 h-5 text-gray-500" /> Cài đặt tài khoản
                        </Link>
                      </SheetClose>
                    </div>
                  )}

                  {/* Staff: shortcut vào Staff Dashboard */}
                  {user && role === "staff" && (
                    <div className="space-y-1 pt-2 border-t border-border/40">
                      <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 mb-2 mt-2">
                        Khu vực nội bộ
                      </p>
                      <SheetClose asChild>
                        <Link
                          href="/dashboard"
                          className="flex items-center gap-3 px-3.5 py-3 rounded-[14px] font-bold text-[14.5px] bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 shadow-sm transition-all duration-200"
                        >
                          <Image src="/icons/dashboard5.png" alt="Logo" width={22} height={22} />
                          Bảng điều hành (Staff)
                        </Link>
                      </SheetClose>
                    </div>
                  )}
                </div>

                {/* 3. Chân Drawer */}
                <div className="p-4 border-t border-border/50 bg-card/40 space-y-3 mt-auto">
                  <div className="flex items-center justify-between px-3 py-2">
                    <span className="text-[13.5px] font-bold text-foreground/80">Giao diện (Sáng/Tối)</span>
                    <ThemeToggle />
                  </div>
                  {user && (
                    <SheetClose asChild>
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-500/10 dark:hover:bg-red-900/30 font-bold text-[14px] h-12 px-4 rounded-[14px] transition-all duration-200"
                        onClick={logout}
                      >
                        <LogOut className="w-5 h-5 mr-3" /> Đăng xuất tài khoản
                      </Button>
                    </SheetClose>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
          <Link href="/" className="group text-xl md:text-2xl font-black tracking-tighter flex-shrink-0 flex items-center gap-2.5 transition-all duration-300">
            <div className="relative">
              <div className="absolute -inset-1 rounded-full  group-hover:opacity-80 transition duration-800 animate-pulse" />
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
        <div ref={searchRef} className="flex w-full md:w-auto order-3 md:order-2 md:flex-1 md:max-w-[480px] lg:max-w-xl md:mx-8 relative group">
          <form action="/products" method="GET" className="w-full relative flex items-center">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 transition-colors group-focus-within:text-primary" />
            <input
              name="search"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              className="w-full bg-muted/50 hover:bg-muted/80 focus:bg-background py-2.5 pl-11 pr-4 rounded-full border border-transparent focus:border-primary/30 focus:ring-4 focus:ring-primary/10 text-sm font-medium transition-all outline-none shadow-sm placeholder:text-muted-foreground/70"
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
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 order-2 md:order-3">
          {/* Navigation Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-1 mr-3 bg-muted/40 p-1 rounded-full border border-border/40">
            <Link className={cn("flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-bold transition-all duration-300 group hover:-translate-y-[1px] hover:shadow-sm active:scale-95 active:translate-y-0", pathname === "/" ? "bg-background shadow-[0_2px_10px_rgba(0,0,0,0.05)] text-primary ring-1 ring-border/30" : "text-muted-foreground hover:text-foreground hover:bg-background/60")} href="/">
              <Image src="/icons/home_black.png" alt="Home" width={18} height={18} className="dark:hidden opacity-90 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3" />
              <Image src="/icons/home_white.png" alt="Home" width={18} height={18} className="hidden dark:block opacity-90 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3" />
              Trang chủ
            </Link>
            <Link className={cn("flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-bold transition-all duration-300 group hover:-translate-y-[1px] hover:shadow-sm active:scale-95 active:translate-y-0", pathname === "/products" || pathname?.startsWith("/products/") ? "bg-background shadow-[0_2px_10px_rgba(0,0,0,0.05)] text-primary ring-1 ring-border/30" : "text-muted-foreground hover:text-foreground hover:bg-background/60")} href="/products">
              <Image src="/icons/product_black.png" alt="Products" width={18} height={18} className="dark:hidden opacity-90 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3" />
              <Image src="/icons/product_white.png" alt="Products" width={18} height={18} className="hidden dark:block opacity-90 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3" />
              Sản phẩm
            </Link>
          </nav>

          <div className="flex items-center gap-1 md:gap-1.5 lg:border-l-2 lg:border-border/100 lg:pl-4 h-4">
            <div className="mr-1 hidden md:block">
              <ThemeToggle />
            </div>

            {/* Yêu thích (Icon) */}
            <div className="hidden md:block">
              {user ? (
                <Link href="/account/wishlist" className="relative inline-block">
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-all duration-300 rounded-full h-9 w-9">
                    <Image src="/icons/love3.png" alt="Wishlist" width={20} height={20} />
                  </Button>
                </Link>
              ) : (
                <Button variant="ghost" size="icon" onClick={() => openModal('login')} className="text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-all duration-300 rounded-full h-9 w-9">
                  <Image src="/icons/love3.png" alt="Wishlist" width={20} height={20} />
                </Button>
              )}
            </div>

            {/* 1. Thông báo (Tạm ẩn theo yêu cầu của User) */}
            {/* {user && <NotificationDropdown userId={user.id} />} */}

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
                    "text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full h-9 w-9 relative transition-all duration-300",
                    isBumping ? "scale-125 text-primary" : "scale-100"
                  )}
                >
                  <ShoppingCart className="w-5 h-5" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-[18px] h-[18px] bg-red-600 text-primary-foreground dark:text-white text-[10px] font-bold flex items-center justify-center rounded-full shadow-sm ring-2 ring-background">
                      {cartCount}
                    </span>
                  )}
                </Button>
              </Link>
            )}
          </div>

          {/* 3. Phải ngoài cùng: Avatar (nếu đăng nhập) hoặc Nút Đăng nhập (nếu chưa) */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="inline-flex rounded-full border-2 border-transparent hover:border-primary/30 transition-all ml-1.5 md:ml-2 h-10 w-10 p-0 shrink-0 shadow-sm hover:shadow-md">
                  <Avatar className="h-full w-full">
                    <AvatarImage src={profile?.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture} className="object-cover" />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-primary/50 text-primary-foreground font-bold text-xs">
                      {user.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 p-2.5 rounded-[24px] shadow-2xl border border-border/50 bg-card/80 backdrop-blur-xl z-[100]">
                <DropdownMenuLabel className="font-normal p-3 bg-gradient-to-br from-primary/5 to-transparent rounded-[16px] mb-2 flex items-center gap-3 border border-primary/10 shadow-inner">
                  <Avatar className="h-11 w-11 shrink-0 ring-2 ring-primary/20 shadow-sm">
                    <AvatarImage src={profile?.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture} className="object-cover" />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-primary/50 text-primary-foreground font-bold">
                      {user.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col space-y-0.5 overflow-hidden flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1.5">
                      <p className="text-[14.5px] font-bold truncate text-foreground">
                        {profile?.full_name || user.email?.split('@')[0]}
                      </p>
                      {role && (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide shrink-0 shadow-sm ${role === "admin"
                            ? "bg-red-500/10 text-red-600 dark:text-red-400"
                            : role === "staff"
                              ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          }`}>
                          {role === "admin" ? "Admin" : role === "staff" ? "Staff" : "Customer"}
                        </span>
                      )}
                    </div>
                    <p className="text-[12px] text-muted-foreground truncate font-medium">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border/40 mb-2" />

                <DropdownMenuItem asChild className="px-4 py-2.5 rounded-[14px] cursor-pointer transition-all duration-200 hover:bg-primary/10 hover:shadow-sm focus:bg-primary/10 outline-none">
                  <Link href="/account" className="flex items-center w-full group">
                    <div className="flex items-center justify-center mr-3 shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-transform">
                      <Image src="/icons/user.png" alt="Tài khoản" width={22} height={22} className="object-contain" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-[13.5px] group-hover:text-primary transition-colors">Tài khoản của tôi</span>
                      <span className="text-[11px] text-muted-foreground font-medium mt-0.5">Quản lý thông tin cá nhân</span>
                    </div>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild className="px-4 py-2.5 rounded-[14px] cursor-pointer transition-all duration-200 hover:bg-primary/10 hover:shadow-sm focus:bg-primary/10 outline-none mt-1">
                  <Link href="/account/orders" className="flex items-center w-full group">
                    <div className="flex items-center justify-center mr-3 shrink-0 group-hover:scale-110 group-hover:-rotate-3 transition-transform">
                      <Image src="/icons/cart-history.png" alt="Đơn hàng" width={22} height={22} className="object-contain" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-[13.5px] group-hover:text-primary transition-colors">Lịch sử mua hàng</span>
                      <span className="text-[11px] text-muted-foreground font-medium mt-0.5">Theo dõi đơn hàng của bạn</span>
                    </div>
                  </Link>
                </DropdownMenuItem>

                {role === "admin" && (
                  <>
                    <DropdownMenuSeparator className="bg-border/40 my-2" />
                    <DropdownMenuItem asChild className="px-4 py-2.5 rounded-[14px] cursor-pointer transition-all duration-200 hover:bg-blue-500/10 hover:shadow-sm focus:bg-blue-500/10 outline-none">
                      <Link href="/dashboard" className="flex items-center w-full group">
                        <div className="flex items-center justify-center mr-3 shrink-0 group-hover:scale-110 transition-transform">
                          <Image src="/icons/dashboard2.png" alt="Admin" width={22} height={22} className="object-contain" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-[13.5px] text-blue-600 dark:text-blue-400">Trang Quản trị</span>
                          <span className="text-[11px] text-blue-600/70 dark:text-blue-400/70 font-medium mt-0.5">Dành riêng cho Admin</span>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}

                {role === "staff" && (
                  <>
                    <DropdownMenuSeparator className="bg-border/40 my-2" />
                    <DropdownMenuItem asChild className="px-4 py-2.5 rounded-[14px] cursor-pointer transition-all duration-200 hover:bg-amber-500/10 hover:shadow-sm focus:bg-amber-500/10 outline-none">
                      <Link href="/dashboard" className="flex items-center w-full group">
                        <div className="flex items-center justify-center mr-3 shrink-0 group-hover:scale-110 transition-transform">
                          <Image src="/icons/dashboard2.png" alt="Staff" width={22} height={22} className="object-contain" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-[13.5px] text-amber-600 dark:text-amber-400">Bảng điều hành</span>
                          <span className="text-[11px] text-amber-600/70 dark:text-amber-400/70 font-medium mt-0.5">Khu vực dành cho Nhân viên</span>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}

                <DropdownMenuSeparator className="bg-border/40 my-2" />

                <DropdownMenuItem onClick={() => logout()} className="px-4 py-2.5 rounded-[14px] cursor-pointer transition-all duration-200 text-red-600 focus:text-red-700 hover:bg-red-500/10 hover:shadow-sm focus:bg-red-500/10 dark:hover:bg-red-900/30 outline-none w-full group">
                  <div className="flex items-center justify-center mr-3 shrink-0 group-hover:scale-110 transition-transform">
                    <Image src="/icons/logout.png" alt="Đăng xuất" width={22} height={22} className="object-contain" />
                  </div>
                  <span className="font-bold text-[13.5px]">Đăng xuất</span>
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
