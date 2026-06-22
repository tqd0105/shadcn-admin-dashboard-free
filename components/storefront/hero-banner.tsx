import { ArrowRight, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export function HeroBanner() {
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

      <div className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-4 md:px-10 flex flex-col justify-center items-start py-20">
        <div className="max-w-xl animate-fade-in-up">
          <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-white text-xs font-semibold uppercase tracking-widest mb-6 border border-white/20">
            Bộ sưu tập mới 2024
          </span>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Chuyển động của <br /><span className="text-indigo-400">Sự Hoàn Mỹ</span>
          </h1>
          <p className="text-lg text-gray-300 mb-10 max-w-md">
            Khám phá thiết kế tinh giản kết hợp công nghệ đỉnh cao. Trải nghiệm chuẩn mực mới của sự sang trọng đương đại.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button size="lg" className="rounded-full px-8 py-6 text-base shadow-lg hover:scale-105 transition-transform">
              Khám phá ngay
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button size="lg" variant="outline" className="glass-panel text-white border-white/30 rounded-full px-8 py-6 text-base hover:bg-white/20 transition-all">
              Xem Video
              <PlayCircle className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
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
