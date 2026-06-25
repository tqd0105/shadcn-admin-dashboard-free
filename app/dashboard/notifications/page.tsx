"use client";

import { useState, useEffect } from "react";
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
import { broadcastNotification, sendTargetedNotification, getBroadcastHistory, deleteBroadcast, searchUsersForNotification, NotificationType, Notification } from "@/lib/services/notification.service";
import { getProduct } from "@/lib/services/product.service";
import { Badge } from "@/components/ui/badge";

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

  // History state
  const [history, setHistory] = useState<Notification[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

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

  const handleDeleteSentItem = async (item: Notification) => {
    if (!confirm("Bạn có chắc muốn thu hồi thông báo này khỏi tất cả tài khoản?")) return;
    const { error } = await deleteBroadcast(item.title, item.message);
    if (error) {
      toast.error("Lỗi khi thu hồi thông báo.");
    } else {
      toast.success("Đã thu hồi thông báo thành công.");
      setHistory(prev => prev.filter(h => !(h.title === item.title && h.message === item.message)));
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
        <h1 className="text-2xl font-bold tracking-tight">Quản lý Thông báo V2</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Gửi thông báo đẩy (Broadcast & Cá nhân hóa) với đa dạng thể loại và hỗ trợ thu hồi tin nhắn.
        </p>
      </div>

      <Tabs defaultValue="compose" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="compose" className="gap-2">
            <IconSend className="size-4" /> Soạn tin mới
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <IconHistory className="size-4" /> Lịch sử đã gửi
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
              <div className="space-y-3 p-4 bg-secondary/30 rounded-xl border">
                <Label className="font-semibold block text-sm">Đối tượng nhận thông báo:</Label>
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant={sendMode === "broadcast" ? "default" : "outline"}
                    onClick={() => { setSendMode("broadcast"); setSelectedUser(null); }}
                    className="gap-2 flex-1"
                  >
                    <IconUsers className="size-4" /> Tất cả mọi người
                  </Button>
                  <Button
                    type="button"
                    variant={sendMode === "targeted" ? "default" : "outline"}
                    onClick={() => setSendMode("targeted")}
                    className="gap-2 flex-1"
                  >
                    <IconUser className="size-4" /> Người dùng cụ thể
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
                  <Button variant="outline" size="sm" type="button" onClick={() => setLink("/account/order-history")} className="h-7 text-xs bg-background">
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
                              <img src={p.image_url || "https://placehold.co/40x40"} alt={p.name} className="size-8 rounded object-cover border shrink-0" />
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
            <CardHeader>
              <CardTitle>Lịch Sử Thông Báo Đã Gửi</CardTitle>
              <CardDescription>
                Danh sách các tin nhắn Admin từng gửi. Có thể ấn nút thu hồi để xóa khỏi toàn bộ tài khoản.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-32">Loại</TableHead>
                    <TableHead>Tiêu đề & Nội dung</TableHead>
                    <TableHead>Đính kèm</TableHead>
                    <TableHead>Thời gian gửi</TableHead>
                    <TableHead className="text-right w-16">Xóa</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingHistory ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center">
                        <IconLoader2 className="size-6 animate-spin mx-auto text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ) : history.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center text-muted-foreground text-sm">
                        Chưa có lịch sử gửi thông báo nào.
                      </TableCell>
                    </TableRow>
                  ) : (
                    history.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] whitespace-nowrap">
                            {getTypeName(item.type)}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <p className="font-semibold text-xs text-foreground">{item.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{item.message}</p>
                        </TableCell>
                        <TableCell>
                          {item.link ? (
                            <span className="font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded text-primary">
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
