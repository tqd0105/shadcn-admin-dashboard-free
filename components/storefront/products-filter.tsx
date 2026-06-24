"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useState, useEffect } from "react";
import { IconChevronUp, IconFilter } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface Category {
  id: string;
  name: string;
}

interface ProductsFilterProps {
  categories: Category[];
  brands: string[];
}

export function ProductsFilter({ categories, brands }: ProductsFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Local state for instant UI update
  const [minPriceInput, setMinPriceInput] = useState<string>("");
  const [maxPriceInput, setMaxPriceInput] = useState<string>("");

  // Read current filters from URL
  const currentCategories = searchParams.getAll("categories");
  const currentBrands = searchParams.getAll("brands");
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMinPriceInput(minPrice);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMaxPriceInput(maxPrice);
  }, [minPrice, maxPrice]);

  const createQueryString = useCallback(
    (name: string, value: string, action: "add" | "remove" | "set") => {
      const params = new URLSearchParams(searchParams.toString());
      
      // Reset page to 1 when filter changes
      params.delete("page");

      if (action === "set") {
        if (value) {
          params.set(name, value);
        } else {
          params.delete(name);
        }
      } else if (action === "add") {
        params.append(name, value);
      } else if (action === "remove") {
        const values = params.getAll(name);
        params.delete(name);
        values.forEach((v) => {
          if (v !== value) params.append(name, v);
        });
      }
      return params.toString();
    },
    [searchParams]
  );

  const toggleCategory = (id: string) => {
    const action = currentCategories.includes(id) ? "remove" : "add";
    router.push(pathname + "?" + createQueryString("categories", id, action));
  };

  const toggleBrand = (brand: string) => {
    const action = currentBrands.includes(brand) ? "remove" : "add";
    router.push(pathname + "?" + createQueryString("brands", brand, action));
  };

  const applyPriceInputs = () => {
    let qs = new URLSearchParams(searchParams.toString());
    qs.delete("page");
    
    if (minPriceInput) qs.set("minPrice", minPriceInput);
    else qs.delete("minPrice");

    if (maxPriceInput) qs.set("maxPrice", maxPriceInput);
    else qs.delete("maxPrice");

    router.push(pathname + "?" + qs.toString());
  };

  return (
    <>
      {/* Mobile Filter Toggle */}
      <div className="lg:hidden w-full flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold text-foreground">Products</h1>
        <Button
          variant="outline"
          className="flex items-center gap-2"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
        >
          <IconFilter className="h-5 w-5" />
          Filters
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          "lg:block lg:col-span-3 space-y-10 h-fit",
          isMobileOpen ? "block" : "hidden"
        )}
      >
        <div className="hidden lg:block mb-4">
          <h1 className="text-4xl font-bold text-foreground mb-2">Products</h1>
          <p className="text-muted-foreground">Browse our catalog</p>
        </div>

        <div className="space-y-6 lg:border-t lg:pt-6">
          {/* Categories */}
          {categories.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider mb-4 flex justify-between items-center">
                Categories
              </h3>
              <ul className="space-y-3 text-muted-foreground">
                {categories.map((category) => (
                  <li key={category.id}>
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={currentCategories.includes(category.id)}
                        onChange={() => toggleCategory(category.id)}
                        className="form-checkbox h-4 w-4 text-primary border-input rounded focus:ring-primary focus:ring-offset-background"
                      />
                      <span className="group-hover:text-primary transition-colors">
                        {category.name}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="border-t my-6"></div>

          {/* Brands */}
          {brands.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider mb-4 flex justify-between items-center">
                Brands
              </h3>
              <ul className="space-y-3 text-muted-foreground">
                {brands.map((brand) => (
                  <li key={brand}>
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={currentBrands.includes(brand)}
                        onChange={() => toggleBrand(brand)}
                        className="form-checkbox h-4 w-4 text-primary border-input rounded focus:ring-primary focus:ring-offset-background"
                      />
                      <span className="group-hover:text-primary transition-colors">
                        {brand}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="border-t my-6"></div>

          {/* Price Range */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4 flex justify-between items-center">
              Price Range
            </h3>
            <div className="space-y-6 px-1">
              <div className="px-2">
                <Slider
                  min={0}
                  max={100000000}
                  step={500000}
                  value={[Number(minPriceInput || 0), Number(maxPriceInput || 100000000)]}
                  onValueChange={(vals) => {
                    setMinPriceInput(vals[0] > 0 ? vals[0].toString() : "");
                    setMaxPriceInput(vals[1] < 100000000 ? vals[1].toString() : "");
                  }}
                  className="w-full"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="100000000"
                  placeholder="Min (₫)"
                  value={minPriceInput}
                  onChange={(e) => setMinPriceInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && applyPriceInputs()}
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                />
                <span className="text-muted-foreground">-</span>
                <input
                  type="number"
                  min="0"
                  max="100000000"
                  placeholder="Max (₫)"
                  value={maxPriceInput}
                  onChange={(e) => setMaxPriceInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && applyPriceInputs()}
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                />
              </div>
              <Button onClick={applyPriceInputs} className="w-full" size="sm" variant="secondary">
                Áp dụng
              </Button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
