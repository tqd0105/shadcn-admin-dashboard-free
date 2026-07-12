"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Star, CheckCircle2, MessageSquarePlus, Sparkles, ShieldCheck, ThumbsUp, UserCircle2 } from "lucide-react";
import { ProductReviewModal } from "@/components/storefront/product-review-modal";

interface Spec {
  id: string;
  spec_name: string;
  spec_value: string;
}

interface Review {
  id: string;
  user_id: string | null;
  rating: number;
  comment: string;
  created_at: string;
  user_name?: string;
}

interface ProductTabsProps {
  productId: string;
  description: string;
  specs: Spec[];
  reviews: Review[];
  productName?: string;
  productImage?: string;
}

export function ProductTabs({ productId, description, specs, reviews, productName, productImage }: ProductTabsProps) {
  const [activeTab, setActiveTab] = useState<"desc" | "specs" | "reviews">("desc");
  const [selectedFilter, setSelectedFilter] = useState<number | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  
  return (
    <div className="mt-16 border border-outline-variant rounded-lg bg-surface-container-lowest overflow-hidden">
      <div className="flex w-full overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden border-b border-outline-variant bg-surface-container-low">
        <button
          className={cn(
            "flex-1 shrink-0 py-3.5 sm:py-4 px-2 sm:px-4 text-xs sm:text-lg transition-colors text-center whitespace-nowrap",
            activeTab === "desc"
              ? "font-semibold text-primary border-b-2 border-primary bg-surface-container-lowest"
              : "font-medium text-on-surface-variant border-b-2 border-transparent hover:text-primary"
          )}
          onClick={() => setActiveTab("desc")}
        >
          <span className="sm:hidden">Mô tả</span>
          <span className="hidden sm:inline">Mô tả sản phẩm</span>
        </button>
        <button
          className={cn(
            "flex-1 shrink-0 py-3.5 sm:py-4 px-2 sm:px-4 text-xs sm:text-lg transition-colors text-center whitespace-nowrap",
            activeTab === "specs"
              ? "font-semibold text-primary border-b-2 border-primary bg-surface-container-lowest"
              : "font-medium text-on-surface-variant border-b-2 border-transparent hover:text-primary"
          )}
          onClick={() => setActiveTab("specs")}
        >
          <span className="sm:hidden">Thông số</span>
          <span className="hidden sm:inline">Thông số kỹ thuật</span>
        </button>
        <button
          className={cn(
            "flex-1 shrink-0 py-3.5 sm:py-4 px-2 sm:px-4 text-xs sm:text-lg transition-colors text-center whitespace-nowrap",
            activeTab === "reviews"
              ? "font-semibold text-primary border-b-2 border-primary bg-surface-container-lowest"
              : "font-medium text-on-surface-variant border-b-2 border-transparent hover:text-primary"
          )}
          onClick={() => setActiveTab("reviews")}
        >
          Đánh giá ({reviews?.length || 0})
        </button>
      </div>

      <div className="p-8">
        {/* Description Tab */}
        {activeTab === "desc" && (
          <div className="space-y-6">
            <div
              className="prose dark:prose-invert max-w-none text-muted-foreground prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-a:text-primary [&_*]:dark:!text-gray-300 [&_h1,&_h2,&_h3,&_h4,&_strong,&_b]:dark:!text-white font-body-md text-body-md"
              dangerouslySetInnerHTML={{ __html: description || "<p>Chưa có mô tả chi tiết cho sản phẩm này.</p>" }}
            />
          </div>
        )}

        {/* Specs Tab */}
        {activeTab === "specs" && (
          <div>
            {!specs || specs.length === 0 ? (
              <p className="text-on-surface-variant font-body-md text-body-md">Chưa có thông số kỹ thuật nào.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {specs.map((spec) => (
                  <div key={spec.id} className="flex justify-between py-2 border-b border-outline-variant/50 gap-4">
                    <span className="font-label-md text-label-md text-on-surface-variant whitespace-nowrap">{spec.spec_name}</span>
                    <span className="font-body-md text-body-md text-on-surface font-medium text-right">{spec.spec_value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === "reviews" && (
          <div className="space-y-10 animate-in fade-in duration-300">
            {/* 1. Rating Overview & Distribution Panel */}
            <div className="bg-card/90 rounded-2xl border border-border/70 p-6 sm:p-8 shadow-2xs">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                {/* Left: Big Score Display */}
                <div className="md:col-span-4 flex flex-col items-center md:items-start justify-center border-b md:border-b-0 md:border-r border-border/60 pb-6 md:pb-0 md:pr-8 text-center md:text-left">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl sm:text-6xl font-extrabold tracking-tight text-foreground">
                      {reviews?.length ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1) : "5.0"}
                    </span>
                    <span className="text-lg font-medium text-muted-foreground">/ 5</span>
                  </div>
                  <div className="flex items-center gap-1 mt-2.5">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const avg = reviews?.length ? reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length : 5;
                      return (
                        <Star
                          key={star}
                          className={`size-5 ${
                            star <= Math.round(avg)
                              ? "text-amber-400 fill-amber-400"
                              : "text-muted-foreground/20"
                          }`}
                        />
                      );
                    })}
                  </div>
                  <p className="text-xs font-medium text-muted-foreground mt-2">
                    {reviews?.length ? `Dựa trên ${reviews.length} đánh giá thực tế` : "Chưa có đánh giá nào"}
                  </p>
                </div>

                {/* Middle: Rating Breakdown Progress Bars */}
                <div className="md:col-span-5 space-y-2.5">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const total = reviews?.length || 0;
                    const count = total ? reviews.filter((r) => r.rating === star).length : 0;
                    const percent = total ? Math.round((count / total) * 100) : 0;
                    return (
                      <div key={star} className="flex items-center gap-3 text-xs">
                        <span className="w-12 font-semibold text-foreground flex items-center gap-1 shrink-0">
                          {star} <Star className="size-3 text-amber-400 fill-amber-400" />
                        </span>
                        <div className="flex-1 h-2 rounded-full bg-secondary/80 overflow-hidden">
                          <div
                            className="h-full bg-amber-400 transition-all duration-500 rounded-full"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="w-9 text-right font-medium text-muted-foreground shrink-0">
                          {percent}%
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Right: Write Review CTA */}
                <div className="md:col-span-3 flex flex-col items-center md:items-end justify-center pt-4 md:pt-0 border-t md:border-t-0 border-border/60 md:pl-6">
                  <button
                    type="button"
                    onClick={() => setIsReviewModalOpen(true)}
                    className="w-full sm:w-auto px-6 py-3 rounded-full bg-foreground text-background hover:bg-foreground/90 font-semibold text-xs transition-all shadow-sm flex items-center justify-center gap-2 active:scale-95"
                  >
                    <Sparkles className="size-3.5" /> Viết đánh giá
                  </button>
                  <span className="text-[11px] text-muted-foreground mt-2 text-center md:text-right block">
                    Chia sẻ trải nghiệm của bạn
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Filter Bar */}
            {reviews && reviews.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-border/60">
                <span className="text-xs font-semibold text-muted-foreground shrink-0 mr-1">Lọc theo:</span>
                <button
                  type="button"
                  onClick={() => setSelectedFilter(null)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 ${
                    selectedFilter === null
                      ? "bg-primary text-primary-foreground shadow-2xs"
                      : "bg-secondary/70 text-secondary-foreground hover:bg-secondary"
                  }`}
                >
                  Tất cả ({reviews.length})
                </button>
                {[5, 4, 3].map((star) => {
                  const count = reviews.filter((r) => r.rating === star).length;
                  if (count === 0 && star !== 5) return null;
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setSelectedFilter(star)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 flex items-center gap-1 ${
                        selectedFilter === star
                          ? "bg-primary text-primary-foreground shadow-2xs"
                          : "bg-secondary/70 text-secondary-foreground hover:bg-secondary"
                      }`}
                    >
                      {star} Sao ({count})
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setSelectedFilter(0)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 ${
                    selectedFilter === 0
                      ? "bg-primary text-primary-foreground shadow-2xs"
                      : "bg-secondary/70 text-secondary-foreground hover:bg-secondary"
                  }`}
                >
                  1 - 2 Sao ({reviews.filter((r) => r.rating <= 2).length})
                </button>
              </div>
            )}

            {/* 3. Authentic Customer Reviews List */}
            <div className="space-y-6">
              {!reviews || reviews.length === 0 ? (
                <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-border/80 bg-muted/10 space-y-3">
                  <div className="size-12 rounded-full bg-secondary flex items-center justify-center mx-auto text-muted-foreground">
                    <Star className="size-6 text-amber-500/60" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-semibold text-base text-foreground">Chưa có đánh giá nào</h4>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                      Bạn có thể là người đầu tiên trải nghiệm và chia sẻ nhận xét thực tế về sản phẩm này.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsReviewModalOpen(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-foreground text-background hover:bg-foreground/90 text-xs font-semibold transition-all shadow-2xs mt-3"
                  >
                    Viết nhận xét đầu tiên
                  </button>
                </div>
              ) : (
                (() => {
                  const filtered = reviews.filter((r) => {
                    if (selectedFilter === null) return true;
                    if (selectedFilter === 0) return r.rating <= 2;
                    return r.rating === selectedFilter;
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="text-center py-12 text-xs text-muted-foreground">
                        Không tìm thấy đánh giá nào với bộ lọc đã chọn.
                      </div>
                    );
                  }

                  return (
                    <div className="divide-y divide-border/60">
                      {filtered.map((review) => {
                        const userName = review.user_name || "Khách hàng mua thực tế";
                        const initials = userName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(-2)
                          .toUpperCase();

                        return (
                          <div key={review.id} className="py-6 first:pt-2 space-y-3">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-center gap-3">
                                <div className="size-10 rounded-full bg-secondary/80 text-secondary-foreground font-semibold flex items-center justify-center text-xs shrink-0 border border-border/40">
                                  {initials || "KH"}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-sm text-foreground">
                                      {userName}
                                    </span>
                                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                      <ShieldCheck className="size-3 text-emerald-600 dark:text-emerald-400" /> Đã mua hàng
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1 mt-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Star
                                        key={star}
                                        className={`size-3.5 ${
                                          star <= review.rating
                                            ? "text-amber-400 fill-amber-400"
                                            : "text-muted-foreground/20"
                                        }`}
                                      />
                                    ))}
                                  </div>
                                </div>
                              </div>
                              <span className="text-xs font-normal text-muted-foreground shrink-0">
                                {new Date(review.created_at).toLocaleDateString("vi-VN")}
                              </span>
                            </div>

                            <p className="text-sm text-foreground/90 font-normal leading-relaxed pl-13">
                              {review.comment}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()
              )}
            </div>
          </div>
        )}
      </div>

      {/* Product Review Modal (được gọi từ nút trên Top Dashboard) */}
      <ProductReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        item={{
          productId,
          productName: productName || "Sản phẩm đang xem",
          productImage
        }}
        onSuccess={() => window.location.reload()}
      />
    </div>
  );
}
