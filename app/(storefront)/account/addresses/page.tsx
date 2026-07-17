"use client";

import { useEffect, useState, useCallback } from "react";
import { getAddresses, addAddress, updateAddress, deleteAddress } from "@/lib/services/address.service";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { IconLoader2, IconPlus, IconTrash, IconEdit, IconMapPinFilled } from "@tabler/icons-react";
import { LuxeLoading } from "@/components/storefront/luxe-loading";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

export default function AddressesPage() {
  const { user, loading: authLoading } = useAuth();
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteModalId, setDeleteModalId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  const [formData, setFormData] = useState({
    id: "",
    full_name: "",
    phone: "",
    street: "",
    city: "",
    is_default: false
  });

  const fetchAddresses = useCallback(async () => {
    setTimeout(() => setLoading(true), 0);
    const { data, error } = await getAddresses();
    if (!error && data) {
      setAddresses(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user && !authLoading) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchAddresses();
    }
  }, [user, authLoading, fetchAddresses]);

  const resetForm = () => {
    setFormData({
      id: "",
      full_name: "",
      phone: "",
      street: "",
      city: "",
      is_default: false
    });
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (addr: any) => {
    setFormData({
      id: addr.id,
      full_name: addr.full_name || "",
      phone: addr.phone || "",
      street: addr.street || "",
      city: addr.city || "",
      is_default: addr.is_default || false
    });
    setIsDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteModalId) return;
    setDeleting(true);
    const { error } = await deleteAddress(deleteModalId);
    setDeleting(false);
    if (error) {
      toast.error("Lỗi khi xóa địa chỉ");
    } else {
      toast.success("Đã xóa địa chỉ");
      setDeleteModalId(null);
      fetchAddresses();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const phoneRegex = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;
    if (!phoneRegex.test(formData.phone.trim())) {
      toast.error("Số điện thoại không hợp lệ!", {
        description: "Vui lòng nhập đúng định dạng số di động Việt Nam (10 chữ số, ví dụ 098... hoặc 039...)."
      });
      return;
    }

    setIsSubmitting(true);
    
    let error;
    if (formData.id) {
      const res = await updateAddress(formData.id, formData);
      error = res.error;
    } else {
      const res = await addAddress(formData);
      error = res.error;
    }

    setIsSubmitting(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(formData.id ? "Đã cập nhật địa chỉ" : "Đã thêm địa chỉ mới");
      setIsDialogOpen(false);
      fetchAddresses();
    }
  };

  if (authLoading || loading) return <LuxeLoading label="Đang tải Sổ địa chỉ..." />;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Sổ địa chỉ</h1>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenAdd}>
              <IconPlus className="w-4 h-4 mr-2" /> Thêm địa chỉ mới
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{formData.id ? "Cập nhật địa chỉ" : "Thêm địa chỉ mới"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Họ và tên</Label>
                  <Input id="full_name" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Số điện thoại</Label>
                  <Input id="phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Tỉnh / Thành phố</Label>
                <Input id="city" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="street">Địa chỉ cụ thể</Label>
                <Input id="street" value={formData.street} onChange={e => setFormData({...formData, street: e.target.value})} required />
              </div>
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox 
                  id="is_default" 
                  checked={formData.is_default} 
                  onCheckedChange={(c) => setFormData({...formData, is_default: !!c})}
                />
                <Label htmlFor="is_default" className="cursor-pointer">Đặt làm địa chỉ mặc định</Label>
              </div>
              <DialogFooter className="pt-4">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <IconLoader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  {formData.id ? "Cập nhật" : "Lưu địa chỉ"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {addresses.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed">
          <IconMapPinFilled className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-600">Bạn chưa lưu địa chỉ nào</h3>
          <p className="text-sm text-gray-400 mt-1">Hãy thêm địa chỉ để thanh toán nhanh hơn nhé.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div key={addr.id} className={`border rounded-xl p-5 relative ${addr.is_default ? 'border-primary bg-primary/5' : ''}`}>
              {addr.is_default && (
                <span className="absolute top-0 left-0 text-white bg-primary dark:bg-white dark:text-black text-[10px] font-bold px-2 py-1 rounded-br-lg rounded-tl-xl">
                  MẶC ĐỊNH 
                </span>
              )}
              <div className="flex justify-between ">
                <div>
                  <h3 className="font-semibold text-lg">{addr.full_name}</h3>
                  <p className="text-muted-foreground mt-1 mb-2">{addr.phone}</p>
                  <p className="text-sm">{addr.street}</p>
                  <p className="text-sm">{addr.city}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <Button variant="outline" size="icon" onClick={() => handleOpenEdit(addr)}>
                    <IconEdit className="w-4 h-4 text-gray-600" />
                  </Button>
                  <Button variant="outline" size="icon" className="hover:bg-red-50 hover:text-red-600 hover:border-red-200" onClick={() => setDeleteModalId(addr.id)}>
                    <IconTrash className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Xác nhận xóa địa chỉ */}
      <Dialog open={!!deleteModalId} onOpenChange={(open) => { if (!open) setDeleteModalId(null); }}>
        <DialogContent className="max-w-sm text-center p-6 space-y-4">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-destructive flex items-center justify-center gap-2">
              <IconTrash className="w-6 h-6" /> Xác nhận xóa địa chỉ?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Địa chỉ này sẽ bị xóa vĩnh viễn khỏi sổ địa chỉ của bạn. Hành động này không thể khôi phục lại.
          </p>
          <DialogFooter className="flex gap-2 sm:justify-center pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setDeleteModalId(null)}>Hủy bỏ</Button>
            <Button variant="destructive" className="flex-1 font-bold shadow-md shadow-destructive/20" disabled={deleting} onClick={confirmDelete}>
              {deleting ? <IconLoader2 className="w-4 h-4 animate-spin mr-1" /> : null} Xóa ngay
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
