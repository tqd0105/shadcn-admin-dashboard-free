# Technical Decisions Log

## 2026-06-25: Dynamic DB-driven Hero Banner Carousel & Admin Dnd Ordering

### Context
The storefront Home page previously contained hardcoded mock banner content in `HeroBanner` (`components/storefront/hero-banner.tsx`) and an obsolete secondary component `PromoBanners` (`components/storefront/promo-banners.tsx`). Meanwhile, a full backend service `banner.service.ts` and Supabase table `promo_banners` existed alongside an Admin management page `/dashboard/promo-banners`.

### Decision
1. **Consolidated Storefront Banner Architecture**: Removed `PromoBanners` component entirely to avoid promotional redundancy. Upgraded `HeroBanner` into a dynamic cinematic Ken Burns carousel fetching active promotions from `promo_banners` where `is_active = true`.
2. **Prevented Initial Data Flashing**: Initialized client banner state with an empty array `[]` and added an elegant loading shimmer/spinner skeleton (`loadingBanners`) instead of initializing with static default mock data (`DEFAULT_BANNERS`).
3. **Integrated `@dnd-kit` for Admin Reordering**: Implemented `DndContext` and `SortableContext` with vertical list strategy in `/dashboard/promo-banners`. Dragging rows triggers array reordering and sequential updates to `order_index` saved in batch via `updatePromoBannerOrders`.
4. **Resolved JSX Accessibility Warnings**: Aliased `import { Image as ImageIcon } from "lucide-react"` to prevent conflicts with Next.js image JSX lint rules.

### Consequences
- Admin promotional campaigns instantly reflect on the storefront storefront banner.
- Zero client-side dummy flash or layout shift on reload.
- Intuitive drag-and-drop workflow for merchandising managers.
