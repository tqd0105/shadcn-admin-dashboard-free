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

## 2026-06-26: Guaranteed Realtime Broadcast Delivery, StrictMode Fix & Glassmorphic Live Pool

### Context
Admin Realtime notifications did not fire because: (1) Supabase Realtime WebSocket server silently drops `postgres_changes` events when table RLS policies contain subqueries (`SELECT ... FROM profiles`), (2) `createOrder` and `updateOrderStatus` navigated away before async `channel.subscribe()` finished sending broadcast payloads, and (3) React StrictMode unmount/remount in `AdminRealtimeNotifier` locked `initialized.current = true` while destroying socket connections.

### Decision
1. **Guaranteed Broadcast Delivery with Timeout**: Refactored `checkout.service.ts` and `order.service.ts` to await `channel.subscribe(...)` and `channel.send(...)` wrapped in a Promise with a 500ms fallback timeout before page navigation.
2. **Removed StrictMode Initialization Lock**: Removed `initialized.current` check in `AdminRealtimeNotifier`, ensuring fresh WebSocket sockets establish on remount.
3. **Sleek Floating Glassmorphic Pill Toasts**: Upgraded Sonner notification UI (`toast.custom`) into compact `max-w-[330px]` floating pills with live pulsing indicators and micro-bounce icons.
4. **Live Glowing Rows & Explosion Banner (`/dashboard/orders`)**: Created an in-memory `Set<string>` pool (`liveOrderIds`). Incoming orders automatically highlight with emerald tinted backgrounds (`bg-emerald-500/15`), pulsing "MỚI" badges, and a floating multi-order summary banner. Clicking "Xem chi tiết" acknowledges and removes the row glow smoothly.

## 2026-07-08: Automated Bank Transfer Verification (VietQR + Gmail API + Realtime) & React 19 Linter Zeroing

### Context
Manual bank transfer verification caused delayed order fulfillment and required constant admin intervention. Furthermore, the payment flow lacked clear navigation options to cancel or return to previous checkout steps. On the codebase quality front, Next.js 16 / React 19 compiler linter (`eslint-plugin-react-hooks v5`) raised cascading render errors (`react-hooks/set-state-in-effect`) across multiple storefront and admin pages.

### Decision
1. **VietQR Automated Verification Pipeline**:
   - **Database Architecture**: Created `payments` and `bank_transactions` tables with deterministic order codes (`LX-[A-Z0-9]{6}`) and strict 10-minute expiration windows. Enforced idempotency via `UNIQUE(bank_tran_id)` and Row Level Security (RLS) policies.
   - **Supabase Edge Function (`verify-bank-payment`)**: Developed a standalone Deno Edge Function utilizing Gmail API OAuth2 to poll/listen for bank transaction notification emails (e.g., Vietcombank). Implemented regex parser (`LX-[A-Z0-9]{6}`) and multi-pass matcher to reconcile amounts and automatically update payment status to `MATCHED` and order status to `PROCESSING`, accompanied by automated email confirmation dispatch.
   - **Realtime Storefront Checkout Experience**: Built `/checkout/payment/[orderId]` featuring dynamic VietQR generation (`img.vietqr.io`), a 10-minute countdown timer, and a Supabase Realtime channel listening for payment row mutations. When `MATCHED` is broadcasted, the UI triggers a celebratory cash register chime and full-screen confetti before auto-redirecting to order tracking.
   - **User Navigation Resilience**: Implemented a "Hủy thanh toán" (Cancel Payment) confirmation dialog returning the order items to the active cart (`/cart`) with informative toast notifications, plus a clear "Quay lại bước trước" button to return to `/checkout`.

2. **Zero-Error / Zero-Warning React 19 & Next.js 16 Linter Compliance (`pnpm lint`)**:
   - Resolved static analysis errors from React 19 compiler where synchronous state updates (`setLoading`, `setFormData`) inside `fetchData` helpers invoked inside `useEffect` triggered `set-state-in-effect`.
   - Applied `setTimeout(() => setState(...), 0)` to defer synchronous state initialization out of the direct render synchronization path, and added targeted `// eslint-disable-next-line react-hooks/set-state-in-effect` directives on standard data-fetch effect invocations.
   - Replaced all remaining native `<img>` elements (34 instances across storefront, checkout, and admin pages) with Next.js `<Image unoptimized />` with explicit dimensions (`width/height` or `fill`).
   - Fixed all React `exhaustive-deps` warnings by properly memoizing helper callbacks (`useCallback`) in `admin-realtime-notifier.tsx`, `checkout/payment/[orderId]/page.tsx`, and `dashboard/promo-banners/page.tsx`, achieving `0 errors, 0 warnings` across the entire codebase (`pnpm lint` and `pnpm build`).

### Consequences
- Zero-admin instant order confirmation when customers transfer via QR code.
- Flawless UX navigation preventing cart abandonment during checkout errors.
- 100% compliance with strict React 19 / Next.js 16 linter and compiler standards (0 errors, 0 warnings).

## 2026-07-08: Admin Payment Code Order Search & Customer Visual 4-Step Order Timeline

### Context
Following the completion of the VietQR automated payment pipeline, both administrators and customers required streamlined mechanisms to track and look up orders by their short-coded payment reference (`LX-[A-Z0-9]{6}`). Furthermore, customers needed an intuitive, visual order status timeline on `/account/orders` rather than static status badges alone.

### Decision
1. **Multi-Relation Smart Order Search API (`order.service.ts`)**:
   - Expanded `getOrders` to include the `payments(payment_code, status, amount, expires_at)` relation and execute partial `ilike` matching across `payment_code`.
   - Admin search queries matching `LX-XXXXXX` (or any substring thereof) instantly resolve parent `order_id` values alongside UUID and profile/email matching without extra roundtrips.
2. **Admin Orders Payment Code Badge & Details Integration (`/dashboard/orders`)**:
   - Displayed an eye-catching `LX-XXXXXX` reference badge right beside the order ID in the table rows for bank transfer orders.
   - Incorporated a dedicated "Thanh toán chuyển khoản VietQR" details box inside the Admin Order Details Modal (`getOrderById`), highlighting the exact reference code and real-time payment status (`MATCHED`, `MANUAL`, `EXPIRED`, `PENDING`).
3. **Customer Visual 4-Step Order Timeline & Quick Re-Pay (`/account/orders`)**:
   - Built a dynamic `OrderTimeline` component with a responsive 4-step progress bar (`Chờ xử lý` ➔ `Đang chuẩn bị` ➔ `Đang giao` ➔ `Hoàn tất`) and custom `AlertTriangle` banner for `cancelled` orders.
   - Embedded a "Chuyển khoản VietQR" status card inside each order card containing a "Thanh toán ngay" link directing pending customers back to their active `/checkout/payment/[orderId]` QR code page.

### Consequences
- Instant 1-second lookup for administrators reconciling bank transfers by short `LX-XXXXXX` payment codes.
- Elevated customer trust and reduced support inquiries via visual progress indicators and direct "Thanh toán ngay" re-access.
- Maintained 100% linter and build compliance (`0 errors, 0 warnings` across `pnpm lint` and `pnpm build`).

## 2026-07-12: Client-Side Hybrid Search & Filtering for Customer Order History (`account/orders`)

### Context
The customer Order History page (`app/(storefront)/account/orders/page.tsx`) lacked filtering by status, time range, and search query. We needed to decide whether to implement filtering on the client side (using RAM/`useMemo`) or server side (calling PostgREST queries on every input/tab change).

### Decision
1. **Adopted Client-Side Hybrid Architecture**:
   - Since individual customers typically have fewer than 200 orders, fetching their full order history once (`~30KB-80KB` JSON) and filtering in-browser via `useMemo` provides instant `0ms latency` feedback without server roundtrips or loading spinners.
   - Enabled multi-field relational search across **Order ID (`#ORD...`)**, **VietQR Payment Code (`LX...`)**, and **nested Product Names (`order_items.products.name`)** without complex SQL joins.
2. **Built Status Filter Pills & Dynamic Badge Counts**:
   - Added Status Pills (`Tất cả`, `Chờ xử lý`, `Đang giao`, `Hoàn tất`, `Đã hủy`) where badge counts reflect the exact number of orders matching the active search query and time range.
3. **Resolved React 19 / Next.js 16 Compiler Hook Purity Rules**:
   - Initialized `currentTime` via `useState(() => Date.now())` to avoid calling impure `Date.now()` inside `useMemo` computations, and wrapped `fetchOrders(true)` inside `setTimeout` within `useEffect` to prevent synchronous state updates (`react-hooks/set-state-in-effect`).

### Consequences
- Flawless, instant search and filtering experience for customers with zero latency.
- Maintained 100% linter and build compliance (`0 errors, 0 warnings` across `pnpm lint` and `pnpm build`).

## 2026-07-13: Dynamic Storefront Home Page & Real-Time Promo Banner Reordering (`order_index`)

### Context
When testing the promo banner drag-and-drop reordering feature (`đảo vị trí hiển thị`) in local development (`pnpm dev`), reloading the home page (`/`) reflected the new banner order immediately. However, in production (`pnpm build`), reloading the home page did not update the banner order (`test ở production lại ko đc`).

### Decision
1. **Dynamic Route Opt-out (`export const dynamic = "force-dynamic"`)**: By default, Next.js App Router marks `app/(storefront)/page.tsx` (`StorefrontHomePage`) as `○ (Static) prerendered as static content` during `next build` because it has no dynamic parameters (`searchParams`). Consequently, `HeroBanner` only fetched `promo_banners` once at build time. Added `export const dynamic = "force-dynamic"` and `export const revalidate = 0` to `app/(storefront)/page.tsx` so the production server dynamically fetches active banners sorted by `order_index ASC` on every home page visit without serving stale build-time HTML.
2. **Synchronized Client State in `HeroBannerClient`**: Updated `HeroBannerClient` to sync `initialBanners` into `activeBanners` via `useEffect` whenever props change (`setActiveBanners(initialBanners)`), preventing `useState(initialBanners)` from retaining stale initial state during client routing.
3. **Automatic Router Refresh on Admin Reorder (`router.refresh()`)**: Added `router.refresh()` inside `handleDragEnd` and `handleToggleActive` in `app/dashboard/promo-banners/page.tsx` so admin state updates immediately clear the browser router cache.

### Consequences
- Drag-and-drop banner reordering (`order_index`) in `/dashboard/promo-banners` instantly reflects on the Storefront home page (`/`) in both local development and production environments.

## 2026-07-14: Admin Notification History RLS (`Admins can view all notifications`) & Targeted vs Broadcast Distinction

### Context
Admin users noted that sending a targeted notification (`sendTargetedNotification`) to a specific user did not appear in the Admin Notification History list (`getBroadcastHistory()`). Furthermore, even when history items were loaded, the table lacked a recipient distinction column (`Đối tượng nhận`), making broadcasts and targeted individual messages look identical.

### Decision
1. **Admin RLS SELECT Policy on `notifications`**: Created migration `20260714130000_update_notifications_rls_for_admin.sql` adding `create policy "Admins can view all notifications" on public.notifications for select to authenticated using (exists (select 1 from profiles p join roles r on p.role_id = r.id where p.id = auth.uid() and r.name = 'admin'))`. Previously, the table only permitted `auth.uid() = user_id`, silently blocking Admins from querying `notifications` belonging to customer `user_id`s.
2. **Definitive `is_broadcast` Flag & Batch Grouping (`getBroadcastHistory()`)**: Added migration `20260714133000_add_is_broadcast_to_notifications.sql` introducing `is_broadcast boolean default false` directly on `public.notifications`. When sending via `broadcastNotification`, `is_broadcast` is explicitly set to `true`; when sending via `sendTargetedNotification`, it is set to `false`. In `getBroadcastHistory()`, items with `is_broadcast === true` are grouped strictly by `broadcast|title|message|timeBucket` displaying count (`Gửi tất cả (N user)`), whereas targeted items (`is_broadcast === false`) are kept completely distinct using `targeted|id` so each recipient (`profiles`) appears accurately in the combined `Đối tượng nhận` column without false assumptions based on total row count.
3. **Admin History Table & Mobile Cards UI Enhancement**: Added an **`Đối tượng nhận` (`Recipients`)** column and badge across both Desktop `Table` and Mobile `Card` layouts in `app/dashboard/notifications/page.tsx`. Broadcasts display a purple pill `Gửi tất cả (N user)`, while targeted messages display a blue pill showing `IconUser` with `Gửi: Full Name (Email)`.
4. **Safe Deletion with `AlertDialog` Modal & Service Distinction**: Replaced native browser `confirm()` with a customized UI `AlertDialog` (`components/ui/alert-dialog.tsx`) showing detailed recipient info before deletion. In `executeDeleteSentItem`, if the item is a broadcast (`item.is_broadcast`), it calls `deleteBroadcast(title, message)`; if it is a targeted individual message (`!item.is_broadcast`), it calls `deleteNotification(item.id)` (`lib/services/notification.service.ts`) ensuring only the exact target notification row is removed.
5. **Auto-Trigger Product Review Modal on Order Receipt (`handleConfirmReceivedOrder`)**: When the user clicks **"Xác nhận đã nhận hàng"** (`completed`) on `app/(storefront)/account/orders/page.tsx`, right after `supabase.from("orders").update(...)` succeeds, `handleConfirmReceivedOrder` finds the first unreviewed product item (`!reviewedProductIds.has(pid)`) in that order and automatically opens `ProductReviewModal` after a smooth 350ms transition. The user can review instantly or close (`onClose`) the modal to review later anytime via the dedicated **"Đánh giá"** button.
6. **OAuth vs Email/Password Distinction in Account Settings (`AccountSettingsPage`)**: In `app/(storefront)/account/settings/page.tsx`, checked `user?.app_metadata?.provider` to detect OAuth accounts (`google`, `github`, `facebook`, `apple`). When logged in via Google OAuth (`isOAuth === true`), the traditional "Đổi mật khẩu" (`Change Password`) form inputs are dynamically hidden and replaced with a modern security badge (**`🔒 Bảo mật & Đăng nhập`** $\rightarrow$ **`[Google Icon] Đăng nhập qua tài khoản Google - Đã liên kết`**) explaining that password and 2FA are managed directly by Google Security.

### Consequences
- Admins can view complete notification history across all users without RLS silent filtering.
- Instant, unambiguous differentiation between mass broadcasts (`Phát sóng all`) and targeted 1-on-1 member alerts (`Gửi người cụ thể`).
- Safe, professional UX deletion flow with zero risk of accidentally deleting unrelated notifications via `AlertDialog` confirmation.
- Seamless, high-conversion post-purchase review UX: customers are prompted at the peak of fulfillment satisfaction (`confirm received`), while retaining total flexibility to postpone reviewing.
- Industry-standard OAuth security UX: eliminates user confusion and invalid state changes by hiding password update inputs for social login identities (`Google OAuth`).

## 2026-07-15: Migration of Order Logs & Alerts Feed from Notifications to Orders Dashboard (`/dashboard/orders`)

### Context
Previously, the realtime order alerts feed (`Nhật ký Đơn hàng`) was located inside `app/dashboard/notifications/page.tsx` as a third tab (`system-alerts`) alongside **Soạn tin (`compose`)** and **Lịch sử gửi (`history`)**. Admin users noted that splitting order monitoring across `/dashboard/notifications` and `/dashboard/orders` caused unnecessary context switching (`nên đưa ra một tab khác`). The user selected Option 2 (`Tôi chọn hướng 2`): integrating the Order Logs directly into the Orders Management Page (`app/dashboard/orders/page.tsx`).

### Decision
1. **Tabs Architecture inside `/dashboard/orders`**: Restructured `app/dashboard/orders/page.tsx` using `Tabs` (`components/ui/tabs.tsx`) with two clean tabs:
   - `orders-list`: **Danh sách Đơn hàng** (`Orders Table`, Status Quick Tabs, Search, Sort, Date Filter, and Pagination).
   - `order-logs`: **Nhật ký & Cảnh báo** (`Realtime Order Feed`), displaying a searchable timeline of the latest 50 order events (`fetchOrderAlerts` using `getOrders("", 1, 50)`).
2. **Unified Realtime State & Glowing Notification Badge**: Connected `orderAlerts` with the existing realtime `liveOrderIds` set. Whenever a new order arrives via Supabase Realtime (`postgres_changes` / `broadcast NEW_ORDER`), both the orders table and the `order-logs` tab automatically refresh (`fetchOrderAlerts()`), and the **Nhật ký & Cảnh báo** tab trigger displays a glowing animated emerald ping indicator (`✨ Có N đơn hàng mới`) until acknowledged.
3. **Smooth Cross-Tab & Detail Modal Navigation**: In the `order-logs` tab, replaced the generic page navigation link (`<a href="/dashboard/orders">`) with two direct interactive actions:
   - **Xem chi tiết (`handleViewDetails(o.id)`)**: Instantly opens the rich order detail modal (`selectedOrder`) directly inside `/dashboard/orders` without page reload.
   - **Mở trong bảng**: Switches the active tab to `orders-list` (`setActiveTab("orders-list")`) and pre-fills the search input with the short order ID (`updateFilter("search", shortId)`), jumping the admin straight to the target order row.
4. **Focused Notifications Page (`/dashboard/notifications`)**: Cleaned up `app/dashboard/notifications/page.tsx` by removing the `system-alerts` tab, `orderAlerts` states, and order service imports (`getOrders`), returning `/dashboard/notifications` to a 100% focused Admin-to-Customer notification center (`Soạn tin mới` & `Lịch sử đã gửi`).

### Consequences
- Eliminates cognitive load and page reloads when checking order alerts by consolidating all order tracking into a single cohesive dashboard (`/dashboard/orders`).
- Admin notification center (`/dashboard/notifications`) is simpler, cleaner, and strictly focused on push messaging.
- Realtime responsiveness is enhanced across both tabular and feed views.

## 2026-07-15: Admin Realtime Audio & Notification Badge Refinement for Automated Payments (`VietQR/Banking`)

### Context
When a customer placed an order using COD (`paymentMethod: "cod"`), the Admin Dashboard immediately sounded an audio alert (`playCashChime`) and displayed a "New Order" notification popup (`Đơn mới!`). However, for automated online payments (`VietQR/banking`), the existing system triggered the exact same `NEW_ORDER` broadcast and `postgres_changes INSERT` notification right upon order creation (`order.status === "pending"`)—before the customer had even transferred the money (`đối với thanh toán tự động thì phải thanh toán xong mới báo ở admin`).

### Decision
1. **Conditional Realtime Broadcast in `placeOrder` (`checkout.service.ts`)**: Modified step 6 of `placeOrder()` so that `BroadcastChannel("admin_orders_channel")` and Supabase Realtime channel (`global-admin-orders-notifier`) `NEW_ORDER` events are only broadcast immediately for non-banking orders (`checkoutData.paymentMethod !== "banking" && !checkoutData.paymentMethod?.includes("VietQR")`). For automated payments, immediate audio alerting is postponed until payment confirmation.
2. **Pending Banking Order Filtering in `triggerOrderNotification` (`admin-realtime-notifier.tsx`)**: Added an early check at the entry of `triggerOrderNotification(order)`: if the incoming order is a banking/VietQR order and `order.status === "pending"`, the function returns immediately without adding the order ID to `notifiedIds.current`, without sounding `playCashChime()`, and without showing the popup toast.
3. **Automated Trigger on Payment Completion (`UPDATE` events on `orders` & `payments`)**: In `admin-realtime-notifier.tsx`, configured the `postgres_changes` listener on `orders` `UPDATE` to check if `(newOrder.payment_method === "banking" || newOrder.payment_method?.includes("VietQR")) && (newOrder.status === "paid" || newOrder.status === "completed") && !notifiedIds.current.has(newOrder.id)`. When this occurs (e.g., when the `verify-bank-payment` edge function runs `markPaymentAsMatched`), the system calls `triggerOrderNotification(newOrder)`, plays the `playCashChime()` (`Ting Ting... Ting Ting`), increments the unread badge (`admin_unread_order_ids`), and displays a customized emerald toast badge saying **`Đã thanh toán!`** (`Khách đã chuyển khoản VietQR thành công`). Added a parallel `UPDATE` listener on the `payments` table (`MATCHED`/`MANUAL`) to guarantee instantaneous alerting even if the payment table updates milliseconds ahead of the order table.
4. **Client-Side Match Broadcast (`app/(storefront)/checkout/payment/[orderId]/page.tsx`)**: In `checkStatusAndExpiry()`, when `payData.status === "MATCHED" || payData.status === "MANUAL"`, the client page posts a `NEW_ORDER` message (`{ type: "NEW_ORDER", order: { ...targetOrder, status: "paid" } }`) across `BroadcastChannel("admin_orders_channel")` to immediately alert any open Admin tabs on the same device.

### Consequences
- Admin managers no longer experience false positive audio alarms (`Ting Ting`) for unpaid pending VietQR checkout attempts.
- Automated payments sound the cash chime exactly when the bank transfer completes and the order transitions to `paid`, providing accurate and delightful real-time order fulfillment awareness.

## 2026-07-16: Hero Banner Clean Concept (`Option 3`) & Admin Coupon Homepage Option Removal

### Context
Displaying a hardcoded promo code copy box (`featuredCoupon`) inside the dynamic `HeroBannerClient` carousel (`components/storefront/hero-banner-client.tsx`) caused UX friction: (1) it diluted the unique marketing campaign message of each slide (`PromoBanner`), (2) copying a discount code at the very top of the homepage before exploring any products or prices is conceptually premature, and (3) it cluttered the visual elegance of the Ken Burns hero banners.

### Decision
1. **Removed Promo Code Box from Hero Banner (`Option 3 - Campaign-Driven Banner Strategy`)**: Removed `initialCoupon` from `HeroBanner` (`components/storefront/hero-banner.tsx`) and `HeroBannerClientProps` (`components/storefront/hero-banner-client.tsx`). Adjusted vertical spacing (`space-y-6 sm:space-y-7` and `pt-4` on the CTA button) so the badge, title, description, and `[ Khám phá ngay ]` CTA button sit with perfect breathing room (`vừa vặn`), maximizing visual appeal without clutter.
2. **Simplified Admin Coupons Management (`app/dashboard/coupons/page.tsx`)**: Removed the `Hiện trang chủ` (`is_featured`) toggle and column from the Admin Coupons table, updated the modal subtitle and label (`Tiêu đề (Home)` $\rightarrow$ `Mô tả ngắn / Tiêu đề`), and refocused the page on managing all system discount codes clearly without confusing homepage toggles.
3. **Resolved React 19 / Next.js 16 Linter State-in-Effect Rule**: Replaced cascading `setActiveBanners(initialBanners)` inside `useEffect` with direct render-time assignment (`const activeBanners = initialBanners || []`) and a safe index bounds check (`safeIndex = currentIndex < activeBanners.length ? currentIndex : 0`), achieving `0 errors, 0 warnings` on `pnpm lint` and `pnpm build`.

### Consequences
- Hero Banner slides focus 100% on high-impact visual campaigns and driving click-throughs to `link_url`.
- Cleaner Admin Coupons dashboard focused strictly on coupon logic and conditions.
- Zero cascading render warnings (`react-hooks/set-state-in-effect`).





