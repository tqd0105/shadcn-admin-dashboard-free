import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export interface ProductCardData {
  id: string;
  name: string;
  image_url?: string;
  price: number;
  discount_percent?: number | null;
  stock_quantity?: number | null;
  sold?: number; // Not in DB yet, make it optional
  brand?: string | null;
  categories?: { name: string } | null;
}

interface ProductCardProps {
  product: ProductCardData;
}

export function ProductCard({ product }: ProductCardProps) {
  const stock = product.stock_quantity || 0;
  const sold = product.sold || 0;
  const totalOriginalStock = stock + sold; // Assuming stock_quantity is current available stock
  const progress = totalOriginalStock > 0 ? Math.min(100, Math.round((sold / totalOriginalStock) * 100)) : 0;

  const hasDiscount = (product.discount_percent ?? 0) > 0;
  const originalPrice = product.price;
  const salePrice = hasDiscount
    ? Math.round(originalPrice * (1 - (product.discount_percent as number) / 100))
    : originalPrice;

  return (
    <div className="group border rounded-xl overflow-hidden bg-card transition-all duration-300 hover:shadow-lg relative flex flex-col h-full">
      {hasDiscount && (
        <Badge className="absolute top-5 left-4 z-10 bg-red-600 hover:bg-red-700 pointer-events-none">
          -{product.discount_percent}%
        </Badge>
      )}
      <Link href={`/product/${product.id}`} className="relative aspect-square overflow-hidden bg-secondary mb-4 w-full block hover-scale-img cursor-pointer">
        <img
          alt={product.name}
          className="w-full h-full object-cover"
          src={product.image_url || "/placeholder-image.jpg"}
        />
      </Link>
      <div className="p-4 flex flex-col flex-grow">
        <Link href={`/product/${product.id}`} className="flex justify-between items-center mb-2">
          <div className="flex flex-col">
            <h3 className="font-semibold text-xl text-foreground line-clamp-1 max-w-[180px] hover:text-primary transition-colors cursor-pointer">
              {product.name}
            </h3>
            {product.brand && (
              <span className="text-blue-600 font-bold text-xs uppercase tracking-wider ">
                {product.brand}
              </span>
            )}
          </div>
          <div className="flex flex-col items-end">

            <div className="mt-auto">
              <div className="flex justify-between text-xs font-semibold text-muted-foreground ">
                <span>{sold > 0 ? `Đã bán ${sold}` : ''}</span>
                <span>Còn {stock}</span>
              </div>
              {sold > 0 && (
                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                  <div className="bg-red-600 h-full rounded-full" style={{ width: `${progress}%` }}></div>
                </div>
              )}
            </div>

          </div>
        </Link>
        <div className="flex justify-between items-center flex-wrap gap-x-3 gap-y-1 mb-2">
          <div className="flex items-end gap-2">
            <span className="font-bold text-red-600 text-lg leading-none">
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(salePrice)}
            </span>
            {hasDiscount && (
              <span className="text-muted-foreground line-through text-sm leading-none mb-[2px]">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(originalPrice)}
              </span>
            )}
          </div>


        </div>
      </div>
    </div>
  );
}
