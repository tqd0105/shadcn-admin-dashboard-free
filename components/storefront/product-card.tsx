import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export interface ProductMock {
  id: string;
  name: string;
  image: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  sold: number;
  totalStock: number;
}

interface ProductCardProps {
  product: ProductMock;
}

export function ProductCard({ product }: ProductCardProps) {
  const progress = Math.min(100, Math.round((product.sold / product.totalStock) * 100));

  return (
    <div className="group border rounded-xl overflow-hidden bg-card transition-all duration-300 hover:shadow-lg relative flex flex-col h-full">
      {product.discountPercent && (
        <Badge className="absolute top-4 left-4 z-10 bg-red-600 hover:bg-red-700 pointer-events-none">
          -{product.discountPercent}%
        </Badge>
      )}
      <Link href={`/product/${product.id}`} className="relative aspect-square overflow-hidden bg-secondary mb-4 w-full block hover-scale-img cursor-pointer">
        <img
          alt={product.name}
          className="w-full h-full object-cover"
          src={product.image}
        />
      </Link>
      <div className="p-4 flex flex-col flex-grow">
        <Link href={`/product/${product.id}`}>
          <h3 className="font-semibold text-sm text-foreground mb-2 line-clamp-2 hover:text-primary transition-colors cursor-pointer">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center gap-2 mb-4">
          <span className="font-bold text-red-600 text-lg">
            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}
          </span>
          {product.originalPrice && (
            <span className="text-muted-foreground line-through text-sm">
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.originalPrice)}
            </span>
          )}
        </div>
        <div className="mt-auto">
          <div className="flex justify-between text-xs font-semibold text-muted-foreground mb-2">
            <span>Đã bán {product.sold}</span>
            <span>Còn {product.totalStock - product.sold}</span>
          </div>
          <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
            <div className="bg-red-600 h-full rounded-full" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
