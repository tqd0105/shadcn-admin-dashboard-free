"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

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

  // Calculate final price based on discount and selected variant
  const hasDiscount = (discountPercent ?? 0) > 0;
  const originalPrice = hasDiscount
    ? Math.round(basePrice / (1 - (discountPercent as number) / 100))
    : basePrice;

  const currentPriceModifier = selectedVariant ? selectedVariant.price_modifier : 0;
  
  const finalPrice = basePrice + currentPriceModifier;
  const finalOriginalPrice = originalPrice + currentPriceModifier;

  const handleAddToCart = () => {
    alert("Chức năng giỏ hàng sẽ được cập nhật sau!");
  };

  const handleBuyNow = () => {
    alert("Chức năng thanh toán sẽ được cập nhật sau!");
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
      <div className="flex flex-col sm:flex-row gap-4 pt-6">
        <button 
          onClick={handleAddToCart}
          disabled={selectedVariant?.stock_quantity === 0}
          className="flex-1 flex justify-center items-center h-12 bg-primary text-primary-foreground font-semibold rounded-md shadow-sm hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined mr-2">shopping_bag</span>
          Thêm vào giỏ hàng
        </button>
        <button 
          onClick={handleBuyNow}
          disabled={selectedVariant?.stock_quantity === 0}
          className="flex-1 flex justify-center items-center h-12 bg-background border border-primary text-primary font-semibold rounded-md hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Mua ngay
        </button>
      </div>

      {/* Badges */}
      <div className="flex flex-col gap-2 pt-4 text-sm text-muted-foreground">
        <div className="flex items-center"><span className="material-symbols-outlined text-[18px] mr-2">local_shipping</span> Giao hàng miễn phí toàn quốc</div>
        <div className="flex items-center"><span className="material-symbols-outlined text-[18px] mr-2">assignment_return</span> Đổi trả 30 ngày dễ dàng</div>
      </div>
    </div>
  );
}
