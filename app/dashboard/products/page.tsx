"use client";

import { Suspense, useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  getProduct,
  deleteProduct,
} from "@/lib/services/product.service";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ProductForm } from "@/components/admin/product-form";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { Badge } from "@/components/ui/badge";
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconPackage,
  IconSearch,
  IconLoader2,
} from "@tabler/icons-react";
import { supabase } from "@/lib/supabase/client";

type Product = {
  id: string;
  name: string;
  price: number;
  image_url?: string;
  category_id?: string | null;
  categories?: { name: string } | null;
  discount_percent?: number | null;
  stock_quantity?: number | null;
  description_html?: string | null;
  brand?: string | null;
  created_at: string;
  updated_at: string;
};


function ProductsPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Search state
  const initialSearch = searchParams.get("search") || "";
  const [search, setSearch] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Pagination state
  const initialPage = parseInt(searchParams.get("page") || "1", 10);
  const [page, setPage] = useState(initialPage);
  const pageSize = 8; // 4 columns grid
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch((prev) => {
        if (prev !== search) {
          setPage(1); // Reset to page 1 on new search
        }
        return search;
      });
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Sync state to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (page > 1) params.set("page", page.toString());
    
    const newQueryString = params.toString();
    const currentQueryString = searchParams.toString();

    if (newQueryString !== currentQueryString) {
      router.replace(`${pathname}?${newQueryString}`, { scroll: false });
    }
  }, [debouncedSearch, page, pathname, router, searchParams]);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchProducts = useCallback(async () => {
    setTimeout(() => setLoading(true), 0);
    const { data, error, totalPages: fetchedTotalPages } = await getProduct(debouncedSearch, page, pageSize);
    if (error) console.error(error);
    setProducts(data ?? []);
    if (fetchedTotalPages !== undefined) {
      setTotalPages(fetchedTotalPages || 1);
    }
    setLoading(false);
  }, [debouncedSearch, page, pageSize]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProducts();
  }, [fetchProducts, refreshTrigger]);



  useEffect(() => {

    const channel = supabase
      .channel("products-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => {
        setRefreshTrigger((prev) => prev + 1);
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  // Open dialog for create
  const openCreate = () => {
    setEditingProduct(null);
    setDialogOpen(true);
  };

  // Open dialog for edit
  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setDialogOpen(true);
  };

  // Delete
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await deleteProduct(deleteTarget.id);
    if (error) alert(error.message);
    setDeleting(false);
    setDeleteTarget(null);
    fetchProducts();
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground text-sm">
            Manage your product catalog
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <IconPlus className="size-4" />
          Add Product
        </Button>
      </div>

      {/* Search & Stats */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <IconSearch className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Badge variant="secondary" className="w-fit gap-1.5 px-3 py-1.5">
          <IconPackage className="size-3.5" />
          {products.length} product{products.length !== 1 ? "s" : ""}
        </Badge>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <IconLoader2 className="text-muted-foreground size-8 animate-spin" />
        </div>
      ) : products.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="bg-muted mb-4 rounded-full p-4">
              <IconPackage className="text-muted-foreground size-8" />
            </div>
            <p className="text-muted-foreground text-lg font-medium">
              {search ? "No products match your search" : "No products yet"}
            </p>
            <p className="text-muted-foreground mt-1 text-sm">
              {search
                ? "Try a different search term"
                : "Get started by adding your first product"}
            </p>
            {!search && (
              <Button
                onClick={openCreate}
                variant="outline"
                className="mt-4 gap-2"
              >
                <IconPlus className="size-4" />
                Add Product
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <Card
              key={product.id}
              className="group relative overflow-hidden transition-shadow hover:shadow-lg"
            >
              {/* Product Image */}
              <div className="bg-muted relative aspect-square overflow-hidden">
                {product.image_url ? (
                  <Image
                    fill
                    unoptimized
                    src={product.image_url}
                    alt={product.name}
                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <IconPackage className="text-muted-foreground/40 size-16" />
                  </div>
                )}
                {/* Hover overlay with actions */}
                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 opacity-0 transition-all duration-200 group-hover:bg-black/40 group-hover:opacity-100">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-9 gap-1.5 shadow-md"
                    onClick={() => openEdit(product)}
                  >
                    <IconEdit className="size-3.5" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-9 gap-1.5 shadow-md"
                    onClick={() => setDeleteTarget(product)}
                  >
                    <IconTrash className="size-3.5" />
                  </Button>
                </div>
              </div>

              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col gap-0.5">
                    <CardTitle className="line-clamp-1 text-base truncate max-w-[120px]">
                      {product.name}
                    </CardTitle>
                    <span className="text-muted-foreground text-[11px]">
                      {formatDate(product.created_at)}
                    </span>
                  </div>
                  {product.categories && (
                    <Badge variant="outline" className="text-[10px] whitespace-nowrap">
                      {product.categories.name}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardFooter>
                <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {formatPrice(product.price)}
                </span>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {products.length > 0 && (
        <div className="flex items-center justify-between px-2 py-4">
          <div className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || totalPages === 0 || loading}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <ProductForm 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
        product={editingProduct} 
        onSuccess={fetchProducts} 
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the product
              &quot;{deleteTarget?.name}&quot; and remove all of its data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <IconLoader2 className="mr-2 size-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <IconLoader2 className="text-muted-foreground size-8 animate-spin" />
      </div>
    }>
      <ProductsPageContent />
    </Suspense>
  );
}
