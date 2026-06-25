import { HeroBanner } from "@/components/storefront/hero-banner";
import { FlashSale } from "@/components/storefront/flash-sale";
import { CategoriesSection } from "@/components/storefront/categories-section";
import { NewArrivals } from "@/components/storefront/new-arrivals";

export default function StorefrontHomePage() {
  return (
    <>
      <HeroBanner />
      <CategoriesSection />
      <NewArrivals />
      <FlashSale />
    </>
  );
}
