import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getPromoBanners } from "@/lib/services/banner.service";

export async function PromoBanners() {
  const { data: banners } = await getPromoBanners();

  if (!banners || banners.length === 0) return null;

  return (
    <section className="py-10 bg-background">
      <div className="max-w-7xl mx-auto px-4 md:px-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {banners.map((banner) => (
            <div key={banner.id} className="relative rounded-3xl overflow-hidden group h-[300px] md:h-[350px]">
              <img 
                src={banner.image_url} 
                alt={banner.title} 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
              <div className="absolute bottom-0 left-0 p-8 w-full z-10">
                {banner.badge_text && (
                  <span className={`inline-block px-3 py-1 ${banner.badge_color === 'white' ? 'bg-white text-black' : 'bg-red-500 text-white'} text-xs font-bold uppercase tracking-wider rounded-full mb-3 shadow-sm`}>
                    {banner.badge_text}
                  </span>
                )}
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">{banner.title}</h3>
                {banner.description && (
                  <p className="text-gray-200 mb-6 max-w-[280px] text-sm md:text-base">{banner.description}</p>
                )}
                {banner.link_url && (
                  <Link href={banner.link_url} className="inline-flex items-center text-white font-semibold hover:text-primary transition-colors">
                    Khám phá ngay <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
