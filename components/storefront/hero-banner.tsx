import { getPromoBanners, PromoBanner } from "@/lib/services/banner.service";
import { getFeaturedCoupon } from "@/lib/services/coupon.service";
import { HeroBannerClient } from "@/components/storefront/hero-banner-client";

const FALLBACK_BANNERS: PromoBanner[] = [
  {
    id: "fallback-banner-1",
    title: "Bộ Sưu Tập\nThời Trang Cao Cấp",
    description: "Khám phá những mẫu thiết kế độc quyền với chất lượng vượt trội, tôn vinh phong cách sang trọng và đẳng cấp của bạn.",
    image_url: "/seo.jpg",
    link_url: "/products",
    badge_text: "MỚI RA MẮT 2026",
    order_index: 1,
    is_active: true,
  },
];

export async function HeroBanner() {
  // Tải dữ liệu trực tiếp trên máy chủ Next.js (Server-Side Fetching song song)
  // Loại bỏ hoàn toàn mọi độ trễ client-side (0s Spinner, 0s Skeleton, 0s Flashing)
  const [bannerRes, couponRes] = await Promise.all([
    getPromoBanners().catch(() => ({ data: null })),
    getFeaturedCoupon().catch(() => ({ data: null })),
  ]);

  const banners = bannerRes && bannerRes.data && bannerRes.data.length > 0
    ? bannerRes.data
    : FALLBACK_BANNERS;

  const coupon = couponRes && couponRes.data ? couponRes.data : null;

  return <HeroBannerClient initialBanners={banners} initialCoupon={coupon} />;
}

