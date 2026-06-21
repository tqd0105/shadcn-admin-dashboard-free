import { notFound } from "next/navigation";
import { getProductById, getRelatedProducts } from "@/lib/services/product.service";
import { ProductGallery } from "@/components/storefront/product-gallery";
import { ProductTabs } from "@/components/storefront/product-tabs";
import { ProductCard } from "@/components/storefront/product-card";

export default async function ProductDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const productId = resolvedParams.id;

  const { data: product, error } = await getProductById(productId);

  if (error || !product) {
    return notFound();
  }

  // Related products
  const { data: relatedProducts } = await getRelatedProducts(product.category_id, product.id, 4);

  // Format images
  const images = product.product_images?.length 
    ? product.product_images.sort((a: any, b: any) => a.display_order - b.display_order)
    : [{ id: product.id, image_url: product.image_url }];

  // Compute stock
  const hasDiscount = (product.discount_percent ?? 0) > 0;
  const originalPrice = hasDiscount
    ? Math.round(product.price / (1 - (product.discount_percent as number) / 100))
    : null;

  return (
    <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16">
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left: Gallery */}
        <ProductGallery images={images} productName={product.name} />

        {/* Right: Product Info */}
        <div className="flex flex-col space-y-6">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              {product.brand && (
                <span className="px-2 py-1 bg-secondary text-secondary-foreground font-label-sm text-label-sm rounded uppercase tracking-wider">
                  {product.brand}
                </span>
              )}
              <span className="flex items-center text-muted-foreground font-label-sm text-label-sm">
                {product.product_reviews?.length ? (
                  <>
                    <span className="material-symbols-outlined text-[16px] mr-1 text-yellow-500" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    {(product.product_reviews.reduce((acc: number, curr: any) => acc + curr.rating, 0) / product.product_reviews.length).toFixed(1)} ({product.product_reviews.length} Đánh giá)
                  </>
                ) : (
                  <span>Chưa có đánh giá</span>
                )}
              </span>
            </div>
            <h1 className="text-3xl font-bold text-foreground">{product.name}</h1>
          </div>

          <div className="flex items-baseline space-x-4">
            <span className="text-3xl font-bold text-red-600">
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}
            </span>
            {hasDiscount && (
              <span className="text-lg text-muted-foreground line-through">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(originalPrice as number)}
              </span>
            )}
          </div>

          {product.description && (
            <p className="text-muted-foreground">
              {product.description}
            </p>
          )}

          {/* Variants (Mocked or DB) */}
          {product.product_variants && product.product_variants.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-outline-variant/50">
              <div>
                <h3 className="text-sm font-semibold mb-2">Tùy chọn:</h3>
                <div className="flex flex-wrap gap-2">
                  {product.product_variants.map((variant: any) => (
                    <button key={variant.id} className="px-4 py-2 border rounded-md hover:border-primary transition-colors">
                      {variant.name} {variant.price_modifier ? `(+${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(variant.price_modifier)})` : ''}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 pt-6">
            <button className="flex-1 flex justify-center items-center h-12 bg-primary text-primary-foreground font-semibold rounded-md shadow-sm hover:bg-primary/90 transition-all">
              <span className="material-symbols-outlined mr-2">shopping_bag</span>
              Thêm vào giỏ hàng
            </button>
            <button className="flex-1 flex justify-center items-center h-12 bg-background border border-primary text-primary font-semibold rounded-md hover:bg-muted transition-colors">
              Mua ngay
            </button>
          </div>

          <div className="flex flex-col gap-2 pt-4 text-sm text-muted-foreground">
            <div className="flex items-center"><span className="material-symbols-outlined text-[18px] mr-2">local_shipping</span> Giao hàng miễn phí toàn quốc</div>
            <div className="flex items-center"><span className="material-symbols-outlined text-[18px] mr-2">assignment_return</span> Đổi trả 30 ngày dễ dàng</div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <ProductTabs 
        description={product.description_html || product.description || ""} 
        specs={product.product_specs || []} 
        reviews={product.product_reviews || []} 
      />

      {/* Related Products */}
      {relatedProducts && relatedProducts.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl font-bold text-foreground mb-6">Sản phẩm liên quan</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p as any} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
