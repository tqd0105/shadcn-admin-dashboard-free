# Technical Decisions Log

## 2026-06-25: Dynamic DB-driven Hero Banner Carousel & Admin Dnd Ordering

### Context
The storefront Home page previously contained hardcoded mock banner content in `HeroBanner` (`components/storefront/hero-banner.tsx`) and an obsolete secondary component `PromoBanners` (`components/storefront/promo-banners.tsx`). Meanwhile, a full backend service `banner.service.ts` and Supabase table `promo_banners` existed alongside an Admin management page `/dashboard/promo-banners`.

### Decision
1. **Consolidated Storefront Banner Architecture**: Removed `PromoBanners` component entirely to avoid promotional redundancy. Upgraded `HeroBanner` into a dynamic Ken Burns carousel fetching active promotions from `promo_banners` where `is_active = true`.
2. **Prevented Initial Data Flashing**: Initialized client banner state with an empty array `[]` and added a loading shimmer/spinner skeleton (`loadingBanners`) instead of initializing with static default mock data (`DEFAULT_BANNERS`).
3. **Integrated `@dnd-kit` for Admin Reordering**: Implemented `DndContext` and `SortableContext` with vertical list strategy in `/dashboard/promo-banners`. Dragging rows triggers array reordering and sequential updates to `order_index` saved in batch via `updatePromoBannerOrders`.
4. **Resolved JSX Accessibility Warnings**: Aliased `import { Image as ImageIcon } from "lucide-react"` to prevent conflicts with Next.js image JSX lint rules.

## 2026-06-25: Admin Orders Responsive Optimization, Safe Delete & Smart Search API

### Context
The Admin Orders page (`app/dashboard/orders/page.tsx`) suffered from horizontal layout crushing on mobile devices, lacked a safe deletion mechanism, and its backend search API `getOrders` (`order.service.ts`) used a dummy regex check that ignored search queries unless they were full 36-character UUIDs.

### Decision
1. **Mobile-First Responsive Orders UI**: Added `overflow-x-auto` and minimum table widths (`min-w-[700px]`) to prevent layout distortion on mobile screens. Refactored the Order Details Dialog grid from static 2-column to responsive stacked (`grid-cols-1 sm:grid-cols-2`) with text wrapping (`break-all`, `break-words`).
2. **Safe Order Deletion**: Added a trash icon action button triggering an `AlertDialog` confirmation. Implemented `deleteOrderAdmin` in `order.service.ts` which cleans up child `order_items` before deleting parent `orders` to maintain referential integrity.
3. **Smart Multi-Entity Order Search API**: Replaced the regex UUID filter with an in-memory partial match across order IDs and profile names/emails, allowing managers to search by 8-character short codes (e.g. `7505EEE3`) or customer names instantly.

## 2026-06-25: Bulletproof Symmetric View Transition for Color Mode via flushSync

### Context
The circular color transition animation in `ThemeToggle` (`components/storefront/theme-toggle.tsx`) worked when switching from Dark to Light, but failed when switching Light to Dark. This occurred because React 18+ automatic batching caused `setTheme('dark')` from `next-themes` to execute asynchronously. Consequently, `startViewTransition` captured identical Light-colored screenshots before React committed the DOM class change.

### Decision
1. **Synchronous React DOM Flushing (`flushSync`)**: Wrapped `setTheme(nextTheme)` inside `flushSync(...)` from `react-dom` inside the `document.startViewTransition` callback. This forces React to flush all pending updates and commit the new theme class (`dark` or `light`) to `<html className="...">` synchronously before the browser captures the New State snapshot.
2. **Symmetric Layer Animation**: Simplified `app/globals.css` to keep `::view-transition-new(root)` permanently on top (`z-index: 9999`). Both Dark-to-Light and Light-to-Dark transitions animate the circular wipe of the New State from the click coordinates outward.

### Consequences
- Flawless, symmetric 60fps circular wipe transitions across modern browsers in both directions.
- Eliminates React state batching race conditions during DOM capture.

## 2026-06-26: Customer Order Cancellation via RLS & Instant Dual Realtime Admin Sync

### Context
Customers clicking "Hủy đơn" encountered error `Cannot coerce the result to a single JSON object`, and successful order status updates did not reflect immediately on the Admin Orders table or global notifier.

### Decision
1. **Enabled Customer Order Cancellation via RLS**: Pushed policy `Users can update own orders` directly to the Supabase Cloud Postgres DB (`supabase db push`), keeping established project architecture clean without introducing new folder patterns (`lib/actions`). Simplified `updateOrderStatus` in `order.service.ts`.
2. **Instant Dual Realtime Admin Sync**: Integrated both Supabase Broadcast Channels (`global-admin-orders-notifier`) and same-browser `BroadcastChannel` (`admin_orders_channel`) into `updateOrderStatus`. Admin Orders table (`/dashboard/orders`) and Live Bell (`AdminRealtimeNotifier`) instantly trigger on status updates.

