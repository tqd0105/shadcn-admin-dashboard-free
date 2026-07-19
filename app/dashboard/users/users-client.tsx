"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { getUsers, createUser, updateUser, deleteUser } from "@/lib/services/user.service";
import { getRoles } from "@/lib/services/role.service";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { PlusCircledIcon } from "@radix-ui/react-icons";
import { Card, CardContent } from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IconLoader2, IconLock, IconLockOpen, IconAlertTriangle } from "@tabler/icons-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import UsersDataTable, { UserRow } from "./data-table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown, ShieldAlert, User as UserIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";

const emptyForm = { full_name: "", email: "", password: "", role_id: "", is_locked: false };

export default function UsersClient() {
  const { role } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialSearch = searchParams.get("search") || "";
  const initialPage = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = 10;

  const [search, setSearch] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [users, setUsers] = useState<UserRow[]>([]);
  const [roles, setRoles] = useState<{ id: string; name: string }[]>([]);

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  // Delete states
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // Lock modal states
  const [lockTarget, setLockTarget] = useState<{ user: UserRow; action: "lock" | "unlock" } | null>(null);
  const [locking, setLocking] = useState(false);

  // Transfer Admin modal states
  const [transferAdminDialogOpen, setTransferAdminDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ type: "update" | "delete", targetId: string, payload?: any } | null>(null);
  const [transferTargetId, setTransferTargetId] = useState<string>("");
  const [transferring, setTransferring] = useState(false);
  const [transferSearch, setTransferSearch] = useState("");
  const [transferUsers, setTransferUsers] = useState<UserRow[]>([]);
  const [popoverOpen, setPopoverOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch((prev) => {
        if (prev !== search) {
          setPage(1);
        }
        return search;
      });
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

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

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const roleFilter = role === "staff" ? "customer" : undefined;
    const { data, totalPages: fetchedTotalPages } = await getUsers(debouncedSearch, page, pageSize, roleFilter);
    setUsers((data as any) ?? []);
    setTotalPages(fetchedTotalPages || 1);
    setLoading(false);
  }, [debouncedSearch, page, pageSize, role]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (!transferAdminDialogOpen) return;
    const fetchTransferCandidates = async () => {
      const { data } = await getUsers(transferSearch, 1, 10);
      if (data) {
        setTransferUsers(data.filter((u: any) => u.id !== pendingAction?.targetId));
      }
    };
    const timeout = setTimeout(fetchTransferCandidates, 300);
    return () => clearTimeout(timeout);
  }, [transferSearch, transferAdminDialogOpen, pendingAction?.targetId]);

  const executeTransferAndContinue = async () => {
    if (!transferTargetId || !pendingAction) return;
    setTransferring(true);
    try {
      const adminRole = roles.find(r => r.name === "admin");
      if (!adminRole) throw new Error("Admin role not found");

      // 1. Nâng cấp người được chọn lên Admin
      const { error: transferError } = await updateUser(transferTargetId, { role_id: adminRole.id });
      if (transferError) throw transferError;

      // 2. Tiếp tục hành động còn dang dở
      if (pendingAction.type === "update") {
        const { error: updateError } = await updateUser(pendingAction.targetId, pendingAction.payload);
        if (updateError) throw updateError;
      } else if (pendingAction.type === "delete") {
        const { error: deleteError } = await deleteUser(pendingAction.targetId);
        if (deleteError) throw deleteError;
      }

      setTransferAdminDialogOpen(false);
      setTransferTargetId("");
      setPendingAction(null);
      setDialogOpen(false);
      setDeleteTarget(null);
      setDeleteConfirmText("");
      fetchUsers();
    } catch (err: any) {
      alert("Lỗi khi chuyển quyền: " + (err.message || "Unknown error"));
    } finally {
      setTransferring(false);
    }
  };

  useEffect(() => {
    const loadRoles = async () => {
      const { data } = await getRoles();
      if (data) setRoles(data);
    };
    loadRoles();
  }, []);

  const openCreate = () => {
    setEditingUser(null);
    const defaultRoleId = role === "staff" 
      ? (roles.find(r => r.name === "customer")?.id || "") 
      : emptyForm.role_id;
    setForm({ ...emptyForm, role_id: defaultRoleId });
    setDialogOpen(true);
  };

  const openEdit = (user: UserRow) => {
    setEditingUser(user);
    setForm({
      full_name: user.full_name || "",
      email: user.email || "",
      password: "", // cannot edit password here
      role_id: user.role?.id || "",
      is_locked: !!user.is_locked,
    });
    setDialogOpen(true);
  };

  const openDelete = (user: UserRow) => {
    setDeleteTarget(user);
    setDeleteConfirmText("");
  };

  const openToggleLock = (user: UserRow, newLockedStatus: boolean) => {
    if (role !== "admin" && role !== "staff") return;
    setLockTarget({ user, action: newLockedStatus ? "lock" : "unlock" });
  };

  const executeToggleLock = async () => {
    if (!lockTarget) return;
    setLocking(true);
    try {
      const { error } = await updateUser(lockTarget.user.id, { is_locked: lockTarget.action === "lock" });
      if (error) throw error;
      setLockTarget(null);
      fetchUsers();
    } catch (err: any) {
      alert("Lỗi cập nhật trạng thái: " + (err.message || "Unknown error"));
    } finally {
      setLocking(false);
    }
  };

  const handleSave = async () => {
    if (!form.full_name || !form.role_id) {
      alert("Vui lòng điền Tên hiển thị và Vai trò.");
      return;
    }

    if (!editingUser) {
      if (!form.email || !form.password) {
        alert("Vui lòng điền Email và Password khi tạo mới.");
        return;
      }
    }

    setSaving(true);
    try {
      if (editingUser) {
        const payload: any = {
          full_name: form.full_name,
          is_locked: form.is_locked,
        };
        if (role !== "staff") {
          payload.role_id = form.role_id;
        }
        const { error } = await updateUser(editingUser.id, payload);
        if (error) {
          if (error.message && error.message.includes("ít nhất 1 Admin")) {
            setPendingAction({ type: "update", targetId: editingUser.id, payload });
            setTransferAdminDialogOpen(true);
            return;
          }
          throw error;
        }
      } else {
        const payload: any = {
          email: form.email,
          password: form.password,
          full_name: form.full_name,
          role_id: role === "staff" ? (roles.find(r => r.name === "customer")?.id || form.role_id) : form.role_id,
          is_locked: form.is_locked,
        };
        const { error } = await createUser(payload);
        if (error) throw error;
      }
      setDialogOpen(false);
      fetchUsers();
    } catch (err: any) {
      alert(err.message || "Đã xảy ra lỗi.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || role !== "admin") return;
    setDeleting(true);
    try {
      const { error } = await deleteUser(deleteTarget.id);
      if (error) {
        if (error.message && error.message.includes("ít nhất 1 Admin")) {
          setPendingAction({ type: "delete", targetId: deleteTarget.id });
          setTransferAdminDialogOpen(true);
          return;
        }
        throw error;
      }
      setDeleteTarget(null);
      setDeleteConfirmText("");
      fetchUsers();
    } catch (err: any) {
      alert("Lỗi khi xóa tài khoản: " + (err.message || "Unknown error"));
    } finally {
      setDeleting(false);
    }
  };

  const isDeleteConfirmed = deleteTarget && (
    deleteConfirmText.trim().toUpperCase() === "XÓA TÀI KHOẢN" ||
    deleteConfirmText.trim() === deleteTarget.email
  );

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Quản lý Tài khoản</h1>
        <Button onClick={openCreate}>
          <PlusCircledIcon className="mr-2" /> Thêm người dùng
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <UsersDataTable 
            data={users}
            pageCount={totalPages}
            pageIndex={page - 1}
            pageSize={pageSize}
            onPageChange={(newIdx) => setPage(newIdx + 1)}
            search={search}
            onSearchChange={setSearch}
            loading={loading}
            onEdit={openEdit}
            onDelete={openDelete}
            onToggleLock={openToggleLock}
            role={role}
          />
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? "Chỉnh sửa Tài khoản" : "Tạo Tài khoản mới"}
            </DialogTitle>
            <DialogDescription>
              {editingUser
                ? "Cập nhật thông tin của người dùng."
                : "Điền thông tin bên dưới để cấp tài khoản mới."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Tên hiển thị <span className="text-red-500">*</span></Label>
              <Input
                id="full_name"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                placeholder="Nhập họ và tên..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="email@example.com"
                disabled={!!editingUser}
              />
            </div>
            {!editingUser && (
              <div className="space-y-2">
                <Label htmlFor="password">Mật khẩu <span className="text-red-500">*</span></Label>
                <Input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Nhập mật khẩu..."
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="role">Vai trò <span className="text-red-500">*</span></Label>
              <Select
                value={form.role_id}
                onValueChange={(val) => setForm({ ...form, role_id: val })}
                disabled={role === "staff" || saving}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Chọn vai trò" />
                </SelectTrigger>
                <SelectContent>
                  {roles
                    .filter(r => role === "admin" ? true : r.name === "customer")
                    .map(r => (
                      <SelectItem key={r.id} value={r.id}>
                        <span className="capitalize">{r.name}</span>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="space-y-0.5">
                <Label htmlFor="is_locked" className="text-base font-medium">Khóa tài khoản</Label>
                <p className="text-xs text-muted-foreground">Ngăn chặn người dùng đăng nhập vào hệ thống.</p>
              </div>
              <Switch
                id="is_locked"
                checked={form.is_locked}
                onCheckedChange={(checked) => setForm({ ...form, is_locked: checked })}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Hủy</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <IconLoader2 className="mr-2 size-4 animate-spin" />}
              Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-2 text-red-600">
              <IconAlertTriangle className="size-6 shrink-0" />
              <AlertDialogTitle className="text-xl">Xác nhận xóa tài khoản vĩnh viễn</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="space-y-3 pt-2 text-foreground/90">
              <p>
                Bạn có chắc chắn muốn xóa tài khoản <strong>{deleteTarget?.email}</strong>? Hành động này <strong>không thể hoàn tác</strong> và sẽ xóa sạch toàn bộ hồ sơ, thông tin xác thực cùng các dữ liệu liên quan khỏi hệ thống.
              </p>
              <div className="bg-red-50 dark:bg-red-950/40 p-3 rounded-lg border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300">
                Để xác nhận, vui lòng gõ chính xác cụm từ <strong>XÓA TÀI KHOẢN</strong> (hoặc email <strong>{deleteTarget?.email}</strong>) vào ô bên dưới:
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="py-2">
            <Input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Gõ XÓA TÀI KHOẢN hoặc email để xác nhận..."
              className="border-red-300 focus-visible:ring-red-500"
              disabled={deleting}
              onKeyDown={(e) => {
                if (e.key === "Enter" && isDeleteConfirmed && !deleting) {
                  e.preventDefault();
                  handleDelete();
                }
              }}
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Hủy bỏ</AlertDialogCancel>
            <AlertDialogAction
              className={cn(
                "bg-red-600 hover:bg-red-700 text-white transition-all",
                (!isDeleteConfirmed || deleting) && "opacity-50 cursor-not-allowed pointer-events-none"
              )}
              onClick={(e) => {
                e.preventDefault();
                if (isDeleteConfirmed && !deleting) {
                  handleDelete();
                }
              }}
              disabled={deleting || !isDeleteConfirmed}
            >
              {deleting && <IconLoader2 className="mr-2 size-4 animate-spin" />}
              Xóa vĩnh viễn
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!lockTarget} onOpenChange={(open) => !open && !locking && setLockTarget(null)}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-2">
              {lockTarget?.action === "lock" ? (
                <div className="p-2 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <IconLock className="size-6" />
                </div>
              ) : (
                <div className="p-2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <IconLockOpen className="size-6" />
                </div>
              )}
              <AlertDialogTitle className="text-xl">
                {lockTarget?.action === "lock" ? "Khóa quyền truy cập tài khoản?" : "Mở khóa tài khoản?"}
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="space-y-2 pt-2 text-foreground/90">
              {lockTarget?.action === "lock" ? (
                <>
                  <p>
                    Tài khoản <strong>{lockTarget.user.email}</strong> sẽ lập tức bị <strong>hủy phiên đăng nhập</strong> trên toàn bộ các thiết bị đang kết nối.
                  </p>
                  <p className="text-xs text-muted-foreground bg-muted p-2.5 rounded-md border">
                    Người dùng sẽ không thể đăng nhập hoặc thực hiện bất kỳ giao dịch nào cho tới khi được Mở khóa.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    Tài khoản <strong>{lockTarget?.user.email}</strong> sẽ được khôi phục toàn bộ quyền đăng nhập và mua sắm bình thường trên cửa hàng.
                  </p>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={locking}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className={cn(
                lockTarget?.action === "lock"
                  ? "bg-amber-600 hover:bg-amber-700 text-white"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white"
              )}
              onClick={(e) => {
                e.preventDefault();
                executeToggleLock();
              }}
              disabled={locking}
            >
              {locking && <IconLoader2 className="mr-2 size-4 animate-spin" />}
              {lockTarget?.action === "lock" ? "Xác nhận Khóa" : "Xác nhận Mở khóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Transfer Admin Dialog */}
      <AlertDialog open={transferAdminDialogOpen} onOpenChange={setTransferAdminDialogOpen}>
        <AlertDialogContent className="sm:max-w-md overflow-visible">
          <AlertDialogHeader>
            <div className="flex items-center gap-2.5 text-orange-600 dark:text-orange-400">
              <div >
                <Image src="/icons/warning1.png" alt="lock" width={35} height={35} />
              </div>
              <AlertDialogTitle className="text-xl font-bold">
                Chuyển giao Quyền Quản Trị
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="space-y-4 pt-2 text-foreground/90 text-sm">
              <p>
                Bạn đang thực hiện thao tác xóa hoặc hạ cấp tài khoản <strong>Admin duy nhất</strong> của hệ thống.
              </p>
              <div className="bg-orange-50 dark:bg-orange-950/40 p-3.5 rounded-lg border border-orange-200 dark:border-orange-900/60 text-xs text-orange-700 dark:text-orange-300 leading-relaxed">
                Để tiếp tục, vui lòng chọn một tài khoản khác để chuyển quyền Admin. Hệ thống không thể không có người quản trị.
              </div>
              <div className="flex flex-col gap-2 pt-2">
                <Label>Chọn Quản trị viên mới</Label>
                <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={popoverOpen}
                      className="w-full justify-between"
                    >
                      {transferTargetId
                        ? transferUsers.find((user) => user.id === transferTargetId)?.full_name || "Đã chọn 1 tài khoản"
                        : "Tìm kiếm người dùng (Tên/Email)..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[380px] p-0" align="start">
                    <Command shouldFilter={false}>
                      <CommandInput 
                        placeholder="Nhập tên hoặc email..." 
                        value={transferSearch}
                        onValueChange={setTransferSearch}
                      />
                      <CommandList>
                        <CommandEmpty>Không tìm thấy tài khoản nào.</CommandEmpty>
                        <CommandGroup>
                          {transferUsers.map((user) => (
                            <CommandItem
                              key={user.id}
                              value={user.id}
                              onSelect={(currentValue) => {
                                setTransferTargetId(currentValue === transferTargetId ? "" : currentValue);
                                setPopoverOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  transferTargetId === user.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={user.avatar_url || ""} />
                                  <AvatarFallback><UserIcon className="h-4 w-4" /></AvatarFallback>
                                </Avatar>
                                <span className="font-medium">{user.full_name}</span>
                                <span className="text-muted-foreground text-xs block truncate w-32">({user.email})</span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel disabled={transferring} onClick={() => {
              setPendingAction(null);
              setTransferTargetId("");
            }}>Hủy bỏ</AlertDialogCancel>
            <AlertDialogAction
              className="bg-orange-600 hover:bg-orange-700 text-white"
              disabled={!transferTargetId || transferring}
              onClick={(e) => {
                e.preventDefault();
                executeTransferAndContinue();
              }}
            >
              {transferring && <IconLoader2 className="mr-2 size-4 animate-spin" />}
              Xác nhận Chuyển quyền & Tiếp tục
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
