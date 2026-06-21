"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { IconX, IconChevronDown } from "@tabler/icons-react";

interface Category {
  id: string;
  name: string;
}

interface ProductsSortProps {
  categories: Category[];
}

export function ProductsSort({ categories }: ProductsSortProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentCategories = searchParams.getAll("categories");
  const currentBrands = searchParams.getAll("brands");
  const currentSort = searchParams.get("sort") || "";

  const createQueryString = useCallback(
    (name: string, value: string, action: "add" | "remove" | "set") => {
      const params = new URLSearchParams(searchParams.toString());

      if (action === "set") {
        if (value) {
          params.set(name, value);
        } else {
          params.delete(name);
        }
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

  const removeCategory = (id: string) => {
    router.push(pathname + "?" + createQueryString("categories", id, "remove"));
  };

  const removeBrand = (brand: string) => {
    router.push(pathname + "?" + createQueryString("brands", brand, "remove"));
  };

  const clearAll = () => {
    // Only keep sort and page if needed, but usually clear all means clear all filters.
    // Let's clear categories, brands, minPrice, maxPrice
    const params = new URLSearchParams(searchParams.toString());
    params.delete("categories");
    params.delete("brands");
    params.delete("minPrice");
    params.delete("maxPrice");
    params.delete("page");
    router.push(pathname + "?" + params.toString());
  };

  const hasFilters = currentCategories.length > 0 || currentBrands.length > 0;

  return (
    <div className="flex justify-between items-center bg-card border rounded-lg p-3 shadow-sm">
      <div className="hidden sm:flex flex-wrap gap-2 items-center">
        {currentCategories.map((catId) => {
          const catName = categories.find((c) => c.id === catId)?.name || catId;
          return (
            <span
              key={`cat-${catId}`}
              className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1"
            >
              {catName}
              <button
                onClick={() => removeCategory(catId)}
                className="hover:text-primary/70 focus:outline-none"
              >
                <IconX className="h-3 w-3" />
              </button>
            </span>
          );
        })}
        {currentBrands.map((brand) => (
          <span
            key={`brand-${brand}`}
            className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1"
          >
            {brand}
            <button
              onClick={() => removeBrand(brand)}
              className="hover:text-primary/70 focus:outline-none"
            >
              <IconX className="h-3 w-3" />
            </button>
          </span>
        ))}
        {hasFilters && (
          <button
            onClick={clearAll}
            className="text-muted-foreground hover:text-primary text-xs underline ml-2"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="flex items-center gap-3 ml-auto">
        <label htmlFor="sort" className="text-sm font-medium text-muted-foreground hidden sm:block">
          Sort by:
        </label>
        <div className="relative">
          <select
            id="sort"
            value={currentSort}
            onChange={(e) =>
              router.push(pathname + "?" + createQueryString("sort", e.target.value, "set"))
            }
            className="appearance-none bg-background border text-foreground text-sm rounded-md pl-4 pr-10 py-2 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer min-w-[160px]"
          >
            <option value="">Newest Arrivals</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground">
            <IconChevronDown className="h-4 w-4" />
          </div>
        </div>
      </div>
    </div>
  );
}
