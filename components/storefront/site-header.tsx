"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, ShoppingCart, Heart, Bell, User, Menu, LogOut, Package, HomeIcon, BoxIcon, UserIcon, LogOutIcon, Shield } from "lucide-react";
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
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/lib/supabase/client";
import { getProduct } from "@/lib/services/product.service";
import Image from "next/image";

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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShowSuggestions(false);
  }, [pathname]);

  useEffect(() => {
    if (cartCount > 0 && initialLoadDone.current) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsBumping(true);
      const timer = setTimeout(() => setIsBumping(false), 300);
      return () => clearTimeout(timer);
    }
  }, [cartCount]);

  useEffect(() => {
    if (!user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCartCount(0);
      return;
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
              <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                <nav className="flex flex-col gap-4 mt-8">
                  <Link href="/" className="text-lg font-medium">Trang chủ</Link>
                  <Link href="/products" className="text-lg font-medium">Sản phẩm</Link>
                  <Link href="/account/wishlist" className="text-lg font-medium">Yêu thích</Link>
                  <div className="h-px bg-border my-4"></div>
                  {!user && (
                    <Button onClick={() => openModal('login')} className="w-full">
                      Đăng nhập / Đăng ký
                    </Button>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
          <Link href="/" className="text-xl font-bold tracking-tight flex-shrink-0 text-primary flex items-center gap-2">
            LuxeCommerce
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
                        <img src={product.image_url || "https://placehold.co/40x40"} alt={product.name} className="w-10 h-10 object-cover rounded-md border" />
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
          <nav className="hidden lg:flex items-center gap-6 mr-4">
            <Link className={`text-sm font-medium transition-colors duration-200 ${pathname === "/" ? "text-primary border-b-2 border-primary pb-1" : "text-muted-foreground hover:text-primary"}`} href="/">Trang chủ</Link>
            <Link className={`text-sm font-medium transition-colors duration-200 ${pathname === "/products" || pathname?.startsWith("/products/") ? "text-primary border-b-2 border-primary pb-1" : "text-muted-foreground hover:text-primary"}`} href="/products">Sản phẩm</Link>
            <Link className={`text-sm font-medium transition-colors duration-200 ${pathname === "/account/wishlist" ? "text-primary border-b-2 border-primary pb-1" : "text-muted-foreground hover:text-primary"}`} href="/account/wishlist">Yêu thích</Link>
          </nav>
          
          <ThemeToggle />
          <NotificationDropdown userId={user?.id} />
          <Link 
            href={user ? "/cart" : "#"} 
            className="relative"
            onClick={(e) => {
              if (!user) {
                e.preventDefault();
                openModal('login');
              }
            }}
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
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-[11px] font-bold flex items-center justify-center rounded-full border-2 border-background shadow-sm">
                {cartCount}
              </span>
            </Button>
          </Link>
          
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="hidden md:inline-flex rounded-full border-2 border-transparent hover:border-primary/20 transition-all ml-2 h-9 w-9 p-0">
                  <Avatar className="h-full w-full">
                    <AvatarImage src={user.user_metadata?.avatar_url} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                      {user.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 p-2 rounded-xl shadow-xl border-border/50 z-[100]">
                <DropdownMenuLabel className="font-normal p-2 bg-muted/50 rounded-lg mb-2 flex justify-center items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.user_metadata?.avatar_url} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                      {user.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col space-y-0.5 overflow-hidden">
                    <p className="text-sm font-semibold truncate text-foreground">{profile?.full_name || user.email?.split('@')[0]}</p>
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
                        <div className="  flex items-center justify-center mr-3 shrink-0 group-hover:scale-110 transition-transform">
                          <Image src="/icons/shield.png" alt="Admin" width={25} height={25} className="object-contain" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-sm text-primary">Trang Quản trị </span>
                          <span className="text-[10px] text-primary/70">Dành riêng cho Admin</span>
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
            <Button 
              className="hidden md:inline-flex rounded-full ml-2"
              onClick={() => openModal('login')}
            >
              Đăng nhập
            </Button>
          )}

        </div>
      </div>
    </header>
  );
}
