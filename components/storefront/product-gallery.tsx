"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface ImageItem {
  id: string;
  image_url: string;
}

interface ProductGalleryProps {
  images: ImageItem[];
  productName: string;
  discountPercent?: number | null;
}

export function ProductGallery({ images, productName, discountPercent }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const hasDiscount = (discountPercent ?? 0) > 0;

  if (!images || images.length === 0) {
    return (
      <div className="relative rounded-xl overflow-hidden border border-outline-variant bg-secondary/20 group aspect-square flex items-center justify-center">
        {hasDiscount && (
          <Badge className="absolute top-4 left-4 z-10 bg-red-600 hover:bg-red-700 pointer-events-none text-white font-extrabold px-3 py-1 text-sm shadow-md">
            -{discountPercent}%
          </Badge>
        )}
        <Image
          fill
          unoptimized
          alt={productName}
          className="object-contain p-6 transition-transform duration-500 group-hover:scale-105"
          src="/placeholder-image.jpg"
        />
      </div>
    );
  }

  const mainImage = images[activeIndex];

  return (
    <div className="flex flex-col space-y-4">
      {/* Main Image */}
      <div className="relative rounded-xl overflow-hidden border border-outline-variant bg-secondary/20 group aspect-square flex items-center justify-center">
        {hasDiscount && (
          <Badge className="absolute top-4 left-4 z-10 bg-red-600 hover:bg-red-700 pointer-events-none text-white font-extrabold px-3 py-1 text-sm shadow-md">
            -{discountPercent}%
          </Badge>
        )}
        <Image
          fill
          unoptimized
          alt={productName}
          className="object-contain p-6 transition-transform duration-500 group-hover:scale-105"
          src={mainImage.image_url}
        />
        {/* <button
          aria-label="Zoom Image"
          className="absolute top-4 right-4 bg-surface-container-lowest/80 backdrop-blur-md p-2 rounded-full shadow-sm text-on-surface hover:text-primary transition-colors flex items-center justify-center"
        >
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 0" }}>zoom_in</span>
        </button> */}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex space-x-4 overflow-x-auto hide-scrollbar pb-2">
          {images.map((image, index) => (
            <button
              key={image.id}
              onClick={() => setActiveIndex(index)}
              className={cn(
                "flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border-2 transition-colors relative bg-secondary/20",
                activeIndex === index
                  ? "border-primary"
                  : "border-transparent hover:border-outline-variant"
              )}
            >
              <Image
                width={96}
                height={96}
                unoptimized
                alt={`${productName} thumbnail ${index + 1}`}
                className="w-full h-full object-contain p-1.5"
                src={image.image_url}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
