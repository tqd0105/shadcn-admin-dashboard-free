"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import RoleGuard from "@/components/guards/role-guard";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/lib/services/category.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconLoader2,
  IconTags,
  IconSearch,
} from "@tabler/icons-react";
import { supabase } from "@/lib/supabase/client";

type Category = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

function CategoriesPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Search state
  const initialSearch = searchParams.get("search") || "";
  const [search, setSearch] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Pagination state
  const initialPage = parseInt(searchParams.get("page") || "1", 10);
  const [page, setPage] = useState(initialPage);
  const pageSize = 10;
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
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    const { data, error, totalPages: fetchedTotalPages } = await getCategories(debouncedSearch, page, pageSize);
    if (error) console.error(error);
    setCategories(data ?? []);
    if (fetchedTotalPages !== undefined) {
      setTotalPages(fetchedTotalPages || 1);
    }
    setLoading(false);
  }, [debouncedSearch, page, pageSize]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories, refreshTrigger]);

  useEffect(() => {
    const channel = supabase
      .channel("categories-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "categories" },
        () => {
          setRefreshTrigger((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  // Open dialog for create
  const openCreate = () => {
    setEditingCategory(null);
    setName("");
    setErrorMsg("");
    setDialogOpen(true);
  };

  // Open dialog for edit
  const openEdit = (category: Category) => {
    setEditingCategory(category);
    setName(category.name);
    setErrorMsg("");
    setDialogOpen(true);
  };

  // Submit create/update
  const handleSubmit = async () => {
    if (!name.trim()) {
      setErrorMsg("Name is required");
      return;
    }
    
    setSaving(true);
    setErrorMsg("");

    try {
      const payload = {
        name: name.trim(),
      };

      if (editingCategory) {
        const { error } = await updateCategory(editingCategory.id, payload);
        if (error) {
          if (error.code === '23505') {
            setErrorMsg("Category name already exists");
          } else {
            setErrorMsg(error.message);
          }
          return;
        }
      } else {
        const { error } = await createCategory(payload);
        if (error) {
          if (error.code === '23505') {
            setErrorMsg("Category name already exists");
          } else {
            setErrorMsg(error.message);
          }
          return;
        }
      }

      setDialogOpen(false);
      fetchCategories();
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await deleteCategory(deleteTarget.id);
    if (error) alert(error.message);
    setDeleting(false);
    setDeleteTarget(null);
    fetchCategories();
  };

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
          <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted-foreground text-sm">
            Manage your product categories
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <IconPlus className="size-4" />
          Add Category
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center">
        <div className="relative max-w-sm flex-1">
          <IconSearch className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
          <Input
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Categories Table */}
      <div className="rounded-md border bg-card text-card-foreground shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3} className="h-32 text-center">
                  <div className="flex items-center justify-center">
                    <IconLoader2 className="text-muted-foreground size-8 animate-spin" />
                  </div>
                </TableCell>
              </TableRow>
            ) : categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <IconTags className="mb-2 size-8" />
                    <p>No categories yet</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell>{formatDate(category.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEdit(category)}
                      >
                        <IconEdit className="size-4 text-muted-foreground hover:text-foreground" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeleteTarget(category)}
                      >
                        <IconTrash className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        
        {/* Pagination Controls */}
        <div className="flex items-center justify-between px-4 py-4 border-t">
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
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Edit Category" : "New Category"}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? "Update the category details below."
                : "Enter the name of the new category."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="category-name">Category Name</Label>
              <Input
                id="category-name"
                placeholder="e.g. Electronics"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errorMsg) setErrorMsg("");
                }}
              />
              {errorMsg && (
                <p className="text-sm text-destructive mt-1">{errorMsg}</p>
              )}
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
              disabled={saving || !name.trim()}
              className="gap-2"
            >
              {saving && <IconLoader2 className="size-4 animate-spin" />}
              {saving
                ? "Saving..."
                : editingCategory
                  ? "Save Changes"
                  : "Create Category"}
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
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
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

export default function CategoriesPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <IconLoader2 className="text-muted-foreground size-8 animate-spin" />
      </div>
    }>
      <RoleGuard allowedRoles={["admin"]}>
        <CategoriesPageContent />
      </RoleGuard>
    </Suspense>
  );
}
