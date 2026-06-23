import { getAllCategories } from "@/lib/services/category.service";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export async function CategoriesSection() {
  const { data: categories } = await getAllCategories();

  if (!categories || categories.length === 0) return null;

  return (
    <section className="py-16 bg-background">
      <div className="max-w-7xl mx-auto px-4 md:px-10">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Khám phá theo Danh mục</h2>
          <Link href="/products" className="text-sm text-primary font-medium flex items-center hover:underline">
            Xem tất cả <ArrowRight className="ml-1 w-4 h-4" />
          </Link>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {categories.slice(0, 6).map((category) => (
            <Link 
              key={category.id} 
              href={`/products?categories=${category.id}`}
              className="group flex flex-col items-center justify-center p-6 bg-secondary/30 rounded-2xl hover:bg-primary/5 transition-all duration-300 border border-transparent hover:border-primary/20 hover:shadow-sm"
            >
              <div className="w-14 h-14 rounded-full bg-background shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Sparkles className="w-6 h-6 text-primary/70 group-hover:text-primary transition-colors" />
              </div>
              <h3 className="font-semibold text-center text-sm md:text-base group-hover:text-primary transition-colors line-clamp-1">{category.name}</h3>
              {category.description && (
                <p className="text-xs text-muted-foreground text-center mt-1 line-clamp-1 hidden sm:block">{category.description}</p>
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
