import { Zap } from "lucide-react";
import { ProductCard, ProductMock } from "./product-card";

const mockProducts: ProductMock[] = [
  {
    id: "1",
    name: "Tai nghe không dây chống ồn chủ động LuxeAudio Pro",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1000&auto=format&fit=crop",
    price: 6990000,
    originalPrice: 9990000,
    discountPercent: 30,
    sold: 45,
    totalStock: 60
  },
  {
    id: "2",
    name: "Đồng hồ thông minh LuxeWatch Series 9 Mạ vàng",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1000&auto=format&fit=crop",
    price: 12500000,
    originalPrice: 15000000,
    discountPercent: 15,
    sold: 120,
    totalStock: 150
  },
  {
    id: "3",
    name: "Loa Bluetooth LuxeSound Home Cinema 360",
    image: "https://images.unsplash.com/photo-1545454675-3531b543be5d?q=80&w=1000&auto=format&fit=crop",
    price: 4500000,
    originalPrice: 8000000,
    discountPercent: 43,
    sold: 210,
    totalStock: 250
  },
  {
    id: "4",
    name: "Bàn phím cơ LuxeType Nhôm nguyên khối Switch tĩnh",
    image: "https://images.unsplash.com/photo-1595225476474-87563907a212?q=80&w=1000&auto=format&fit=crop",
    price: 3200000,
    originalPrice: 4000000,
    discountPercent: 20,
    sold: 85,
    totalStock: 100
  }
];

export function FlashSale() {
  return (
    <section className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 md:px-10">
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Zap className="text-red-600 fill-red-600 w-8 h-8 animate-pulse" />
              <h2 className="text-3xl font-bold tracking-tight text-foreground">Flash Sale</h2>
            </div>
            <p className="text-muted-foreground">Ưu đãi đặc biệt kết thúc sau:</p>
          </div>
          
          {/* Countdown */}
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 bg-red-100 text-red-700 rounded-lg flex items-center justify-center text-2xl font-bold shadow-sm mb-1">05</div>
              <span className="text-xs font-semibold text-muted-foreground">Giờ</span>
            </div>
            <div className="text-2xl font-bold text-muted-foreground mt-2">:</div>
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 bg-red-100 text-red-700 rounded-lg flex items-center justify-center text-2xl font-bold shadow-sm mb-1">42</div>
              <span className="text-xs font-semibold text-muted-foreground">Phút</span>
            </div>
            <div className="text-2xl font-bold text-muted-foreground mt-2">:</div>
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 bg-red-100 text-red-700 rounded-lg flex items-center justify-center text-2xl font-bold shadow-sm mb-1">18</div>
              <span className="text-xs font-semibold text-muted-foreground">Giây</span>
            </div>
          </div>
        </div>

        {/* Flash Sale Items Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {mockProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
