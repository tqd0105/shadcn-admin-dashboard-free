"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  RefreshCw,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Calendar,
  FileSpreadsheet,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";
import { getDashboardStats, DashboardStats } from "@/lib/services/dashboard.service";
import { cn } from "@/lib/utils";

interface DashboardViewProps {
  initialStats: DashboardStats;
}

export function DashboardView({ initialStats }: DashboardViewProps) {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchRealData = useCallback(async () => {
    setIsRefreshing(true);
    const data = await getDashboardStats();
    setStats(data);
    setIsRefreshing(false);
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      fetchRealData();
    });
  }, [fetchRealData]);

  const handleRefresh = () => {
    fetchRealData();
    router.refresh();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> Đã thanh toán
          </span>
        );
      case "delivered":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 border border-blue-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> Đã giao hàng
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20 animate-pulse">
            <Clock className="w-3.5 h-3.5" /> Chờ xác nhận
          </span>
        );
      case "shipping":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-600 border border-purple-500/20">
            <Clock className="w-3.5 h-3.5" /> Đang giao
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-500/10 text-gray-600 border border-gray-500/20">
            {status || "Đã hủy"}
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in-50 duration-500">
      {/* 1. Header & Nút thao tác */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-primary/10 via-background to-secondary/20 border border-border/60 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-1 z-10">
          {/* <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Trung Tâm Điều Hành LuxeCommerce
          </div> */}
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Tổng quan kinh doanh
          </h1>
          <p className="text-sm text-muted-foreground">
            Cập nhật số liệu thời gian thực và theo dõi dòng tiền hệ thống.
          </p>
        </div>

        <div className="flex items-center gap-3 z-10">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="rounded-xl font-semibold shadow-sm hover:border-primary/50 transition-all"
          >
            <RefreshCw
              className={cn("w-4 h-4 mr-2 text-primary", isRefreshing && "animate-spin")}
            />
            Làm mới số liệu
          </Button>
          {/* <Button
            size="sm"
            className="rounded-xl font-semibold shadow-md shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground transition-all"
            onClick={() => alert("Chức năng xuất báo cáo PDF/Excel đang được tổng hợp!")}
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Xuất báo cáo
          </Button> */}
        </div>
      </div>

      {/* 2. 4 Lưới Chỉ Số KPI (Metric Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Thẻ 1: Doanh thu */}
        <div className="p-6 rounded-2xl bg-card border border-border/60 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-muted-foreground">Doanh thu ròng</span>
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold shadow-inner">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              {formatCurrency(stats.totalRevenue)}
            </h3>
            <div className={cn(
              "flex items-center gap-1.5 text-xs font-semibold pt-1",
              (stats.revenueGrowth || 0) >= 0 ? "text-emerald-600" : "text-rose-600"
            )}>
              <TrendingUp className={cn("w-4 h-4", (stats.revenueGrowth || 0) < 0 && "rotate-180")} />
              <span>
                {(stats.revenueGrowth || 0) >= 0 ? `+${stats.revenueGrowth || 0}%` : `${stats.revenueGrowth}%`} so với 7 ngày trước
              </span>
            </div>
          </div>
        </div>

        {/* Thẻ 2: Đơn hàng */}
        <div className="p-6 rounded-2xl bg-card border border-border/60 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-blue-500/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-muted-foreground">Tổng đơn hàng</span>
            <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold shadow-inner">
              <ShoppingCart className="w-6 h-6" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              {stats.totalOrders} <span className="text-sm font-normal text-muted-foreground">đơn</span>
            </h3>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 pt-1">
              <Clock className="w-4 h-4 animate-pulse" />
              <span>{stats.pendingOrders} đơn mới chờ duyệt</span>
            </div>
          </div>
        </div>

        {/* Thẻ 3: Khách hàng */}
        <div className="p-6 rounded-2xl bg-card border border-border/60 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-purple-500/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-muted-foreground">Khách hàng thành viên</span>
            <div className="w-11 h-11 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold shadow-inner">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              {stats.totalCustomers} <span className="text-sm font-normal text-muted-foreground">tài khoản</span>
            </h3>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-600 pt-1">
              <Sparkles className="w-4 h-4" />
              <span>Cộng đồng mua sắm tích cực</span>
            </div>
          </div>
        </div>

        {/* Thẻ 4: Sản phẩm */}
        <div className="p-6 rounded-2xl bg-card border border-border/60 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-orange-500/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-muted-foreground">Sản phẩm niêm yết</span>
            <div className="w-11 h-11 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center font-bold shadow-inner">
              <Package className="w-6 h-6" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              {stats.totalProducts} <span className="text-sm font-normal text-muted-foreground">sản phẩm</span>
            </h3>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground pt-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Kho hàng đang sẵn sàng</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Khu vực Biểu đồ & Đơn hàng mới nhất */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Biểu đồ Recharts */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-card border border-border/60 shadow-sm space-y-6 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-extrabold text-foreground flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" /> Xu hướng doanh thu 7 ngày qua
              </h2>
              <p className="text-xs text-muted-foreground">
                Đồ thị thể hiện dòng tiền từ các đơn hàng thành công theo thời gian
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" /> Doanh thu (₫)
              </span>
            </div>
          </div>

          <div className="w-full h-[320px] pt-4">
            {stats.chartData && stats.chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={stats.chartData}
                  margin={{ top: 10, right: 10, left: 20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#88888820" vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                  />
                  <Tooltip
                    formatter={(value: any) => [formatCurrency(Number(value || 0)), "Doanh thu"]}
                    labelStyle={{ fontWeight: "bold", color: "#111827" }}
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.95)",
                      borderRadius: "12px",
                      border: "1px solid #e5e7eb",
                      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10b981"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                Chưa có dữ liệu giao dịch gần đây
              </div>
            )}
          </div>
        </div>

        {/* Danh sách 5 đơn hàng mới nhất */}
        <div className="lg:col-span-1 p-6 rounded-2xl bg-card border border-border/60 shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-foreground">Đơn hàng mới nhất</h2>
              <Link
                href="/dashboard/orders"
                className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
              >
                Xem tất cả <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <p className="text-xs text-muted-foreground">
              Các đơn hàng mới được đặt cần xử lý kịp thời
            </p>
          </div>

          <div className="space-y-4 divide-y divide-border/40">
            {stats.recentOrders && stats.recentOrders.length > 0 ? (
              stats.recentOrders.map((order: any) => {
                const customerName =
                  order.profiles?.full_name || order.profiles?.email?.split("@")[0] || "Khách hàng";
                return (
                  <div key={order.id} className="pt-4 first:pt-0 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 uppercase text-sm">
                        {customerName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">
                          {customerName}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-sm font-extrabold text-foreground">
                        {formatCurrency(Number(order.total_amount) || 0)}
                      </p>
                      <div className="mt-1">{getStatusBadge(order.status)}</div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center text-sm text-muted-foreground">
                Chưa có đơn hàng nào
              </div>
            )}
          </div>

          <Button asChild className="w-full rounded-xl font-bold mt-auto" variant="secondary">
            <Link href="/dashboard/orders">Quản lý toàn bộ đơn hàng</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
