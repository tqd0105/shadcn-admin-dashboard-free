"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { addToCart } from "@/lib/services/cart.service";
import { checkWishlisted, removeFromWishlistByProduct } from "@/lib/services/wishlist.service";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { useAuthModal } from "@/lib/store/use-auth-modal";
import { toast } from "sonner";
import { WishlistModal } from "./wishlist-modal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Variant {
  id: string;
  name: string;
  sku: string;
  price_modifier: number;
  stock_quantity: number;
}

interface ProductActionsProps {
  productId: string;
  basePrice: number;
  discountPercent?: number;
  variants: Variant[];
}

export function ProductActions({ productId, basePrice, discountPercent, variants }: ProductActionsProps) {
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(
    variants && variants.length > 0 ? variants[0] : null
  );

  const router = useRouter();
  const [isAdding, setIsAdding] = useState(false);
  
  const { user } = useAuth();
  const { openModal } = useAuthModal();
  const [showLoginAlert, setShowLoginAlert] = useState(false);

  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isTogglingHeart, setIsTogglingHeart] = useState(false);
  const [showWishlistModal, setShowWishlistModal] = useState(false);

  useEffect(() => {
    if (user) {
      checkWishlisted(productId).then((isListed) => {
        setIsWishlisted(!!isListed);
      });
    }
  }, [user, productId]);

  const handleToggleWishlist = async () => {
    if (!user) {
      setShowLoginAlert(true);
      return;
    }
    
    if (isWishlisted) {
      // Bỏ yêu thích trực tiếp
      setIsTogglingHeart(true);
      const { error } = await removeFromWishlistByProduct(productId);
      setIsTogglingHeart(false);
      if (!error) {
        setIsWishlisted(false);
        toast.success("Đã bỏ yêu thích");
      }
    } else {
      // Thêm mới -> bật popup
      setShowWishlistModal(true);
    }
  };

  // Calculate final price based on discount and selected variant
  const hasDiscount = (discountPercent ?? 0) > 0;
  const originalBasePrice = basePrice;
  const saleBasePrice = hasDiscount
    ? Math.round(originalBasePrice * (1 - (discountPercent as number) / 100))
    : originalBasePrice;

  const currentPriceModifier = selectedVariant ? selectedVariant.price_modifier : 0;
  
  const finalPrice = saleBasePrice + currentPriceModifier; // Red text (Sale Price)
  const finalOriginalPrice = originalBasePrice + currentPriceModifier; // Strikethrough (Original Price)

  const handleAddToCart = async () => {
    if (!user) {
      setShowLoginAlert(true);
      return;
    }
    
    setIsAdding(true);
    const { error } = await addToCart(productId, 1, selectedVariant?.id);
    setIsAdding(false);

    if (error) {
      toast.error(error.message || "Có lỗi xảy ra khi thêm vào giỏ hàng!");
    } else {
      toast.success("Đã thêm vào giỏ hàng thành công!");
      window.dispatchEvent(new Event("cart-updated"));
    }
  };

  const handleBuyNow = async () => {
    if (!user) {
      setShowLoginAlert(true);
      return;
    }

    setIsAdding(true);
    const { error } = await addToCart(productId, 1, selectedVariant?.id);
    setIsAdding(false);

    if (error) {
      toast.error(error.message || "Có lỗi xảy ra!");
    } else {
      window.dispatchEvent(new Event("cart-updated"));
      router.push("/cart");
    }
  };

  return (
    <div className="space-y-6">
      {/* Price Display */}
      <div className="flex items-baseline space-x-4">
        <span className="text-3xl font-bold text-red-600">
          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(finalPrice)}
        </span>
        {hasDiscount && (
          <span className="text-lg text-muted-foreground line-through">
            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(finalOriginalPrice)}
          </span>
        )}
      </div>

      {/* Variants Selection */}
      {variants && variants.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-outline-variant/50">
          <div>
            <h3 className="text-sm font-semibold mb-2">Tùy chọn:</h3>
            <div className="flex flex-wrap gap-2">
              {variants.map((variant) => (
                <button 
                  key={variant.id} 
                  onClick={() => setSelectedVariant(variant)}
                  className={cn(
                    "px-4 py-2 border rounded-md transition-colors",
                    selectedVariant?.id === variant.id 
                      ? "border-primary bg-primary/5 text-primary font-medium" 
                      : "border-outline-variant hover:border-primary/50 text-on-surface-variant"
                  )}
                >
                  {variant.name}
                  {variant.price_modifier > 0 && (
                    <span className="text-xs ml-1 opacity-70">
                      (+{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(variant.price_modifier)})
                    </span>
                  )}
                  {variant.price_modifier < 0 && (
                    <span className="text-xs ml-1 opacity-70">
                      ({new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(variant.price_modifier)})
                    </span>
                  )}
                </button>
              ))}
            </div>
            {selectedVariant && (
              <p className="text-xs text-muted-foreground mt-2">
                Kho: {selectedVariant.stock_quantity > 0 ? `${selectedVariant.stock_quantity} sản phẩm` : <span className="text-red-500 font-medium">Hết hàng</span>}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-3 pt-6">
        <button 
          onClick={handleAddToCart}
          disabled={selectedVariant?.stock_quantity === 0 || isAdding}
          className="flex-1 min-w-[210px] flex justify-center items-center h-12 px-5 py-3 bg-primary text-primary-foreground font-semibold text-sm sm:text-base rounded-xl shadow-sm hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shrink-0"
        >
          <span className="material-symbols-outlined text-[20px] mr-2 shrink-0">shopping_bag</span>
          <span>{isAdding ? "Đang xử lý..." : "Thêm vào giỏ hàng"}</span>
        </button>
        <button 
          onClick={handleBuyNow}
          disabled={selectedVariant?.stock_quantity === 0 || isAdding}
          className="flex-1 min-w-[130px] flex justify-center items-center h-12 px-5 py-3 bg-background border border-primary text-primary font-semibold text-sm sm:text-base rounded-xl hover:bg-primary/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shrink-0"
        >
          <span>{isAdding ? "Đang xử lý..." : "Mua ngay"}</span>
        </button>
        <button 
          onClick={handleToggleWishlist}
          disabled={isTogglingHeart}
          className="flex justify-center items-center h-12 w-12 bg-background border border-outline-variant text-muted-foreground rounded-xl hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors shrink-0"
        >
          <Heart className={cn("w-5 h-5 transition-colors shrink-0", isWishlisted && "fill-red-500 text-red-500")} />
        </button>
      </div>

      {/* Badges */}
      <div className="flex flex-col gap-2 pt-4 text-sm text-muted-foreground">
        <div className="flex items-center"><span className="material-symbols-outlined text-[18px] mr-2">local_shipping</span> Giao hàng miễn phí toàn quốc</div>
        <div className="flex items-center"><span className="material-symbols-outlined text-[18px] mr-2">assignment_return</span> Đổi trả 30 ngày dễ dàng</div>
      </div>

      {/* Login Alert Modal */}
      <AlertDialog open={showLoginAlert} onOpenChange={setShowLoginAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Yêu cầu đăng nhập</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn cần phải đăng nhập để thêm sản phẩm vào giỏ hàng hoặc thực hiện mua hàng.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Đóng lại</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              setShowLoginAlert(false);
              openModal("login");
            }}>
              Đăng nhập ngay
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {showWishlistModal && (
        <WishlistModal 
          isOpen={showWishlistModal} 
          onClose={() => setShowWishlistModal(false)} 
          productId={productId} 
          onSuccess={() => setIsWishlisted(true)} 
        />
      )}
    </div>
  );
}
