import { getProduct } from "@/lib/services/product.service";
import { ProductCard } from "@/components/storefront/product-card";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export async function NewArrivals() {
  const { data: products } = await getProduct(undefined, 1, 8);

  if (!products || products.length === 0) return null;

  return (
    <section className="py-16 bg-secondary/10">
      <div className="max-w-7xl mx-auto px-4 md:px-10">
        <div className="flex justify-between items-end mb-10 border-b pb-4 border-outline-variant/30">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Sản phẩm Mới nhất</h2>
            <p className="text-muted-foreground mt-2 text-sm md:text-base">Cập nhật ngay những xu hướng và sản phẩm công nghệ mới nhất</p>
          </div>
          <Link href="/products" className="text-sm text-primary font-medium flex items-center hover:underline whitespace-nowrap mb-1">
            Xem tất cả <ArrowRight className="ml-1 w-4 h-4" />
          </Link>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
