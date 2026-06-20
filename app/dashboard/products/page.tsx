"use client";

import { Suspense, useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} from "@/lib/services/product.service";
import { getCategories } from "@/lib/services/category.service";
import { uploadProductImage } from "@/lib/services/storage.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Badge } from "@/components/ui/badge";
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconPackage,
  IconSearch,
  IconLoader2,
  IconUpload,
  IconPhoto,
  IconX,
} from "@tabler/icons-react";
import { supabase } from "@/lib/supabase/client";

type Product = {
  id: string;
  name: string;
  price: number;
  image_url?: string;
  category_id?: string | null;
  categories?: { name: string } | null;
  created_at: string;
  updated_at: string;
};

type FormState = {
  name: string;
  price: string;
  category_id: string;
  imageFile: File | null;
  imagePreview: string;
};

const emptyForm: FormState = {
  name: "",
  price: "",
  category_id: "",
  imageFile: null,
  imagePreview: "",
};

function ProductsPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
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
    
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [debouncedSearch, page, pathname, router]);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const { data, error, totalPages: fetchedTotalPages } = await getProduct(debouncedSearch, page, pageSize);
    if (error) console.error(error);
    setProducts(data ?? []);
    if (fetchedTotalPages !== undefined) {
      setTotalPages(fetchedTotalPages || 1);
    }
    setLoading(false);
  }, [debouncedSearch, page, pageSize]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts, refreshTrigger]);

  useEffect(() => {
    const loadCategories = async () => {
      const { data } = await getCategories("", 1, 100);
      if (data) setCategories(data);
    };
    loadCategories();

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

  // File selection handler
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be less than 5MB");
      return;
    }

    const preview = URL.createObjectURL(file);
    setForm((f) => ({ ...f, imageFile: file, imagePreview: preview }));
  };

  const clearImage = () => {
    setForm((f) => ({ ...f, imageFile: null, imagePreview: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Open dialog for create
  const openCreate = () => {
    setEditingProduct(null);
    setForm(emptyForm);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setDialogOpen(true);
  };

  // Open dialog for edit
  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      price: String(product.price),
      category_id: product.category_id ?? "",
      imageFile: null,
      imagePreview: product.image_url ?? "",
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
    setDialogOpen(true);
  };

  // Submit create/update
  const handleSubmit = async () => {
    if (!form.name.trim() || !form.price) return;
    setSaving(true);

    try {
      // Upload image if a new file is selected
      let imageUrl = editingProduct?.image_url;
      if (form.imageFile) {
        imageUrl = await uploadProductImage(form.imageFile);
      }

      const payload = {
        name: form.name.trim(),
        price: parseFloat(form.price),
        image_url: imageUrl,
        category_id: form.category_id || null,
      };

      if (editingProduct) {
        const { error } = await updateProduct(editingProduct.id, payload);
        if (error) {
          alert(error.message);
          return;
        }
      } else {
        const { error } = await createProduct(payload);
        if (error) {
          alert(error.message);
          return;
        }
      }

      setDialogOpen(false);
      fetchProducts();
    } catch (err: any) {
      alert(err.message || "An error occurred");
    } finally {
      setSaving(false);
    }
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
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
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

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Edit Product" : "New Product"}
            </DialogTitle>
            <DialogDescription>
              {editingProduct
                ? "Update the product details below."
                : "Fill in the details to add a new product."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Product Name */}
            <div className="space-y-2">
              <Label htmlFor="product-name">Product Name</Label>
              <Input
                id="product-name"
                placeholder="e.g. Wireless Headphones"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </div>

            {/* Price */}
            <div className="space-y-2">
              <Label htmlFor="product-price">Price (VND)</Label>
              <Input
                id="product-price"
                type="number"
                min="0"
                step="1000"
                placeholder="0"
                value={form.price}
                onChange={(e) =>
                  setForm((f) => ({ ...f, price: e.target.value }))
                }
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="product-category">Category</Label>
              <Select
                value={form.category_id}
                onValueChange={(value) => setForm((f) => ({ ...f, category_id: value }))}
              >
                <SelectTrigger id="product-category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Product Image</Label>

              {/* Preview */}
              {form.imagePreview ? (
                <div className="relative overflow-hidden rounded-lg border">
                  <img
                    src={form.imagePreview}
                    alt="Preview"
                    className="h-48 w-full object-cover"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    className="absolute right-2 top-2 size-8 rounded-full p-0 shadow-lg"
                    onClick={clearImage}
                  >
                    <IconX className="size-4" />
                  </Button>
                  {/* Show "Change image" hint */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all hover:bg-black/30 hover:opacity-100"
                  >
                    <span className="rounded-md bg-white/90 px-3 py-1.5 text-sm font-medium text-gray-900 shadow">
                      Change image
                    </span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50 flex w-full flex-col items-center gap-3 rounded-lg border-2 border-dashed py-8 transition-colors"
                >
                  <div className="bg-muted rounded-full p-3">
                    <IconUpload className="text-muted-foreground size-6" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">
                      Click to upload image
                    </p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      PNG, JPG, WebP up to 5MB
                    </p>
                  </div>
                </button>
              )}

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={saving || !form.name.trim() || !form.price}
              className="gap-2"
            >
              {saving && <IconLoader2 className="size-4 animate-spin" />}
              {saving
                ? "Uploading..."
                : editingProduct
                  ? "Save Changes"
                  : "Create Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold">&ldquo;{deleteTarget?.name}&rdquo;</span>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2"
            >
              {deleting && <IconLoader2 className="size-4 animate-spin" />}
              Delete
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
