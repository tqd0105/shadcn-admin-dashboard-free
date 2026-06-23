"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import RoleGuard from "@/components/guards/role-guard";
import {
  PromoBanner,
  getPromoBannersAdmin,
  createPromoBanner,
  updatePromoBanner,
  deletePromoBanner,
} from "@/lib/services/banner.service";
import { uploadImage } from "@/lib/services/storage.service";
import { getCategories, createCategory } from "@/lib/services/category.service";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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
  IconImage,
  IconSearch,
  IconChevronDown,
  IconCheck,
} from "@tabler/icons-react";
import { Switch } from "@/components/ui/switch";
import { Image } from "lucide-react";

function PromoBannersPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [banners, setBanners] = useState<PromoBanner[]>([]);
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

  const fetchBanners = async () => {
    setLoading(true);
    const [bannersData, categoriesData] = await Promise.all([
      getPromoBannersAdmin(debouncedSearch, page, pageSize),
      getCategories("", 1, 100)
    ]);
    
    if (bannersData.data) {
      setBanners(bannersData.data);
      setTotalPages(bannersData.totalPages || 1);
    }
    
    if (categoriesData.data) {
      setCategories(categoriesData.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBanners();
  }, [debouncedSearch, page, refreshTrigger]);

  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [selectedBanner, setSelectedBanner] = useState<PromoBanner | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    description: "",
    image_url: "",
    link_url: "",
    badge_text: "",
    badge_color: "primary",
    order_index: 0,
    is_active: true,
  });
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [linkType, setLinkType] = useState<"category" | "custom">("custom");

  // Category Combobox state
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [catSearch, setCatSearch] = useState("");
  const [debouncedCatSearch, setDebouncedCatSearch] = useState("");
  const [isSearchingCat, setIsSearchingCat] = useState(false);
  
  // Quick Create Category state
  const [quickCreateDialogOpen, setQuickCreateDialogOpen] = useState(false);
  const [quickCreateName, setQuickCreateName] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);

  // Debounce category search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedCatSearch(catSearch);
    }, 500);
    return () => clearTimeout(timer);
  }, [catSearch]);

  // Fetch categories when combobox is open or search changes
  useEffect(() => {
    const fetchCats = async () => {
      setIsSearchingCat(true);
      const { data } = await getCategories(debouncedCatSearch, 1, 100);
      if (data) setCategories(data);
      setIsSearchingCat(false);
    };
    if (comboboxOpen) {
      fetchCats();
    }
  }, [debouncedCatSearch, comboboxOpen]);

  // Delete Alert States
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [bannerToDelete, setBannerToDelete] = useState<string | null>(null);

  const handleOpenCreate = () => {
    setDialogMode("create");
    setSelectedBanner(null);
    setFormData({
      title: "",
      subtitle: "",
      description: "",
      image_url: "",
      link_url: "",
      badge_text: "",
      badge_color: "primary",
      order_index: 0,
      is_active: true,
    });
    setFormError("");
    setLinkType("custom");
    setCatSearch("");
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (banner: PromoBanner) => {
    setDialogMode("edit");
    setSelectedBanner(banner);
    
    // Determine link type based on existing link_url
    let currentLinkType: "category" | "custom" = "custom";
    if (banner.link_url && banner.link_url.startsWith("/products?categories=")) {
      currentLinkType = "category";
    }
    
    setLinkType(currentLinkType);
    setFormData({
      title: banner.title,
      subtitle: banner.subtitle || "",
      description: banner.description || "",
      image_url: banner.image_url,
      link_url: banner.link_url || "",
      badge_text: banner.badge_text || "",
      badge_color: banner.badge_color || "primary",
      order_index: banner.order_index,
      is_active: banner.is_active ?? true,
    });
    setFormError("");
    setIsDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setFormError("");
    
    const { url, error } = await uploadImage(file, "banners");
    
    if (error) {
      setFormError("Lỗi khi tải ảnh lên: " + (error.message || "Unknown error"));
    } else if (url) {
      setFormData(prev => ({ ...prev, image_url: url }));
    }
    
    setIsUploading(false);
  };

  const handleToggleActive = async (banner: PromoBanner, checked: boolean) => {
    const { error } = await updatePromoBanner(banner.id, { is_active: checked });
    if (!error) {
      setBanners(banners.map(b => b.id === banner.id ? { ...b, is_active: checked } : b));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    
    if (!formData.title.trim()) {
      setFormError("Vui lòng nhập tiêu đề");
      return;
    }
    if (!formData.image_url.trim()) {
      setFormError("Vui lòng nhập đường dẫn hình ảnh");
      return;
    }

    setIsSubmitting(true);

    if (dialogMode === "create") {
      const { error } = await createPromoBanner(formData);
      if (error) {
        setFormError(error.message || "Lỗi khi tạo banner");
      } else {
        setIsDialogOpen(false);
        setRefreshTrigger((prev) => prev + 1);
      }
    } else if (dialogMode === "edit" && selectedBanner) {
      const { error } = await updatePromoBanner(selectedBanner.id, formData);
      if (error) {
        setFormError(error.message || "Lỗi khi cập nhật banner");
      } else {
        setIsDialogOpen(false);
        setRefreshTrigger((prev) => prev + 1);
      }
    }
    
    setIsSubmitting(false);
  };

  const confirmDelete = async () => {
    if (!bannerToDelete) return;
    setIsSubmitting(true);
    const { error } = await deletePromoBanner(bannerToDelete);
    setIsSubmitting(false);
    
    if (!error) {
      setIsDeleteDialogOpen(false);
      setBannerToDelete(null);
      // Fetch data again
      if (banners.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        setRefreshTrigger(prev => prev + 1);
      }
    } else {
      console.error("Delete failed:", error);
      alert("Xóa thất bại!");
    }
  };

  const handleQuickCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCreateName.trim()) return;

    setCreatingCategory(true);
    const { data, error } = await createCategory({
      name: quickCreateName.trim(),
    });
    setCreatingCategory(false);

    if (error) {
      alert("Lỗi khi tạo danh mục: " + error.message);
    } else if (data) {
      // Add to local state
      setCategories((prev) => [data, ...prev]);
      // Select it
      setFormData((prev) => ({ ...prev, link_url: `/products?categories=${data.id}` }));
      setComboboxOpen(false);
      setQuickCreateDialogOpen(false);
      setQuickCreateName("");
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý Promo Banner</h1>
          <p className="text-muted-foreground mt-1">
            Tạo và quản lý các banner hiển thị ngoài trang chủ.
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="flex items-center">
          <IconPlus className="w-4 h-4 mr-2" />
          Thêm Banner
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl border shadow-sm">
        <div className="relative w-full md:w-96">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Tìm kiếm banner..."
            className="pl-9 w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-card rounded-xl border shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="w-24">Hình ảnh</TableHead>
                <TableHead>Tiêu đề</TableHead>
                <TableHead>Link đích</TableHead>
                <TableHead className="w-24 text-center">Thứ tự</TableHead>
                <TableHead className="w-24 text-center">Hiển thị</TableHead>
                <TableHead className="w-[120px] text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <IconLoader2 className="w-8 h-8 animate-spin mb-2" />
                      <p>Đang tải dữ liệu...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : banners.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <Image className="w-12 h-12 mb-4 opacity-20" />
                      <p>Không tìm thấy banner nào.</p>
                      {debouncedSearch && (
                        <Button 
                          variant="link" 
                          onClick={() => setSearch("")}
                          className="mt-2"
                        >
                          Xóa tìm kiếm
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                banners.map((banner) => (
                  <TableRow key={banner.id} className="group">
                    <TableCell>
                      <div className="w-16 h-10 rounded overflow-hidden bg-secondary border">
                        <img src={banner.image_url} alt={banner.title} className="w-full h-full object-cover" />
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div>{banner.title}</div>
                      {banner.subtitle && <div className="text-xs text-muted-foreground">{banner.subtitle}</div>}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                      {banner.link_url || "-"}
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      {banner.order_index}
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch 
                        checked={banner.is_active} 
                        onCheckedChange={(checked) => handleToggleActive(banner, checked)} 
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(banner)}
                          className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <IconEdit className="w-4 h-4" />
                          <span className="sr-only">Sửa</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setBannerToDelete(banner.id);
                            setIsDeleteDialogOpen(true);
                          }}
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <IconTrash className="w-4 h-4" />
                          <span className="sr-only">Xóa</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <div className="text-sm text-muted-foreground">
              Trang {page} / {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Trước
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                  // Simple logic to show pages around current page
                  let pageNum = page - 2 + i;
                  if (page <= 3) pageNum = i + 1;
                  else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                  
                  if (pageNum > 0 && pageNum <= totalPages) {
                    return (
                      <Button
                        key={pageNum}
                        variant={page === pageNum ? "default" : "outline"}
                        size="sm"
                        className="w-8 h-8 p-0"
                        onClick={() => setPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  }
                  return null;
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Sau
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {dialogMode === "create" ? "Thêm Banner mới" : "Cập nhật Banner"}
              </DialogTitle>
              <DialogDescription>
                Điền thông tin chi tiết cho banner hiển thị ngoài trang chủ.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Tiêu đề chính *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="VD: Giảm đến 40%"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="subtitle">Tiêu đề phụ</Label>
                  <Input
                    id="subtitle"
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    placeholder="VD: Tuần lễ công nghệ"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="badge_text">Chữ trên Nhãn (Badge)</Label>
                  <Input
                    id="badge_text"
                    value={formData.badge_text}
                    onChange={(e) => setFormData({ ...formData, badge_text: e.target.value })}
                    placeholder="VD: Hot, Mới"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Mô tả chi tiết</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Nhập mô tả ngắn gọn..."
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="image_url">Hình ảnh Banner *</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    id="image_file"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isUploading}
                    className="flex-1"
                  />
                  {isUploading && <IconLoader2 className="w-5 h-5 animate-spin text-primary" />}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="h-[1px] flex-1 bg-border"></div>
                  <span className="text-xs text-muted-foreground uppercase">Hoặc dán Link</span>
                  <div className="h-[1px] flex-1 bg-border"></div>
                </div>
                <Input
                  id="image_url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://..."
                  required
                />
                {formData.image_url && (
                  <div className="mt-2 w-full h-full rounded border bg-secondary overflow-hidden relative">
                    <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                  </div>
                )}
              </div>

              <div className="grid gap-2">
                <div className="flex gap-4 items-center mb-1">
                  <Label>Link đích khi click</Label>
                  <div className="flex gap-4 ml-auto">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input 
                        type="radio" 
                        name="linkType" 
                        value="category" 
                        checked={linkType === "category"} 
                        onChange={() => setLinkType("category")} 
                      /> Danh mục
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input 
                        type="radio" 
                        name="linkType" 
                        value="custom" 
                        checked={linkType === "custom"} 
                        onChange={() => setLinkType("custom")} 
                      /> Tùy chỉnh
                    </label>
                  </div>
                </div>
                
                {linkType === "category" ? (
                  <Popover open={comboboxOpen} onOpenChange={setComboboxOpen} modal={true}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={comboboxOpen}
                        className="w-full justify-between"
                      >
                        {formData.link_url && formData.link_url.startsWith("/products?categories=")
                          ? categories.find((c) => c.id === formData.link_url.replace("/products?categories=", ""))?.name || "Chọn danh mục"
                          : "Chọn danh mục"}
                        <IconChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command shouldFilter={false}>
                        <CommandInput
                          placeholder="Tìm kiếm danh mục..."
                          value={catSearch}
                          onValueChange={setCatSearch}
                        />
                        <CommandList className="max-h-48">
                          {isSearchingCat ? (
                            <div className="p-4 text-center text-sm text-muted-foreground flex justify-center items-center">
                              <IconLoader2 className="mr-2 size-4 animate-spin" /> Đang tìm...
                            </div>
                          ) : (
                            <CommandEmpty className="p-2 text-sm text-muted-foreground text-center">
                              Không tìm thấy Danh mục.
                            </CommandEmpty>
                          )}
                          <CommandGroup>
                            {categories.map((c) => (
                              <CommandItem
                                key={c.id}
                                value={c.id}
                                onSelect={() => {
                                  setFormData((prev) => ({ ...prev, link_url: `/products?categories=${c.id}` }));
                                  setComboboxOpen(false);
                                }}
                              >
                                <IconCheck
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    formData.link_url === `/products?categories=${c.id}` ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {c.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                        <div className="border-t p-1">
                          <Button
                            variant="ghost"
                            className="w-full justify-start text-primary"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setQuickCreateName(catSearch);
                              setQuickCreateDialogOpen(true);
                            }}
                          >
                            <IconPlus className="mr-2 size-4" />
                            Tạo mới {catSearch ? `"${catSearch}"` : "danh mục"}
                          </Button>
                        </div>
                      </Command>
                    </PopoverContent>
                  </Popover>
                ) : (
                  <Input
                    id="link_url"
                    value={formData.link_url}
                    onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                    placeholder="VD: https://... hoặc /products"
                  />
                )}
              </div>

              <div className="grid gap-2">
                  <Label htmlFor="order_index">Thứ tự ưu tiên</Label>
                  <Input
                    id="order_index"
                    type="number"
                    value={formData.order_index}
                    onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })}
                  />
                </div>
              
              <div className="flex items-center gap-2 mt-2">
                <Switch 
                  id="is_active" 
                  checked={formData.is_active} 
                  onCheckedChange={(c) => setFormData({...formData, is_active: c})} 
                />
                <Label htmlFor="is_active">Hiển thị trên trang chủ</Label>
              </div>

              {formError && (
                <div className="text-sm font-medium text-red-500 bg-red-50 p-3 rounded-md border border-red-200">
                  {formError}
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSubmitting}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <IconLoader2 className="w-4 h-4 mr-2 animate-spin" />}
                {dialogMode === "create" ? "Tạo mới" : "Lưu thay đổi"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Alert Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa Banner?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Banner sẽ bị xóa vĩnh viễn khỏi hệ thống.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              disabled={isSubmitting}
            >
              {isSubmitting && <IconLoader2 className="w-4 h-4 mr-2 animate-spin" />}
              Xác nhận xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Quick Create Category Dialog */}
      <Dialog open={quickCreateDialogOpen} onOpenChange={setQuickCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]" style={{ zIndex: 10000 }}>
          <form onSubmit={handleQuickCreateCategory}>
            <DialogHeader>
              <DialogTitle>Thêm nhanh Danh mục</DialogTitle>
              <DialogDescription>
                Tạo một danh mục mới để liên kết ngay lập tức.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="quick-cat-name">Tên danh mục *</Label>
                <Input
                  id="quick-cat-name"
                  value={quickCreateName}
                  onChange={(e) => setQuickCreateName(e.target.value)}
                  placeholder="VD: Điện thoại di động"
                  required
                  autoFocus
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setQuickCreateDialogOpen(false)}
                disabled={creatingCategory}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={creatingCategory}>
                {creatingCategory && <IconLoader2 className="w-4 h-4 mr-2 animate-spin" />}
                Tạo nhanh
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function PromoBannersPage() {
  return (
    <RoleGuard allowedRoles={["admin"]}>
      <Suspense fallback={
        <div className="flex items-center justify-center h-[60vh]">
          <IconLoader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }>
        <PromoBannersPageContent />
      </Suspense>
    </RoleGuard>
  );
}
