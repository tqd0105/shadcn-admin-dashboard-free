import { Metadata } from "next";
import { generateMeta } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata>{
  return generateMeta({
    title: "Dashboard",
    description: "LuxeCommerce Admin Dashboard",
  });
}

export default function Page() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Tổng quan</h1>
      </div>
      <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
        <p className="text-muted-foreground">Chào mừng bạn đến với trang quản trị LuxeCommerce. Tính năng thống kê đang được phát triển.</p>
      </div>
    </div>
  )
}
