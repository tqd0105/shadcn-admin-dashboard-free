"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getWishlistGroups, createWishlistGroup, addToWishlistWithGroup } from "@/lib/services/wishlist.service";
import { toast } from "sonner";
import { IconLoader2, IconPlus } from "@tabler/icons-react";
import { Input } from "@/components/ui/input";

export function WishlistModal({ 
  isOpen, 
  onClose, 
  productId, 
  onSuccess 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  productId: string, 
  onSuccess: () => void 
}) {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [note, setNote] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");

  const loadGroups = async () => {
    setLoading(true);
    const { data } = await getWishlistGroups();
    if (data) {
      setGroups(data);
      if (data.length > 0) {
        setSelectedGroup(prev => prev ? prev : data[0].id);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadGroups();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNote("");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsCreatingGroup(false);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNewGroupName("");
    }
  }, [isOpen]);

  const handleSave = async () => {
    setIsAdding(true);
    
    let targetGroupId = selectedGroup || null;

    // Nếu đang ở chế độ tạo nhóm mới và có nhập tên nhóm
    if (isCreatingGroup && newGroupName.trim()) {
      const { data: newGroup, error: groupError } = await createWishlistGroup(newGroupName.trim());
      if (groupError || !newGroup) {
        toast.error("Không thể tạo nhóm mới, vui lòng thử lại.");
        setIsAdding(false);
        return;
      }
      targetGroupId = newGroup.id;
    }

    const { error } = await addToWishlistWithGroup(productId, targetGroupId, note);
    setIsAdding(false);
    
    if (error) {
      // Postgres unique constraint error code is usually '23505'
      if ((error as any).code === '23505') {
        toast.error("Sản phẩm này đã có trong nhóm đã chọn");
      } else {
        toast.error("Đã xảy ra lỗi");
      }
    } else {
      toast.success("Đã thêm vào yêu thích");
      onSuccess();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Thêm vào Yêu Thích</DialogTitle>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          {loading ? (
            <div className="flex justify-center py-8"><IconLoader2 className="animate-spin w-6 h-6 text-muted-foreground" /></div>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Chọn nhóm yêu thích</label>
                {!isCreatingGroup ? (
                  <div className="flex gap-2">
                    <select 
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={selectedGroup}
                      onChange={(e) => setSelectedGroup(e.target.value)}
                    >
                      <option value="">-- Mặc định (Không thuộc nhóm nào) --</option>
                      {groups.map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                    <Button variant="outline" size="icon" onClick={() => setIsCreatingGroup(true)} type="button">
                      <IconPlus className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Nhập tên nhóm mới..." 
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      autoFocus
                    />
                    <Button variant="ghost" onClick={() => {
                      setIsCreatingGroup(false);
                      setNewGroupName("");
                    }} type="button">Hủy</Button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Ghi chú (Tùy chọn)</label>
                <textarea 
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Ví dụ: Đợi sale ngày 11/11..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} type="button">Hủy</Button>
          <Button onClick={handleSave} disabled={loading || isAdding || (isCreatingGroup && !newGroupName.trim())} type="button">Lưu sản phẩm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
