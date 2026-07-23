"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import RoleGuard from "@/components/guards/role-guard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { IconLoader2, IconSend, IconSearch, IconLink, IconHistory, IconSparkles, IconTrash, IconUser, IconUsers } from "@tabler/icons-react";
import { broadcastNotification, sendTargetedNotification, getBroadcastHistory, deleteBroadcast, deleteNotification, searchUsersForNotification, NotificationType, Notification } from "@/lib/services/notification.service";
import { Badge } from "@/components/ui/badge";
import { getProduct } from "@/lib/services/product.service";
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

function NotificationsPageContent() {
  const [sendMode, setSendMode] = useState<"broadcast" | "targeted">("broadcast");
  const [selectedUser, setSelectedUser] = useState<{ id: string; full_name?: string; email?: string } | null>(null);
  const [userSearch, setUserSearch] = useState("");
  const [userResults, setUserResults] = useState<any[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<NotificationType>("promotion");
  const [link, setLink] = useState("");
  const [sending, setSending] = useState(false);

  // History state & search logic
  const [history, setHistory] = useState<Notification[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [deleteTargetItem, setDeleteTargetItem] = useState<Notification | null>(null);
  const [historySearch, setHistorySearch] = useState("");

  const filteredHistory = history.filter((item) => {
    if (!historySearch.trim()) return true;
    const q = historySearch.toLowerCase();
    const recipientName = item.profiles?.full_name?.toLowerCase() || "";
    const recipientEmail = item.profiles?.email?.toLowerCase() || "";
    return (
      item.title?.toLowerCase().includes(q) ||
      item.message?.toLowerCase().includes(q) ||
      item.link?.toLowerCase().includes(q) ||
      item.type?.toLowerCase().includes(q) ||
      recipientName.includes(q) ||
      recipientEmail.includes(q)
    );
  });

  // Product search state
  const [productSearch, setProductSearch] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [searchingProduct, setSearchingProduct] = useState(false);
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    const { data } = await getBroadcastHistory();
    if (data) setHistory(data);
    setLoadingHistory(false);
  };

  // Search users autocomplete
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!userSearch.trim()) {
        setUserResults([]);
        return;
      }
      setSearchingUsers(true);
      const { data } = await searchUsersForNotification(userSearch);
      setUserResults(data ?? []);
      setSearchingUsers(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [userSearch]);

  // Search products autocomplete
  useEffect(() => {
    const searchTimer = setTimeout(async () => {
      if (!productSearch.trim()) {
        setProducts([]);
        setShowProductDropdown(false);
        return;
      }
      setSearchingProduct(true);
      setShowProductDropdown(true);
      const { data } = await getProduct(productSearch, 1, 5);
      setProducts(data ?? []);
      setSearchingProduct(false);
    }, 300);

    return () => clearTimeout(searchTimer);
  }, [productSearch]);

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error("Vui lòng nhập đầy đủ tiêu đề và nội dung.");
      return;
    }

    if (sendMode === "targeted" && !selectedUser) {
      toast.error("Vui lòng tìm và chọn một thành viên cụ thể để gửi.");
      return;
    }

    setSending(true);
    try {
      if (sendMode === "broadcast") {
        const { error } = await broadcastNotification({
          title: title.trim(),
          message: message.trim(),
          type,
          link: link.trim() || undefined,
        });
        if (error) throw error;
        toast.success("Đã phát sóng thông báo tới toàn bộ thành viên!");
      } else if (selectedUser) {
        const { error } = await sendTargetedNotification(selectedUser.id, {
          title: title.trim(),
          message: message.trim(),
          type,
          link: link.trim() || undefined,
        });
        if (error) throw error;
        toast.success(`Đã gửi thông báo riêng cho: ${selectedUser.full_name || selectedUser.id}`);
      }

      // Reset form
      setTitle("");
      setMessage("");
      setLink("");
      setProductSearch("");
      fetchHistory();
    } catch (err: any) {
      toast.error(err.message || "Đã xảy ra lỗi khi gửi thông báo.");
    } finally {
      setSending(false);
    }
  };

  const handleDeleteSentItem = (item: Notification) => {
    setDeleteTargetItem(item);
  };

  const executeDeleteSentItem = async () => {
    if (!deleteTargetItem) return;
    const item = deleteTargetItem;
    setDeleteTargetItem(null);

    // Nếu là thông báo cá nhân, xóa chính xác ID đó; nếu là Broadcast, xóa tất cả các thông báo cùng title & message
    const { error } = item.is_broadcast
      ? await deleteBroadcast(item.title, item.message)
      : await deleteNotification(item.id);

    if (error) {
      toast.error("Lỗi khi thu hồi thông báo.");
    } else {
      toast.success("Đã thu hồi thông báo thành công.");
      setHistory(prev => item.is_broadcast
        ? prev.filter(h => !(h.title === item.title && h.message === item.message))
        : prev.filter(h => h.id !== item.id)
      );
    }
  };

  const handleSelectProduct = (product: any) => {
    setLink(`/product/${product.id}`);
    setShowProductDropdown(false);
    toast.info(`Đã gán link sản phẩm: ${product.name}`);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  const getTypeName = (t: string) => {
    switch (t) {
      case "promotion": return "🎁 Khuyến mãi";
      case "order": return "📦 Đơn hàng";
      case "alert": return "⚠️ Cảnh báo";
      case "coupon": return "🏷️ Mã giảm giá";
      case "welcome": return "👋 Chào mừng";
      case "review": return "⭐ Đánh giá";
      default: return "📢 Hệ thống";
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Quản lý Thông báo</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Gửi thông báo đẩy (Broadcast & Cá nhân hóa) với đa dạng thể loại và hỗ trợ thu hồi tin nhắn.
        </p>
      </div>

      <Tabs defaultValue="compose" className="space-y-4">
        <TabsList className="flex w-full overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden h-auto p-1 gap-1 justify-start sm:grid sm:grid-cols-2 sm:justify-center">
          <TabsTrigger value="compose" className="gap-1.5 shrink-0 px-3 py-2 text-xs sm:text-sm whitespace-nowrap flex-1">
            <IconSend className="size-4 shrink-0" />
            <span className="sm:hidden">Soạn tin</span>
            <span className="hidden sm:inline">Soạn tin mới</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5 shrink-0 px-3 py-2 text-xs sm:text-sm whitespace-nowrap flex-1">
            <IconHistory className="size-4 shrink-0" />
            <span className="sm:hidden">Lịch sử</span>
            <span className="hidden sm:inline">Lịch sử đã gửi</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="compose">
          <Card>
            <CardHeader>
              <CardTitle>Trung Tâm Thiết Lập Thông Báo</CardTitle>
              <CardDescription>
                Thiết lập đối tượng nhận tin và đính kèm đường dẫn thông minh.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Chọn chế độ Broadcast hay Cá nhân */}
              <div className="space-y-3 p-3 sm:p-4 bg-secondary/30 rounded-xl border">
                <Label className="font-semibold block text-sm">Đối tượng nhận thông báo:</Label>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                  <Button
                    type="button"
                    variant={sendMode === "broadcast" ? "default" : "outline"}
                    onClick={() => { setSendMode("broadcast"); setSelectedUser(null); }}
                    className="gap-2 flex-1 justify-center text-xs sm:text-sm h-10"
                  >
                    <IconUsers className="size-4 shrink-0" /> Tất cả mọi người
                  </Button>
                  <Button
                    type="button"
                    variant={sendMode === "targeted" ? "default" : "outline"}
                    onClick={() => setSendMode("targeted")}
                    className="gap-2 flex-1 justify-center text-xs sm:text-sm h-10"
                  >
                    <IconUser className="size-4 shrink-0" /> Người dùng cụ thể
                  </Button>
                </div>

                {/* Autocomplete Người dùng */}
                {sendMode === "targeted" && (
                  <div className="pt-2 relative">
                    {selectedUser ? (
                      <div className="flex items-center justify-between p-2.5 bg-primary/10 border border-primary/30 rounded-lg text-primary text-xs font-semibold">
                        <span>Đang gửi riêng cho: {selectedUser.full_name || selectedUser.id}</span>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)} className="h-6 px-2 hover:bg-primary/20">
                          Chọn lại
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <Input
                          placeholder="Gõ tên hoặc Email tài khoản muốn gửi..."
                          value={userSearch}
                          onChange={(e) => setUserSearch(e.target.value)}
                          className="bg-background text-xs h-9"
                        />
                        {userSearch && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-popover text-popover-foreground rounded-md border shadow-md z-50 max-h-48 overflow-y-auto">
                            {searchingUsers ? (
                              <div className="p-2 text-center text-xs text-muted-foreground">Đang tìm...</div>
                            ) : userResults.length > 0 ? (
                              userResults.map((u) => (
                                <div
                                  key={u.id}
                                  onClick={() => { setSelectedUser(u); setUserSearch(""); }}
                                  className="p-2 hover:bg-muted cursor-pointer text-xs flex justify-between items-center border-b last:border-0"
                                >
                                  <span className="font-medium">{u.full_name || u.email || "Không tên"}</span>
                                  <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[180px]">{u.email || u.id}</span>
                                </div>
                              ))
                            ) : (
                              <div className="p-2 text-center text-xs text-muted-foreground">Không tìm thấy ai</div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="type">Loại Thông báo</Label>
                  <Select value={type} onValueChange={(val: NotificationType) => setType(val)}>
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Chọn loại..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="promotion">🎁 Khuyến mãi / Ưu đãi</SelectItem>
                      <SelectItem value="coupon">🏷️ Tặng mã giảm giá</SelectItem>
                      <SelectItem value="alert">⚠️ Cảnh báo khẩn</SelectItem>
                      <SelectItem value="welcome">👋 Tin chào mừng</SelectItem>
                      <SelectItem value="review">⭐ Nhắc đánh giá</SelectItem>
                      <SelectItem value="system">📢 Hệ thống / Tin tức</SelectItem>
                      <SelectItem value="order">📦 Cập nhật đơn hàng</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Tiêu đề</Label>
                  <Input
                    id="title"
                    placeholder="VD: Siêu sale giảm tới 50% / Cảnh báo bảo mật..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Nội dung chi tiết</Label>
                <Textarea
                  id="message"
                  placeholder="VD: Nhập mã LUXE50 giảm ngay 50k cho đơn từ 200k..."
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>

              {/* Đính kèm Link sáng tạo */}
              <div className="space-y-2 p-2 bg-muted/40 rounded-xl border border-border/60">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-1.5 font-semibold text-primary">
                    <IconLink className="size-4" /> Đính kèm đường dẫn (Link)
                  </Label>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <IconSparkles className="size-3 text-amber-500" /> Chọn nhanh gợi ý bên dưới
                  </span>
                </div>

                {/* Gợi ý Preset */}
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button variant="outline" size="sm" type="button" onClick={() => setLink("/products")} className="h-7 text-xs bg-background">
                    🛍️ Tất cả Sản phẩm
                  </Button>
                  <Button variant="outline" size="sm" type="button" onClick={() => setLink("/account/wishlist")} className="h-7 text-xs bg-background">
                    ❤️ Trang Yêu thích
                  </Button>
                  <Button variant="outline" size="sm" type="button" onClick={() => setLink("/cart")} className="h-7 text-xs bg-background">
                    🛒 Giỏ hàng
                  </Button>
                  {/* Thêm nút cho Lịch sử đơn hàng */}
                  <Button variant="outline" size="sm" type="button" onClick={() => setLink("/account/orders")} className="h-7 text-xs bg-background">
                    📋 Lịch sử đơn hàng
                  </Button>

                  
                </div>

                {/* Tìm kiếm sản phẩm thông minh */}
                <div className="relative pt-2">
                  <Label className="text-xs text-muted-foreground mb-1 block">Hoặc gán link Sản phẩm cụ thể:</Label>
                  <div className="relative">
                    <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Gõ tên sản phẩm (VD: Đồng hồ, Túi xách)..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="pl-9 bg-background text-xs h-9"
                    />
                  </div>

                  {/* Dropdown kết quả */}
                  {showProductDropdown && (
                    <div className="absolute top-full mt-1 w-full bg-popover text-popover-foreground rounded-lg border shadow-lg overflow-hidden z-50 max-h-56 overflow-y-auto">
                      {searchingProduct ? (
                        <div className="p-3 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                          <IconLoader2 className="size-3.5 animate-spin" /> Đang tìm...
                        </div>
                      ) : products.length > 0 ? (
                        <div>
                          {products.map((p) => (
                            <div
                              key={p.id}
                              onClick={() => handleSelectProduct(p)}
                              className="flex items-center gap-3 p-2 hover:bg-muted cursor-pointer transition-colors border-b last:border-0"
                            >
                              <Image width={32} height={32} unoptimized src={p.image_url || "https://placehold.co/40x40"} alt={p.name} className="size-8 rounded object-cover border shrink-0" />
                              <div className="flex flex-col overflow-hidden">
                                <span className="text-xs font-medium truncate">{p.name}</span>
                                <span className="text-[10px] text-red-600 font-bold">
                                  {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(p.price)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-3 text-center text-xs text-muted-foreground">Không tìm thấy sản phẩm</div>
                      )}
                    </div>
                  )}
                </div>

                {/* Ô link thực tế */}
                <div className="pt-2">
                  <Input
                    id="link"
                    placeholder="Link thực tế sẽ gửi (VD: /product/xxx)..."
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    className="font-mono text-xs bg-background/50"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  onClick={handleSend}
                  disabled={sending || !title.trim() || !message.trim() || (sendMode === "targeted" && !selectedUser)}
                  className="w-full sm:w-auto gap-2 px-8"
                >
                  {sending ? (
                    <IconLoader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <IconSend className="w-4 h-4" />
                  )}
                  {sending ? "Đang gửi..." : sendMode === "broadcast" ? "Phát Sóng Tất Cả" : "Gửi Cá Nhân"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Lịch Sử Thông Báo Đã Gửi</CardTitle>
                <CardDescription>
                  Danh sách các tin nhắn Admin từng gửi. Có thể ấn nút thu hồi để xóa khỏi toàn bộ tài khoản.
                </CardDescription>
              </div>
              <div className="relative w-full sm:w-72 shrink-0">
                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm tiêu đề, nội dung, link..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="pl-9 bg-background h-9 text-xs sm:text-sm"
                />
              </div>
            </CardHeader>
            <CardContent>
              {/* Giao diện Thẻ gọn gàng trên Mobile (< 640px) */}
              <div className="space-y-3 sm:hidden">
                {loadingHistory ? (
                  <div className="flex justify-center py-12">
                    <IconLoader2 className="size-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredHistory.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground text-sm">
                    {historySearch ? "Không tìm thấy thông báo nào khớp từ khóa." : "Chưa có lịch sử gửi thông báo nào."}
                  </div>
                ) : (
                  filteredHistory.map((item) => (
                    <div key={item.id} className="p-3.5 rounded-xl border bg-card text-card-foreground shadow-sm space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-[10px] px-2 py-0.5 font-semibold bg-secondary/50">
                            {getTypeName(item.type)}
                          </Badge>
                          {item.is_broadcast ? (
                            <Badge className="text-[10px] px-2.5 py-0.5 font-semibold bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-300/40 gap-1 flex items-center">
                              <IconUsers className="size-3.5" /> Gửi tất cả ({item.recipients_count} user)
                            </Badge>
                          ) : (
                            <div className="flex items-center gap-1.5 bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-300/40 rounded-full px-2.5 py-0.5 text-[11px] font-medium max-w-[220px] truncate">
                              <IconUser className="size-3.5 shrink-0" />
                              <span className="truncate">Gửi cho: {item.profiles?.full_name || item.profiles?.email?.split('@')[0] || "Cá nhân"}</span>
                            </div>
                          )}
                        </div>
                        <span className="text-[11px] text-muted-foreground shrink-0">
                          {formatDate(item.created_at)}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-bold text-sm text-foreground leading-snug">{item.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.message}</p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-border/50 gap-2">
                        <div className="min-w-0 flex-1">
                          {item.link ? (
                            <span className="inline-block font-mono text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded truncate max-w-full">
                              🔗 {item.link}
                            </span>
                          ) : (
                            <span className="text-[11px] text-muted-foreground italic">Không đính kèm link</span>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteSentItem(item)}
                          className="h-8 px-2.5 text-red-600 hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-950 gap-1 text-xs font-medium shrink-0"
                          title="Thu hồi thông báo này"
                        >
                          <IconTrash className="size-3.5" /> Thu hồi
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Giao diện Bảng truyền thống trên Desktop (>= 640px) */}
              <div className="hidden sm:block overflow-x-auto w-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-28">Loại</TableHead>
                      <TableHead className="w-52">Đối tượng nhận</TableHead>
                      <TableHead>Tiêu đề & Nội dung</TableHead>
                      <TableHead>Đính kèm</TableHead>
                      <TableHead>Thời gian gửi</TableHead>
                      <TableHead className="text-right w-16">Xóa</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingHistory ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-32 text-center">
                          <IconLoader2 className="size-6 animate-spin mx-auto text-muted-foreground" />
                        </TableCell>
                      </TableRow>
                    ) : filteredHistory.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-32 text-center text-muted-foreground text-sm">
                          {historySearch ? "Không tìm thấy thông báo nào khớp từ khóa." : "Chưa có lịch sử gửi thông báo nào."}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredHistory.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px] whitespace-nowrap">
                              {getTypeName(item.type)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {item.is_broadcast ? (
                              <Badge className="text-xs px-2.5 py-1 font-semibold bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-300/40 gap-1.5 flex items-center w-fit">
                                <IconUsers className="size-4 shrink-0" />
                                <span>Gửi tất cả ({item.recipients_count} user)</span>
                              </Badge>
                            ) : (
                              <div className="flex flex-col text-xs bg-blue-500/10 dark:bg-blue-950/40 border border-blue-300/40 dark:border-blue-800/60 rounded-lg p-2 max-w-[210px]">
                                <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-300 font-semibold">
                                  <IconUser className="size-4 shrink-0" />
                                  <span className="truncate">Gửi: {item.profiles?.full_name || item.profiles?.email?.split('@')[0] || "Khách hàng"}</span>
                                </div>
                                {item.profiles?.email && (
                                  <span className="text-[10px] text-muted-foreground ml-5 truncate font-mono mt-0.5">{item.profiles.email}</span>
                                )}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="max-w-xs min-w-[180px]">
                            <p className="font-semibold text-xs text-foreground">{item.title}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{item.message}</p>
                          </TableCell>
                          <TableCell>
                            {item.link ? (
                              <span className="font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded text-primary whitespace-nowrap">
                                {item.link}
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-xs">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDate(item.created_at)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteSentItem(item)}
                              className="size-7 text-red-600 hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-950"
                              title="Thu hồi thông báo này"
                            >
                              <IconTrash className="size-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Modal xác nhận thu hồi / xóa thông báo */}
              <AlertDialog open={!!deleteTargetItem} onOpenChange={(open) => !open && setDeleteTargetItem(null)}>
                <AlertDialogContent className="animate__animated animate__bounceIn">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-red-600 dark:text-red-400 flex items-center gap-2">
                      <IconTrash className="size-5" /> Xác nhận thu hồi thông báo
                    </AlertDialogTitle>
                    <AlertDialogDescription className="space-y-2 text-sm text-muted-foreground pt-1">
                      {deleteTargetItem?.is_broadcast ? (
                        <span>
                          Bạn có chắc chắn muốn thu hồi thông báo phát sóng <strong>&quot;{deleteTargetItem?.title}&quot;</strong> khỏi toàn bộ <strong>{deleteTargetItem?.recipients_count} thành viên</strong> không? Hành động này sẽ xóa thông báo khỏi hộp thư của tất cả người nhận.
                        </span>
                      ) : (
                        <span>
                          Bạn có chắc chắn muốn thu hồi thông báo cá nhân <strong>&quot;{deleteTargetItem?.title}&quot;</strong> đã gửi riêng cho <strong>{deleteTargetItem?.profiles?.full_name || deleteTargetItem?.profiles?.email || "thành viên này"}</strong> không?
                        </span>
                      )}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Hủy bỏ</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={executeDeleteSentItem}
                      className="bg-red-600 hover:bg-red-700 text-white font-semibold"
                    >
                      Đồng ý thu hồi
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <RoleGuard allowedRoles={["admin"]}>
      <NotificationsPageContent />
    </RoleGuard>
  );
}
