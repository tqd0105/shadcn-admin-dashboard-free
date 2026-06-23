import { Zap } from "lucide-react";
import { ProductCard } from "./product-card";
import { CountdownTimer } from "./countdown-timer";
import { getFlashSaleProducts } from "@/lib/services/product.service";

export async function FlashSale() {
  const { data: flashSaleProducts } = await getFlashSaleProducts(4);

  if (!flashSaleProducts || flashSaleProducts.length === 0) {
    return null; // Don't render Flash Sale section if there are no discounted products
  }

  return (
    <section className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 md:px-10">
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Zap className="text-red-600 fill-red-600 w-8 h-8 animate-pulse" />
              <h2 className="text-3xl font-bold tracking-tight text-foreground">Flash Sale</h2>
            </div>
            <p className="text-muted-foreground">Ưu đãi đặc biệt kết thúc vào cuối ngày:</p>
          </div>
          
          <CountdownTimer />
        </div>

        {/* Flash Sale Items Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {flashSaleProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
