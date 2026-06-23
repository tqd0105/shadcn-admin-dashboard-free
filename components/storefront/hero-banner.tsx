"use client";

import { ArrowRight, PlayCircle, CheckCircle2, ShoppingCart, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useState } from "react";

export function HeroBanner() {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText("HOANMY2026");
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 3000);
  };

  return (
    <section className="relative min-h-[calc(100vh-5rem)] w-full bg-secondary overflow-hidden flex flex-col">
      <div className="absolute inset-0 z-0">
        <img
          alt="Hero Image"
          className="w-full h-full object-cover object-center"
          src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1999&auto=format&fit=crop"
        />
        <div className="absolute  inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent"></div>
      </div>

      <div className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-4 md:px-10 flex flex-col lg:flex-row items-center justify-between gap-12 py-20 mt-10 md:mt-0">
        
        {/* Lẽft Content */}
        <div className="w-full lg:w-1/2 animate-fade-in-up z-20">
          <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-white text-xs font-semibold uppercase tracking-widest mb-6 border border-white/20">
            Bộ sưu tập mới 2026
          </span>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Chuyển động của <br /><span className="text-indigo-400">Sự Hoàn Mỹ</span>
          </h1>
          <p className="text-lg text-gray-300 mb-8 max-w-md">
            Khám phá thiết kế tinh giản kết hợp công nghệ đỉnh cao. Trải nghiệm chuẩn mực mới của sự sang trọng đương đại.
          </p>
          
          {/* Promo Code Box */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-2 flex items-center justify-between max-w-sm shadow-2xl">
            <div className="flex flex-col px-4">
              <span className="text-gray-300 text-xs uppercase tracking-wider mb-1">Mã giảm 20%</span>
              <span className="text-white font-mono font-bold tracking-widest text-lg">HOANMY2026</span>
            </div>
            <Button 
              onClick={handleCopyCode} 
              className={`rounded-xl px-6 py-5 font-semibold transition-colors ${
                isCopied 
                  ? "bg-green-500 hover:bg-green-600 text-white" 
                  : "bg-indigo-500 hover:bg-indigo-600 text-white"
              }`}
            >
              {isCopied ? <><CheckCircle2 className="w-5 h-5 mr-1" /> Đã chép</> : "Copy Mã"}
            </Button>
          </div>
          <p className="text-xs text-gray-400 mt-3 ml-2 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-green-400" /> Áp dụng ngay tại trang thanh toán.
          </p>
        </div>

        {/* <div className="w-full lg:w-1/2 flex justify-center lg:justify-end animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            
            
            <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 p-4 rounded-2xl shadow-2xl flex flex-col gap-4 w-[280px] md:w-[320px] transform transition-transform duration-500 hover:-translate-y-2">
              <div className="w-full h-48 md:h-56 rounded-xl overflow-hidden bg-white/5 relative">
                <img 
                  src="https://images.unsplash.com/photo-1546868871-7041f2a55e12?q=80&w=800&auto=format&fit=crop" 
                  alt="Apple Watch Ultra" 
                  className="w-full h-full object-cover object-center transform transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg">
                  HOT DEAL
                </div>
              </div>
              <div className="flex flex-col gap-1 px-1">
                <h3 className="text-white font-semibold text-lg">Smartwatch Ultra Pro</h3>
                <div className="flex justify-between items-end mt-1">
                  <div>
                    <p className="text-gray-400 text-sm line-through">12.500.000₫</p>
                    <p className="text-indigo-400 font-bold text-xl">9.990.000₫</p>
                  </div>
                  <Link href="/products" className="bg-white text-black p-3 rounded-full hover:bg-indigo-100 transition-colors shadow-lg">
                    <ShoppingCart className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div> */}

      </div>

      {/* Carousel Indicators */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-3 z-20">
        <button aria-label="Slide 1" className="w-12 h-1 bg-white rounded-full"></button>
        <button aria-label="Slide 2" className="w-4 h-1 bg-white/40 rounded-full hover:bg-white/60 transition-colors"></button>
        <button aria-label="Slide 3" className="w-4 h-1 bg-white/40 rounded-full hover:bg-white/60 transition-colors"></button>
      </div>
    </section>
  );
}
