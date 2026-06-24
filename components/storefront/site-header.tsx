"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, ShoppingCart, Heart, User, Menu, LogOut, Package, HomeIcon, BoxIcon, UserIcon, LogOutIcon, Shield } from "lucide-react";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { supabase } from "@/lib/supabase/client";
import { getProduct } from "@/lib/services/product.service";

export function SiteHeader() {
  const { openModal } = useAuthModal();
  const { user, profile, role, logout } = useAuth();
  const [cartCount, setCartCount] = useState(0);
  const [isBumping, setIsBumping] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const pathname = usePathname();
  const initialLoadDone = useRef(false);

  // Search Suggestions State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

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
    if (cartCount > 0 && initialLoadDone.current) {
      setIsBumping(true);
      const timer = setTimeout(() => setIsBumping(false), 300);
      return () => clearTimeout(timer);
    }
  }, [cartCount]);

  useEffect(() => {
    if (!user) {
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
      {isMobileSearchOpen ? (
        <div className="flex items-center gap-2 px-4 h-20 max-w-7xl mx-auto z-50">
          <form action="/products" method="GET" className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input
              name="search"
              autoFocus
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              className="w-full bg-secondary/50 py-2.5 pl-10 pr-4 rounded-full border-transparent focus:ring-2 focus:ring-primary text-sm transition-shadow outline-none"
              placeholder="Tìm kiếm..."
              type="text"
              required
              autoComplete="off"
            />
            {/* Mobile Suggestions Dropdown */}
            {showSuggestions && searchQuery.trim().length > 0 && (
              <div className="absolute top-full mt-2 w-full bg-background border rounded-xl shadow-lg overflow-hidden z-[100]">
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
                          onClick={() => {
                            setShowSuggestions(false);
                            setIsMobileSearchOpen(false);
                          }}
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
                      <Link href={`/products?search=${searchQuery}`} onClick={() => {
                        setShowSuggestions(false);
                        setIsMobileSearchOpen(false);
                      }} className="text-sm font-medium text-primary text-center block hover:underline">
                        Xem tất cả kết quả
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 text-center text-sm text-muted-foreground">Không tìm thấy sản phẩm nào</div>
                )}
              </div>
            )}
          </form>
          <Button variant="ghost" onClick={() => {
            setIsMobileSearchOpen(false);
            setShowSuggestions(false);
          }}>
            Hủy
          </Button>
        </div>
      ) : (
        <div className="flex justify-between items-center w-full px-4 md:px-10 max-w-7xl mx-auto h-20 z-50">
          {/* Brand */}
        <Link href="/" className="text-xl font-bold tracking-tight flex-shrink-0 text-primary">
          LuxeCommerce
        </Link>

        {/* Search (Center, Desktop) */}
        <div ref={searchRef} className="hidden md:flex flex-1 max-w-2xl mx-10 relative">
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

        {/* Navigation Links (Desktop) */}
        <nav className="hidden lg:flex items-center gap-6 ml-auto mr-10">
          <Link className={`text-sm font-medium transition-colors duration-200 ${pathname === "/" ? "text-primary border-b-2 border-primary pb-1" : "text-muted-foreground hover:text-primary"}`} href="/">Trang chủ</Link>
          <Link className={`text-sm font-medium transition-colors duration-200 ${pathname === "/products" || pathname?.startsWith("/products/") ? "text-primary border-b-2 border-primary pb-1" : "text-muted-foreground hover:text-primary"}`} href="/products">Sản phẩm</Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMobileSearchOpen(true)}>
            <Search className="w-5 h-5" />
          </Button>
          <Link
            href={user ? "/account/wishlist" : "#"}
            className="hidden sm:inline-flex relative"
            onClick={(e) => {
              if (!user) {
                e.preventDefault();
                openModal('login');
              }
            }}
          >
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
              <Heart className="w-5 h-5" />
            </Button>
          </Link>
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
            <SheetContent side="right" className="w-[300px] sm:w-[300px] z-[100]">
              <SheetHeader>
                <SheetTitle className="text-left font-bold text-primary text-xl">LuxeCommerce</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-4 px-4 py-8">
                <SheetClose asChild>
                  <Link className={`text-base font-medium transition-colors flex items-center ${pathname === "/" ? "text-primary" : "hover:text-primary"}`} href="/">
                    <HomeIcon  className="w-5 h-5 mr-2" />
                    <span>Trang chủ</span>
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link className={`text-base font-medium transition-colors flex items-center ${pathname === "/products" || pathname?.startsWith("/products/") ? "text-primary" : "hover:text-primary"}`} href="/products">
                    <BoxIcon className="w-5 h-5 mr-2" />
                    <span>Sản phẩm</span>
                  </Link>
                </SheetClose>
                <hr className="my-2 border-outline-variant" />
                {user ? (
                  <>
                    <SheetClose asChild>
                      <Link className="text-base font-medium hover:text-primary transition-colors flex items-center" href="/account">
                        <UserIcon className="w-5 h-5 mr-2" />
                        <span>Tài khoản của tôi</span>
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link className="text-base font-medium hover:text-primary transition-colors flex items-center" href="/account/orders">
                        <Package className="w-5 h-5 mr-2" />
                        <span>Lịch sử Mua hàng</span>
                      </Link>
                    </SheetClose>
                    {role === "admin" && (
                      <SheetClose asChild>
                        <Link className="text-base font-medium text-primary flex items-center" href="/dashboard">
                          <Shield className="w-5 h-5 mr-2" />
                          <span>Quản trị (Admin)</span>
                        </Link>
                      </SheetClose>
                    )}
                    <SheetClose asChild>
                      <button onClick={() => logout()} className="text-base font-medium text-red-600 flex items-center mt-2 w-full text-left">
                        <LogOutIcon className="w-5 h-5 mr-2" />
                        <span>Đăng xuất</span>
                      </button>
                    </SheetClose>
                  </>
                ) : (
                  <SheetClose asChild>
                    <Button onClick={() => openModal('login')} className="w-full mt-4">
                      Đăng nhập / Đăng ký
                    </Button>
                  </SheetClose>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
        </div>
      )}
    </header>
  );
}
