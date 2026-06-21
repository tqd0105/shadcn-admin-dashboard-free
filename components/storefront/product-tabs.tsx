"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

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
}

interface ProductTabsProps {
  description: string;
  specs: Spec[];
  reviews: Review[];
}

export function ProductTabs({ description, specs, reviews }: ProductTabsProps) {
  const [activeTab, setActiveTab] = useState<"desc" | "specs" | "reviews">("desc");

  return (
    <div className="mt-16 border border-outline-variant rounded-lg bg-surface-container-lowest overflow-hidden">
      <div className="flex border-b border-outline-variant bg-surface-container-low flex-wrap">
        <button
          className={cn(
            "flex-1 py-4 font-label-md text-label-md transition-colors min-w-[120px]",
            activeTab === "desc"
              ? "font-semibold text-primary border-b-2 border-primary bg-surface-container-lowest"
              : "font-medium text-on-surface-variant border-b-2 border-transparent hover:text-primary"
          )}
          onClick={() => setActiveTab("desc")}
        >
          Mô tả sản phẩm
        </button>
        <button
          className={cn(
            "flex-1 py-4 font-label-md text-label-md transition-colors min-w-[120px]",
            activeTab === "specs"
              ? "font-semibold text-primary border-b-2 border-primary bg-surface-container-lowest"
              : "font-medium text-on-surface-variant border-b-2 border-transparent hover:text-primary"
          )}
          onClick={() => setActiveTab("specs")}
        >
          Thông số kỹ thuật
        </button>
        <button
          className={cn(
            "flex-1 py-4 font-label-md text-label-md transition-colors min-w-[120px]",
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
              className="prose max-w-none text-on-surface-variant font-body-md text-body-md"
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
          <div className="space-y-6">
            {!reviews || reviews.length === 0 ? (
              <p className="text-on-surface-variant font-body-md text-body-md">Chưa có đánh giá nào cho sản phẩm này.</p>
            ) : (
              <>
                <div className="flex items-center space-x-6 mb-6">
                  <div className="text-display-lg text-on-surface font-bold">
                    {(reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1)}
                  </div>
                  <div>
                    <div className="flex text-yellow-500 mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star} className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      ))}
                    </div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Dựa trên {reviews.length} đánh giá</span>
                  </div>
                </div>
                
                <div className="space-y-4 border-t border-outline-variant/50 pt-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="bg-surface p-4 rounded-lg border border-outline-variant/30">
                      <div className="flex justify-between mb-2">
                        <span className="font-label-md text-label-md font-semibold text-on-surface">
                          Khách hàng
                        </span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">
                          {new Date(review.created_at).toLocaleDateString("vi-VN")}
                        </span>
                      </div>
                      <div className="flex text-yellow-500 mb-2 text-[14px]">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className="material-symbols-outlined text-[14px]"
                            style={{ fontVariationSettings: star <= review.rating ? "'FILL' 1" : "'FILL' 0" }}
                          >
                            star
                          </span>
                        ))}
                      </div>
                      <p className="font-body-md text-body-md text-on-surface-variant">{review.comment}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
