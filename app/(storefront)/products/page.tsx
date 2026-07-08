import { getProduct, getDistinctBrands } from "@/lib/services/product.service";
import { getAllCategories } from "@/lib/services/category.service";
import { ProductCard } from "@/components/storefront/product-card";
import { ProductsFilter } from "@/components/storefront/products-filter";
import { ProductsSort } from "@/components/storefront/products-sort";
import { ProductsPagination } from "@/components/storefront/products-pagination";

export const metadata = {
  title: "Products | LuxeCommerce",
  description: "Browse our latest products and collections.",
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;

  const page = typeof resolvedSearchParams.page === "string" ? parseInt(resolvedSearchParams.page) : 1;

  // Handle array of categories/brands
  const categoryIds = typeof resolvedSearchParams.categories === "string"
    ? [resolvedSearchParams.categories]
    : (resolvedSearchParams.categories as string[] || []);

  const brands = typeof resolvedSearchParams.brands === "string"
    ? [resolvedSearchParams.brands]
    : (resolvedSearchParams.brands as string[] || []);

  const minPrice = typeof resolvedSearchParams.minPrice === "string" ? parseInt(resolvedSearchParams.minPrice) : undefined;
  const maxPrice = typeof resolvedSearchParams.maxPrice === "string" ? parseInt(resolvedSearchParams.maxPrice) : undefined;
  const sort = typeof resolvedSearchParams.sort === "string" ? resolvedSearchParams.sort : undefined;
  const searchQuery = typeof resolvedSearchParams.search === "string" ? resolvedSearchParams.search : undefined;

  // Fetch Filters Options
  const [{ data: categoriesData }, { data: brandsData }] = await Promise.all([
    getAllCategories(),
    getDistinctBrands(),
  ]);

  const categories = categoriesData || [];
  const availableBrands = brandsData || [];

  // Fetch Products
  const { data: products, totalPages, total } = await getProduct(
    searchQuery,
    page,
    12, // pageSize
    {
      category_ids: categoryIds,
      brands: brands,
      minPrice,
      maxPrice,
      sort,
    }
  );

  return (
    <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

      {/* Sidebar / Filters (Client Component) */}
      <ProductsFilter categories={categories} brands={availableBrands} />

      {/* Main Content Area */}
      <div className="col-span-1 lg:col-span-9 flex flex-col gap-6">

        <div className="flex flex-col gap-2">
          {searchQuery ? (
            <h1 className="text-3xl font-bold text-foreground">Kết quả tìm kiếm: &quot;{searchQuery}&quot;</h1>
          ) : (
            <h1 className="text-3xl font-bold text-foreground lg:hidden">Tất cả sản phẩm</h1>
          )}
          <p className="text-muted-foreground text-sm">
            Hiển thị {products?.length || 0} trên tổng số {total} sản phẩm
          </p>
        </div>

        {/* Sorting Bar (Client Component) */}
        <ProductsSort categories={categories} />

        {/* Product Grid */}
        {products && products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center flex flex-col items-center justify-center border rounded-xl border-dashed">
            <h3 className="text-xl font-bold mb-2">No products found</h3>
            <p className="text-muted-foreground">Try adjusting your filters to find what you&apos;re looking for.</p>
          </div>
        )}

        {/* Pagination (Client Component) */}
        <ProductsPagination currentPage={page} totalPages={totalPages} />
      </div>
    </main>
  );
}
