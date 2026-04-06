# STOREFRONT & CHECKOUT FLOW — COMPREHENSIVE AUDIT REPORT

**Project:** NX036 E-commerce React Frontend  
**Path:** `/home/nexaplaform/Documentos/ecomerce/front/Ecomerce/src/app/`  
**Date:** 2025-07-17  
**Scope:** Public-facing storefront flow: Home → Product Browse → Product Detail → Add to Cart → Cart → Checkout → Order Confirmation

---

## TABLE OF CONTENTS

1. [Architecture Overview](#1-architecture-overview)
2. [File-by-File Audit](#2-file-by-file-audit)
   - [Routing & Layout](#21-routing--layout)
   - [Context Providers (State Management)](#22-context-providers)
   - [Pages](#23-pages)
   - [Components](#24-components)
   - [Repositories (API Layer)](#25-repositories)
   - [Services / Hooks](#26-services--hooks)
   - [Mappers](#27-mappers)
   - [Config](#28-config)
   - [Lib (Infrastructure)](#29-lib-infrastructure)
   - [Types](#210-types)
3. [Flow-by-Flow Analysis](#3-flow-by-flow-analysis)
4. [Price Calculation Audit](#4-price-calculation-audit)
5. [Tax, Shipping, Coupon Application](#5-tax-shipping-coupon-application)
6. [Critical Issues & Gaps](#6-critical-issues--gaps)
7. [Security Concerns](#7-security-concerns)
8. [Recommendations](#8-recommendations)

---

## 1. ARCHITECTURE OVERVIEW

### Stack
| Layer | Technology |
|---|---|
| Framework | React 19 + React Router v7 |
| State | 9 React Context providers (no Redux/Zustand) |
| API Pattern | Repository classes (singletons) |
| HTTP | Two fetch wrappers: `nxFetch` (public), `authFetch` (authenticated) |
| Auth | OAuth2 Authorization Code + PKCE |
| Styling | Tailwind CSS |
| Animations | Framer Motion (`motion/react`) |
| Notifications | Sonner (toast) |
| Product Source | CJ Dropshipping via `mic-productcategory` microservice |
| Order/Cart/Payment | `mic-orderservice` microservice |
| Gateway | API Gateway at port 9000 (`VITE_API_BASE`) |

### Provider Composition Order (RootLayout.tsx)
```
AuthProvider → LanguageProvider → TimezoneProvider → StoreProvider
→ UserProvider → CartProvider → CompareProvider
→ RecentlyViewedProvider → NewsletterProvider
```

### Route Structure
```
/ (RootLayout — providers)
├── / (Layout — Header + Footer)
│   ├── /                      → Home (store listing)
│   ├── /store                 → Home
│   ├── /store/:catSlug        → Home (category filter)
│   ├── /store/:catSlug/:sub   → Home (subcategory filter)
│   ├── /search/:query         → Home (search mode)
│   ├── /product/:id           → ProductDetail
│   ├── /cart                  → Cart            ← PUBLIC (no auth)
│   ├── /checkout              → Checkout        ← PUBLIC (no auth) ⚠️
│   ├── /tracking              → Tracking
│   ├── /compare               → Compare
│   ├── /brand/:slug           → Brand
│   ├── /gift-cards            → GiftCards
│   └── info pages...
├── /account (AuthGuard)
│   └── profile, orders, addresses, etc.
└── /admin (AuthGuard)
    └── admin pages...
```

---

## 2. FILE-BY-FILE AUDIT

### 2.1 Routing & Layout

#### `routes.tsx`
- **What it does:** Defines all application routes using `createBrowserRouter` with lazy-loaded pages.
- **APIs called:** None directly.
- **Data transformations:** None.
- **Issues:**
  - ⚠️ **`/checkout` is NOT auth-guarded** — it's a public route, but the checkout flow calls authenticated APIs (`orderRepository`, `paymentRepository`, `invoiceRepository`). Anonymous users will see the page but all API calls will fail silently or with 401.
  - ⚠️ `/cart` is also public — this is acceptable for guest cart + localStorage.

#### `RootLayout.tsx`
- **What it does:** Composes all 9 context providers in the correct dependency order and renders `<Outlet />`.
- **APIs called:** None directly (providers do their own fetching).
- **Issues:** None.

#### `Layout.tsx`
- **What it does:** Wraps content with `<Header>`, `<Footer>`, `<CompareBar>`, `<NewsletterPopup>`, `<TimezoneSidebar>`. Handles scroll restoration with `useLocation` + `scrollTo`.
- **APIs called:** None directly.
- **Issues:**
  - Custom scroll restoration targets `<main>` element with `overflow-y-auto` on mobile — may conflict with browser-native scroll restoration.

#### `AuthGuard.tsx`
- **What it does:** Layout route component that redirects unauthenticated users to OAuth2 login via `login(returnUrl)`. Shows spinner while loading, redirecting message while waiting.
- **APIs called:** None — delegates to `AuthContext.login()`.
- **Issues:** None — correctly used for `/account` and `/admin` route trees.

---

### 2.2 Context Providers

#### `AuthContext.tsx`
- **What it does:** Manages OAuth2 PKCE authentication flow. Stores user identity (sid, id, firstName, lastName, nickName, email, roles, groups) decoded from JWT.
- **APIs called:**
  - `POST /oauth2/token` — token exchange and refresh
  - `GET /oauth2/authorize` — authorization redirect
- **Data transformations:** JWT payload → `User` object via `decodeJwtPayload()`.
- **Issues:**
  - JWT is decoded client-side without signature verification (acceptable for UI display only, backend validates).
  - User roles extracted from `realm_access.roles` — groups from `groups` claim.

#### `CartContext.tsx` (~330 lines)
- **What it does:** Dual-mode cart — guest (localStorage) + authenticated (backend sync via CartRepository).
- **APIs called:**
  - `cartRepository.getActiveCart()` — on auth change
  - `cartRepository.addItem()` / `updateItemQuantity()` / `removeItem()` / `clearCart()` — CRUD
  - `cartRepository.mergeCart()` — merges guest items into backend on login
  - `nexaProductRepository.findById()` — enriches cart items with fresh catalog data
- **Data transformations:**
  - Backend DTO → `CartItem`: maps `backendItemId`, `unitPrice`, `productId`, `quantity`
  - Product enrichment: replaces price/name/image from catalog for display accuracy
- **Price calculations:**
  - `getTotalPrice()`: `items.reduce((t, i) => t + i.price * i.quantity, 0)`
  - **⚠️ NO tax, NO shipping, NO coupons applied at cart level**
- **Issues:**
  - 🔴 **Optimistic updates without rollback**: `addToCart` updates local state immediately, then fires backend call. If backend fails, local state is already updated — no error rollback.
  - 🔴 **Race condition on login**: `mergeCart()` and `getActiveCart()` may overlap if authentication state changes rapidly.
  - `price` field in CartItem comes from catalog enrichment OR backend `unitPrice` — potential mismatch if catalog price changes between add and display.

#### `StoreContext.tsx` (~210 lines)
- **What it does:** Provides products, categories, brands, attributes to the app.
- **APIs called:**
  - `BrandRepository.findAll()` — real API
  - `AttributeRepository.findAll()` — real API
- **Data transformations:** None significant.
- **Issues:**
  - 🔴 **Products are EMPTY/MOCK**: `refreshProducts()` sets `setRawProducts([])` with a `TODO` comment. The storefront does NOT use StoreContext for products — it uses `useNexaProducts` hook instead.
  - 🟡 Categories are also empty in StoreContext — storefront uses `useNexaCategories` separately.
  - `getProductById()` only searches in-memory mock array — **broken** for any component relying on it.

#### `UserContext.tsx` (~500 lines)
- **What it does:** Manages full user profile: addresses, payment methods, favorites, notification preferences.
- **APIs called:**
  - `profileRepository.getProfile()`, `getAddresses()`, `listPaymentMethods()`, `getFavorites()`, `getNotificationPrefs()` — loaded in parallel via `Promise.allSettled`
- **Data transformations:**
  - API Address types (`HOME`/`STORE_PICKUP`/`PICKUP_POINT`) ↔ UI types (`home`/`store`/`pickup`)
  - PaymentMethod mapper: API → UI format
- **Issues:**
  - Uses `Promise.allSettled` — partial failures are silently swallowed (logged to console only).

#### `CompareContext.tsx`
- **What it does:** Manages product comparison list (up to 4 products).
- **APIs called:** None — pure client-side state.
- **Issues:** No persistence (localStorage or backend) — compare list lost on refresh.

#### `LanguageContext.tsx`
- **What it does:** i18n with 3 locales (es/en/pt). Translations loaded from JSON files.
- **APIs called:** `fetch(/i18n/{lang}.json)` — static JSON files.
- **Issues:** None significant for storefront flow.

#### `TimezoneContext.tsx`
- **What it does:** Country-based timezone selection + auto-locale switching. Triggers language context update.
- **APIs called:** None.
- **Issues:** None.

#### `NewsletterContext.tsx`
- **What it does:** Shows newsletter popup after 4 seconds delay. Subscribes via CMS API.
- **APIs called:** `newsletterRepository.subscribe(email)` — via `nxFetch` (public).
- **Issues:** None.

#### `RecentlyViewedContext.tsx`
- **What it does:** Tracks recently viewed products in localStorage (max 8).
- **APIs called:** None.
- **Issues:** None.

---

### 2.3 Pages

#### `Home.tsx` (674 lines) — Product Browse
- **What it does:** Main storefront listing with category navigation, filtering, sorting, and infinite scroll.
- **APIs called (indirect):**
  - `useNexaProducts(activeCategoryId)` → `nexaProductRepository.findMany()`
  - `useNexaCategories()` → `nexaCategoryRepository.findAll()`
- **Data transformations:**
  - URL slugs → category IDs: resolves `:catSlug` and `:subcatSlug` params to category objects
  - Client-side filtering: subcategory, brand, attribute, price range, rating, search query
  - Sorting: featured (default), price-low, price-high, rating, name
  - PromoSlider CTA params → filter state
- **Price calculations:** Price range filtering uses `priceRanges` config. Display uses `product.price` / `product.priceMax`.
- **Issues:**
  - 🟡 **All filtering is CLIENT-SIDE** on top of already-fetched API results. For large catalogs, this means downloading all products then filtering in-browser.
  - 🟡 **Infinite scroll accumulates ALL pages in memory** — no virtualization. Could cause memory issues with thousands of products.
  - Search query filtering is client-side substring match on `name`, `description`, `brand`, `category` — not a backend search API.

#### `ProductDetail.tsx` (1296 lines) — Product Detail
- **What it does:** Full product detail page with image gallery, variant selection, specs, description, reviews.
- **APIs called:**
  - `nexaProductRepository.findDetailByPid(id, apiLocale)` → product detail
  - `addToRecentlyViewed(product)` — RecentlyViewedContext
- **Data transformations:**
  - `mapNexaProductDetail(data)` → `Product` type (via NexaProductMapper)
  - Variant attribute parsing: composite `variantKey` split into individual attributes
  - Description HTML → extracted `<img>` tags merged into image gallery
  - HTML sanitization via `DOMPurify.sanitize()`
- **Price calculations:**
  - `displayPrice = selectedVariant ? selectedVariant.price : product.price`
  - `displayStock = selectedVariant ? selectedVariant.stock_quantity : product.stock`
  - Price range: shows `${min} – ${max}` when no variant selected and variants have different prices
  - Discount: `Math.round(((product.originalPrice - displayPrice) / product.originalPrice) * 100)`
  - Savings display: `product.originalPrice - displayPrice`
- **Issues:**
  - 🔴 **Reviews are LOCAL ONLY**: Uses `localReviews` state — reviews are lost on page refresh. No backend persistence.
  - 🔴 **Related products always empty**: Uses `useStore().products` which is MOCK/EMPTY (StoreContext has `TODO`).
  - 🟡 Reviews use `Date.now()` IDs and come from a local `ReviewsSection` component — no API integration.
  - Variant stock check is UI-only — out-of-stock variants are shown with reduced opacity but can still be selected.

#### `Cart.tsx` (~210 lines) — Shopping Cart
- **What it does:** Displays cart items with quantity controls, subtotal, navigation to checkout.
- **APIs called (indirect via CartContext):**
  - `updateQuantity()`, `removeFromCart()`, `addToCart()` — CartContext
  - `toggleFavorite()` — UserContext (move-to-favorites)
- **Data transformations:** None — displays CartContext items directly.
- **Price calculations:**
  - Subtotal: `getTotalPrice()` from CartContext (simple `price × quantity` sum)
  - Shipping & Tax: displayed as "Calculado en el checkout" (text only)
- **Issues:**
  - 🟡 **No coupon input on cart page** — coupons only at checkout step.
  - 🟡 **No estimated total** — user sees subtotal only with no hint of final cost.
  - 🟡 **"Move to favorites" deletes from cart** when adding to favorites — no confirmation.

#### `Checkout.tsx` (1529 lines) — Checkout Flow
- **What it does:** 3-step accordion checkout: Contact → Address → Payment. Calculates shipping, tax, coupon. Creates order + processes payment + fetches invoice.
- **APIs called:**
  - `shippingRepository.getOptions()` — fetched on mount
  - `taxRepository.calculate({ subtotal, country, state })` — recalculated on subtotal/address change (400ms debounce)
  - `couponRepository.validate(code, subtotal)` — on coupon apply
  - `orderRepository.createOrder({ shippingAddress, paymentMethod, couponCode, notes })` — order creation
  - `paymentRepository.processPayment({ orderId, userId, amount, currency, paymentMethod })` — payment
  - `invoiceRepository.findByOrderId(orderId)` — invoice retrieval
  - `clearCart()` — CartContext

- **Data transformations:**
  - User profile → pre-filled contact info (email, phone)
  - Saved addresses → address selection cards
  - New address form → API-compatible shipping address object
  - Cart items → order line items (implicit, sent via backend cart)
  - Invoice API response → `InvoiceData` for `InvoiceDocument` component

- **Price calculations:**
  - `subtotal`: from `getTotalPrice()` (CartContext)
  - `shipping`: from selected shipping option's `price` field
  - `tax`: from `taxRepository.calculate()` response `.taxAmount`
  - `couponDiscount`: from `couponRepository.validate()` response `.discount`
  - **`total = Math.max(0, subtotal + shipping + tax - couponDiscount)`**

- **Tax application:**
  - Recalculated via API on `subtotal`/`country`/`state` change with 400ms debounce
  - **⚠️ Fallback: `subtotal * 0.1` (hardcoded 10%)** when API fails
  - Tax API call uses `useEffect` with dependency array `[subtotal, selectedAddress?.country, selectedAddress?.state]`

- **Coupon application:**
  - Types supported: `PERCENTAGE`, `FIXED`, `FREE_SHIPPING`
  - `FREE_SHIPPING` type sets `shippingCost` to 0 + resets dropdown
  - Coupon validation is server-side via `couponRepository.validate(code, subtotal)`
  - Only ONE coupon at a time

- **Issues:**
  - 🔴 **NOT AUTH-GUARDED** — public route, but calls `authFetch` APIs. Anonymous users reach the page but ALL API calls fail.
  - 🔴 **Store locations are HARDCODED** — `MOCK_STORE_LOCATIONS` array with fake addresses.
  - 🔴 **Pickup points are HARDCODED** — `MOCK_PICKUP_POINTS` array.
  - 🔴 **Crypto wallet addresses are MOCK CONSTANTS** — `CRYPTO_ADDRESSES.USDT` and `CRYPTO_ADDRESSES.BTC` are hardcoded strings.
  - 🔴 **BTC price hardcoded at $68,500** — `const BTC_PRICE = 68500`.
  - 🟡 **Tax fallback is 10%** — when tax API fails, a hardcoded 10% is applied, which may be legally incorrect.
  - 🟡 **No address validation** — new addresses are accepted without geocoding, postal code validation, or delivery zone check.
  - 🟡 **No stock re-validation** at checkout — prices and stock from cart are not re-checked before order creation.
  - 🟡 **Coupon discount not re-validated server-side at order creation** — only validated at apply time. Price could change between validation and order submit.
  - 🟡 **Payment processing is fire-and-forget style** — if `processPayment` fails after `createOrder` succeeds, order exists without payment.
  - 🔴 **Invoice fetch failure is silent** — falls back to building invoice from order snapshot. User may not realize invoice was not generated.

---

### 2.4 Components

#### `Header.tsx` (~335 lines)
- **What it does:** Top navigation with search bar, cart badge, favorites link, timezone/country selector, user dropdown, admin link.
- **APIs called:** None directly — reads from contexts.
- **Data transformations:** Cart item count → badge number.
- **Issues:** 
  - Search navigates to `/search/:query` — Home.tsx handles this as client-side filtering.

#### `Footer.tsx` (115 lines)
- **What it does:** Footer with links, social icons, payment logos.
- **Issues:**
  - 🟡 **Footer links use LEGACY query params** (`/?category=Electrónica`) instead of current clean URL routing (`/store/electronica`). Links will NOT work with current routing.

#### `ProductCard.tsx` (~218 lines)
- **What it does:** Product card with image, price, discount badge, quick-action buttons (cart, compare, favorite, quick view).
- **APIs called (indirect):** `addToCart(product)`, `toggleFavorite(product.id)`, `add(product)` (compare).
- **Price calculations:** Discount percentage: `Math.round(((originalPrice - price) / originalPrice) * 100)`.
- **Issues:**
  - 🔴 **Quick-add bypasses variant selection** — `addToCart(product)` adds the base product without selecting a variant. For multi-variant products, this adds at the base/minimum price with no variant attributes. The backend may reject this or assign a default variant.
  - 3D tilt effect on hover may cause performance issues on low-end devices.

#### `CategoryBar.tsx` (~381 lines)
- **What it does:** Horizontal category navigation bar with subcategory dropdowns. Uses `useNexaFeaturedCategories()`.
- **APIs called:** `nexaCategoryRepository.findFeatured()` — via hook.
- **Data transformations:** `NexaCategory[]` → display tree with icons resolved by name regex matching.
- **Issues:** None significant.

#### `PromoSlider.tsx` (~310 lines)
- **What it does:** Hero carousel with promotional slides. Fetches from CMS API, falls back to hardcoded promos.
- **APIs called:** `slideRepository.findActive()` — via `nxFetch` (public).
- **Data transformations:** `Slide` → `Promo` with parsed filter params from `link` field.
- **Issues:**
  - 🟡 **CTA link parsing assumes query param format** (`/?ofertas=true&category=Moda`) — tightly coupled to Home.tsx filter state.
  - Fallback promos use Unsplash URLs — external dependency.

#### `FlashDeals.tsx` (~210 lines)
- **What it does:** Flash deals section with countdown timer and discounted products carousel.
- **APIs called:** None directly — reads from `useStore().products`.
- **Issues:**
  - 🔴 **Always empty**: Depends on `StoreContext.products` which is MOCK/EMPTY. This section will never render any deals.
  - Countdown resets at midnight — no backend campaign management.

#### `QuickViewModal.tsx` (~149 lines)
- **What it does:** Modal popup for quick product preview with add-to-cart, compare, favorite actions.
- **APIs called (indirect):** `addToCart(product)`, `toggleFavorite()`, `add()` (compare).
- **Issues:**
  - 🔴 **Same variant bypass as ProductCard** — adds product without variant selection.
  - Renders via `createPortal` to document body.

#### `InvoiceDocument.tsx` (~299 lines)
- **What it does:** Renders invoice with QR code, line items, totals, print support.
- **APIs called:** None — receives `InvoiceData` as prop.
- **Data transformations:** Invoice data → QR verification URL, formatted dates/prices.
- **Issues:** None — clean presentational component.

#### `CompareBar.tsx`, `NewsletterPopup.tsx`, `TimezoneSidebar.tsx`, `InfoBanner.tsx`, `HomeSidebar.tsx`, `MobileFilterDrawer.tsx`, `RecentlyViewedSection.tsx`, `PaymentLogos.tsx`
- Supporting UI components — no business logic issues detected.

---

### 2.5 Repositories (API Layer)

#### `NexaProductRepository.ts`
- **Endpoints:**
  - `GET /api/v1/products` — paginated list (via `nxFetch`)
  - `GET /api/v1/products/{id}` — single product (via `nxFetch`)
  - `GET /api/v1/products/detail/{pid}` — CJ detail fetch (via `nxFetch`)
- **Auth:** Public (`nxFetch` — no Bearer token, only `X-nx036-auth` gateway token)
- **Issues:** None.

#### `NexaCategoryRepository.ts`
- **Endpoints:**
  - `GET /api/v1/categories` — all published+active categories (TTL cached 10 min)
  - `GET /api/v1/categories/featured` — featured categories
- **Auth:** Public (`nxFetch`)
- **Issues:** None.

#### `CartRepository.ts`
- **Endpoints:**
  - `GET /api/v1/cart/active` — get active cart
  - `POST /api/v1/cart/items` — add item
  - `PUT /api/v1/cart/items/{id}` — update quantity
  - `DELETE /api/v1/cart/items/{id}` — remove item
  - `DELETE /api/v1/cart` — clear cart
  - `POST /api/v1/cart/merge` — merge guest cart
- **Auth:** Authenticated (`authFetch` with `X-Session-Id` for guest support)
- **Issues:** None.

#### `OrderRepository.ts`
- **Endpoints:**
  - `POST /api/v1/orders` — create order
  - `GET /api/v1/orders/my` — user orders
  - `GET /api/v1/orders/my/{id}` — single order
  - `PUT /api/v1/orders/{id}/cancel` — cancel order
- **Auth:** Authenticated (`authFetch`)
- **Issues:** None.

#### `PaymentRepository.ts`
- **Endpoints:**
  - `POST /api/v1/payments/process` — process payment
  - `POST /api/v1/payments/crypto` — create crypto payment
  - `POST /api/v1/payments/crypto/{id}/verify` — verify crypto
  - `POST /api/v1/payments/{id}/refund` — refund
- **Auth:** Authenticated (`authFetch`)
- **Supported methods:** CARD, PAYPAL, USDT, BTC
- **Issues:** None in repository itself.

#### `TaxRepository.ts`
- **Endpoints:**
  - `GET /api/v1/taxes/calculate?subtotal=X&country=Y&state=Z` — tax calculation
- **Auth:** Public (`nxFetch`)
- **Returns:** `{ subtotal, taxAmount, total, appliedRates[] }`
- **Issues:** None.

#### `CouponRepository.ts`
- **Endpoints:**
  - `POST /api/v1/coupons/validate` — validate coupon
- **Auth:** Public (`nxFetch`)
- **Returns:** `{ valid, coupon, discount, message }`
- **Coupon types:** `PERCENTAGE`, `FIXED`, `FREE_SHIPPING`
- **Issues:** None in repository.

#### `ShippingRepository.ts`
- **Endpoints:**
  - `GET /api/v1/shipping/options` — available shipping methods
- **Auth:** Public (`nxFetch`)
- **Returns:** `ShippingOption[]` with `{ id, name, carrier, estimatedDays, price }`
- **Issues:**
  - 🟡 Shipping options are NOT address-dependent — same options regardless of country/region.

#### `InvoiceRepository.ts`
- **Endpoints:**
  - `GET /api/v1/invoices/order/{orderId}` — invoice by order
- **Auth:** Authenticated (`authFetch`)
- **Issues:** None.

#### `CmsRepository.ts` (multi-repository file, ~848 lines)
- Contains: `SlideRepository`, `NewsletterRepository`, `GiftCardRepository`, `ContactRepository`, `CampaignRepository`, `LoyaltyRepository`, `EmailTemplateRepository`, etc.
- **Storefront-relevant:**
  - `slideRepository.findActive()` — used by PromoSlider (`nxFetch`)
  - `newsletterRepository.subscribe()` — used by NewsletterPopup (`nxFetch`)
- **Issues:** None for storefront.

#### `ProfileRepository.ts` (~448 lines)
- **Endpoints:**
  - `GET/PUT /api/v1/profile/me` — profile CRUD
  - `CRUD /api/v1/addresses` — addresses
  - `CRUD /api/v1/payment-methods` — payment methods
  - `CRUD /api/v1/favorites` — favorites
  - `CRUD /api/v1/notification-prefs` — notification prefs
- **Auth:** Authenticated (`authFetch`)
- **Issues:** None.

#### `TrackingRepository.ts` (68 lines)
- **Endpoints:**
  - `GET /api/v1/tracking/order/{orderId}` — tracking events
  - `POST /api/v1/tracking/order/{orderId}/events` — add event (admin)
- **Auth:** Authenticated (`authFetch`)
- **Issues:** None.

---

### 2.6 Services / Hooks

#### `useNexaProducts.ts` (~237 lines)
- **What it does:** Fetches and caches product listings with infinite scroll support.
- **Cache:** Module-level `Map` with 5-minute TTL, keyed by `categoryId|locale`.
- **APIs called:** `nexaProductRepository.findMany()`, `nexaCategoryRepository.findAll()` (for category name resolution).
- **Features:** AbortController for request cancellation, page accumulation, loading/error states.
- **Issues:**
  - Module-level cache persists across component unmounts — good for UX, but stale data possible.
  - No cache invalidation mechanism beyond TTL.

#### `useNexaCategories.ts` (62 lines)
- **What it does:** Fetches all categories with re-fetch on locale change.
- **APIs called:** `nexaCategoryRepository.findAll(apiLocale)`.
- **Issues:** None.

#### `useNexaFeaturedCategories.ts`
- **What it does:** Fetches featured categories for CategoryBar.
- **APIs called:** `nexaCategoryRepository.findFeatured(apiLocale)`.
- **Issues:** None.

#### `useApiResource.ts` (93 lines)
- **What it does:** Generic hook for repository data fetching with loading/error/data state management.
- **Issues:** None.

---

### 2.7 Mappers

#### `NexaProductMapper.ts` (367 lines)
- **What it does:** Maps CJ Dropshipping API data → `Product` type used throughout the app.

- **`mapNexaProduct(raw, categoryMap)`** (list view):
  - Price: Parses `sellPrice` string ranges like `"0.84-2.94"` → `price` (min) and `priceMax` (max)
  - Stock: sums variant inventories, applies `FALLBACK_STOCK = 50` if all variants report 0
  - Images: builds array from `bigImage` + `productImageSet`
  - Category: resolved from `categoryId` via `categoryMap`
  - Slug: generated via `slugify(productNameEn)`

- **`mapNexaProductDetail(raw)`** (detail view):
  - Price: `sellPrice` parsed as range → `price`/`priceMax`
  - **`originalPrice`**: set to `suggestedPrice` from `productName` field (suggested retail) if > cost price
  - Attributes: extensive list built from product metadata (material, packing, dimensions, customs data, etc.)
  - Variants: mapped via `mapVariant()` with attribute parsing from composite `variantKey`
  - Description: raw HTML from CJ API, sanitized by DOMPurify in ProductDetail

- **`mapVariant(v, productKeyEn, fallbackStock)`**:
  - `parseVariantAttributes()`: splits `"Red-S"` using `"Color-Size"` schema from `productKeyEn`
  - Price: `variantSellPrice` parsed as float
  - Stock: `variantVolume` (inventory), fallback to `VARIANT_FALLBACK_STOCK = 20` if 0

- **Issues:**
  - 🔴 **Fallback stock is fabricated**: `FALLBACK_STOCK = 50` and `VARIANT_FALLBACK_STOCK = 20` mean products with 0 real inventory appear as "in stock" with fake quantities. **This will cause orders for out-of-stock items.**
  - 🟡 **Price parsing is fragile**: Relies on dash-separated price ranges in `sellPrice` string. Unexpected formats will fall through to `parseFloat()` which may return `NaN`.
  - 🟡 **Variant attribute parsing assumes dash separator**: `"Red-S"` works, but values containing dashes (e.g., `"Blue-Gray-XL"`) will misparse when schema is `"Color-Size"`.
  - 🟡 **`suggestedPrice` extraction**: Parses `productName` field for price info — relies on CJ API structure that may change.

---

### 2.8 Config

#### `filters.ts` (128 lines)
- **What it does:** Defines sidebar filter groups per category and matching functions.
- **`CATEGORY_ATTR_FILTERS`**: Static config for Electrónica, Audio, Fotografía, Moda, Gaming.
- **`ATTR_MATCH`**: Predicate functions that test product attributes.
- **Issues:**
  - 🟡 **Hardcoded to Spanish category names** — will break if CJ categories come in English (which they do — CJ API returns English names).
  - 🟡 **Only 5 categories configured** — any new category has no filter options.
  - Gaming "Periféricos" filter checks `p.subcategory === "Periféricos Gaming"` — exact string match is brittle.

#### `priceRanges.ts` (11 lines)
- **What it does:** Defines 6 price range filter options from "Hasta $50" to "Más de $1000".
- **Issues:**
  - 🟡 Uses USD-style `$` labels but prices come from CJ in mixed currencies (likely USD). No currency awareness.

---

### 2.9 Lib (Infrastructure)

#### `nxFetch.ts` (public HTTP client)
- **What it does:** Drop-in `fetch` replacement that adds `X-nx036-auth` header (NX036 gateway authentication token). Skips OAuth2 endpoints.
- **Token format:** `NX036.${btoa(clientId:timestamp)}`
- **Issues:**
  - 🟡 Token is trivially decodable (base64 of clientId:timestamp) — provides only basic gateway identification, not security.

#### `authFetch.ts` (authenticated HTTP client)
- **What it does:** Adds `Authorization: Bearer <token>`, `X-Session-Id`, `Accept-Language`, `X-nx036-auth` headers. Handles 401 with token refresh. Proactive refresh for expired tokens.
- **Token refresh:** Serialized via `refreshOnce()` — prevents concurrent refresh requests.
- **Issues:**
  - Proactive refresh checks `isTokenExpired()` which has 30-second buffer — good.
  - On 401 after failed refresh, clears tokens — AuthContext detects and redirects.

#### `token.ts` (JWT/token management)
- **What it does:** localStorage-based token storage (access, refresh, type, expiresAt). JWT decode (payload only).
- **Issues:**
  - Tokens in localStorage are vulnerable to XSS. This is a common pattern but worth noting.

#### `sessionId.ts` (anonymous session)
- **What it does:** Generates UUID v4 for guest cart/checkout, stored in localStorage. Sent as `X-Session-Id` header.
- **Issues:** None.

#### `cache.ts` (TTL cache)
- **What it does:** Generic in-memory Map-based cache with TTL expiry.
- **Issues:** None.

#### `urls.ts` (URL builder)
- **What it does:** Centralized URL builder with `slugify()` function. Generates clean URLs for all routes.
- **Issues:** None.

#### `AppError.ts` (error hierarchy)
- **What it does:** Typed error classes: `AppError`, `NetworkError`, `AuthError`, `ApiError`, `NotFoundError`, `ValidationError`.
- **Issues:** None — well-structured error handling.

---

### 2.10 Types

#### `product.ts` (58 lines)
- **Core `Product` type** with fields: `id`, `name`, `slug`, `sku`, `brand`, `description`, `shortDescription`, `price`, `priceMax`, `originalPrice`, `salePrice`, `costPrice`, `taxClass`, `category`, `subcategory`, `keywords`, `image`, `images`, `rating`, `reviews`, `stock`, `barcode`, `stockStatus`, `manageStock`, `allowBackorder`, `attributes`, `variants`, `weight`, `dimensions`, `shippingClass`, `metaTitle`, `metaDescription`, `status`, `visibility`, `featured`, `warrantyId`.
- **Issues:** `salePrice` and `costPrice` are defined but never populated by the mapper.

---

## 3. FLOW-BY-FLOW ANALYSIS

### Flow 1: Home → Product Browse

```
User visits / or /store or /store/:catSlug
  → Layout renders Header + Footer
  → Home.tsx initializes
    → useNexaCategories() fetches all categories
    → useNexaProducts(activeCategoryId) fetches products
      → nexaProductRepository.findMany() → GET /api/v1/products
      → Response mapped via mapNexaProduct() → Product[]
    → CategoryBar fetches featured categories
    → PromoSlider fetches active slides from CMS
    → Products rendered via ProductCard components
    → IntersectionObserver triggers loadMore() for infinite scroll
    → User applies filters (brand, price, attribute) → CLIENT-SIDE filtering
    → User changes sort → CLIENT-SIDE sorting
```

**Data flow:** CJ API → mic-productcategory → API Gateway → nxFetch → NexaProductMapper → Product[] → Home.tsx client-side filter/sort → ProductCard[]

### Flow 2: Product Detail

```
User clicks product → navigates to /product/:id
  → ProductDetail.tsx initializes
    → nexaProductRepository.findDetailByPid(id) → GET /api/v1/products/detail/{pid}
    → Response mapped via mapNexaProductDetail() → Product with variants
    → addToRecentlyViewed(product)
    → Images extracted from description HTML + product images
    → Variant selectors rendered from product.variants
    → User selects variant → displayPrice/displayStock update
```

**Data flow:** CJ API detail → mic-productcategory → API Gateway → nxFetch → NexaProductMapper.mapNexaProductDetail() → Product → variant selection → display

### Flow 3: Add to Cart

```
User clicks "Add to Cart" on ProductDetail:
  → Validates: variant must be selected if variants exist
  → Validates: quantity > 0 and ≤ displayStock
  → CartContext.addToCart(product) with variantId + selectedAttrs
    → IF authenticated:
      → Optimistic: update local state immediately
      → Background: cartRepository.addItem() → POST /api/v1/cart/items
    → IF guest:
      → Add to localStorage cart
      → No backend call

User clicks quick-add on ProductCard / QuickViewModal:
  → addToCart(product) WITHOUT variant info ⚠️
  → Same flow as above but no variant validation
```

### Flow 4: Cart Page

```
User navigates to /cart
  → Cart.tsx reads from CartContext
  → Displays items with quantity controls
  → Subtotal = sum(price × quantity)
  → Shipping/Tax = "Calculado en el checkout"
  → User clicks "Proceder al checkout" → navigates to /checkout
```

### Flow 5: Checkout

```
User navigates to /checkout
  → Checkout.tsx initializes:
    → Loads UserContext (profile, addresses, payment methods)
    → shippingRepository.getOptions() → shipping methods
    → taxRepository.calculate() → initial tax (may use fallback 10%)
    
Step 1 — Contact:
    → Pre-fills email/phone from profile
    → Validates email format, phone length
    
Step 2 — Address:
    → Shows saved addresses OR new address form
    → Options: Home delivery / Store pickup (MOCK) / Pickup point (MOCK)
    → Address change triggers tax recalculation (400ms debounce)
    
Step 3 — Payment:
    → Shows saved payment methods OR new method form
    → Options: Card / PayPal / USDT / BTC
    → Crypto: shows MOCK wallet addresses, HARDCODED BTC price
    
Order Submit:
    1. Build shippingAddress object from selected/entered address
    2. orderRepository.createOrder({ shippingAddress, paymentMethod, couponCode, notes })
       → POST /api/v1/orders
    3. paymentRepository.processPayment({ orderId, userId, amount, currency, paymentMethod })
       → POST /api/v1/payments/process
    4. Try invoiceRepository.findByOrderId(orderId)
       → GET /api/v1/invoices/order/{orderId}
    5. clearCart()
    6. Show confirmation with InvoiceDocument
```

### Flow 6: Order Confirmation

```
After successful order+payment:
  → Checkout shows confirmation screen with:
    → InvoiceDocument component
    → Invoice data from API OR fallback from order snapshot
    → QR code for verification
    → Print/download buttons
    → "Volver a la tienda" and "Ver mis pedidos" links
```

---

## 4. PRICE CALCULATION AUDIT

### Price Origin
| Stage | Source | Calculation |
|---|---|---|
| Product List | CJ `sellPrice` string | Parsed as range: `min` → `price`, `max` → `priceMax` |
| Product Detail | CJ `sellPrice` + `suggestedPrice` | `price` = min sell, `originalPrice` = suggested if > price |
| Variant Price | CJ `variantSellPrice` | `parseFloat()` |
| Cart | CartItem.price | From catalog enrichment or backend `unitPrice` |
| Cart Total | CartContext | `Σ(price × quantity)` — NO modifiers |
| Checkout Subtotal | CartContext.getTotalPrice() | Same as cart total |
| Checkout Tax | TaxRepository API | `taxAmount` from API, fallback `subtotal × 0.1` |
| Checkout Shipping | Selected option | `shippingOption.price` |
| Checkout Coupon | CouponRepository API | `discount` from validation response |
| **Checkout Total** | Checkout.tsx | **`max(0, subtotal + shipping + tax - couponDiscount)`** |

### Discount Display
| Location | Formula |
|---|---|
| ProductCard | `Math.round(((originalPrice - price) / originalPrice) × 100)` |
| ProductDetail | Same as above, uses `displayPrice` (variant-aware) |
| QuickViewModal | Same formula |

### ⚠️ Price Integrity Gaps
1. **No server-side price validation at order creation** — client sends `paymentMethod` and `couponCode`, but the actual order total is computed server-side based on cart. If cart prices are stale, the order total may differ from what the user saw.
2. **Cart prices can become stale** — enrichment fetches catalog price, but if price changes between add-to-cart and checkout, the displayed subtotal is wrong.
3. **No price locking mechanism** — there's no "price freeze" between cart and order creation.

---

## 5. TAX, SHIPPING, COUPON APPLICATION

### Tax
- **API:** `GET /api/v1/taxes/calculate?subtotal={X}&country={Y}&state={Z}`
- **Returns:** `{ subtotal, taxAmount, total, appliedRates: [{ name, rate, amount }] }`
- **Applied in:** Checkout.tsx only (not Cart.tsx)
- **Timing:** Recalculated on subtotal/address change with 400ms debounce
- **⚠️ Fallback:** `subtotal × 0.1` (10%) when API fails — potentially incorrect for user's jurisdiction
- **⚠️ Not displayed on Cart page** — user has no tax estimate before checkout

### Shipping
- **API:** `GET /api/v1/shipping/options`
- **Applied in:** Checkout.tsx only
- **Selection:** First option auto-selected, user can change
- **⚠️ Not address-dependent** — same options/prices regardless of destination
- **⚠️ FREE_SHIPPING coupon overrides shipping to $0**

### Coupons
- **API:** `POST /api/v1/coupons/validate` with `{ code, orderTotal }`
- **Types:** `PERCENTAGE` (% off subtotal), `FIXED` (flat $ off), `FREE_SHIPPING` (zero shipping)
- **Applied in:** Checkout.tsx only (no coupon input on Cart page)
- **⚠️ Validated once on apply** — not re-validated if cart changes afterward
- **⚠️ Single coupon limit** — UI allows only one coupon code

### Campaigns
- **CmsRepository has CampaignRepository** with full CRUD — but NO integration in the storefront flow. Campaigns exist in the backend but are NOT surfaced in pricing or product display.
- **FlashDeals component exists** but reads from `StoreContext.products` which is EMPTY.
- **No campaign-based automatic discounts** applied to products or cart.

---

## 6. CRITICAL ISSUES & GAPS

### 🔴 CRITICAL (Business Impact)

| # | Issue | File(s) | Impact |
|---|---|---|---|
| C1 | **Checkout NOT auth-guarded** | routes.tsx | Anonymous users see checkout page but all API calls fail — broken UX, potential error flood |
| C2 | **Fabricated stock numbers** | NexaProductMapper.ts | FALLBACK_STOCK=50, VARIANT_FALLBACK_STOCK=20 make 0-stock items appear available — orders for unavailable products |
| C3 | **Quick-add bypasses variant selection** | ProductCard.tsx, QuickViewModal.tsx | Products with variants added at base price without variant info — backend may reject or assign wrong variant |
| C4 | **FlashDeals always empty** | FlashDeals.tsx, StoreContext.tsx | FlashDeals reads from MOCK empty products — feature is dead code |
| C5 | **Related products always empty** | ProductDetail.tsx, StoreContext.tsx | Same issue — related products section never renders |
| C6 | **Reviews not persisted** | ProductDetail.tsx | Reviews are local state only — lost on refresh. No backend API integration |
| C7 | **Mock store locations** | Checkout.tsx | Store pickup addresses are hardcoded fakes — customers would receive invalid locations |
| C8 | **Mock crypto wallets** | Checkout.tsx | USDT/BTC addresses are hardcoded constants — payments would go to wrong/nonexistent wallets |
| C9 | **BTC price hardcoded at $68,500** | Checkout.tsx | Crypto amount calculation uses stale price — massive over/under-charge risk |
| C10 | **Optimistic cart updates without rollback** | CartContext.tsx | If backend add-item fails, local state shows item that doesn't exist server-side |

### 🟡 MEDIUM (Degraded Experience)

| # | Issue | File(s) | Impact |
|---|---|---|---|
| M1 | **Tax fallback is 10%** | Checkout.tsx | Incorrect tax charged when API fails |
| M2 | **Footer links broken** | Footer.tsx | Use legacy `/?category=X` instead of `/store/x` — dead links |
| M3 | **No stock re-validation at checkout** | Checkout.tsx | Stale stock/price from cart not checked before order creation |
| M4 | **Client-side filtering only** | Home.tsx | All products downloaded, filtered in browser — scales poorly |
| M5 | **Shipping not address-dependent** | ShippingRepository.ts, Checkout.tsx | Same shipping options regardless of destination country |
| M6 | **No address validation** | Checkout.tsx | No postal code validation, geocoding, or delivery zone check |
| M7 | **Coupon not re-validated at submit** | Checkout.tsx | Coupon validated on apply, not re-checked when order is created |
| M8 | **Compare list not persisted** | CompareContext.tsx | Lost on page refresh |
| M9 | **Filter config hardcoded for 5 categories** | filters.ts | New categories from CJ have no filter options |
| M10 | **Category name Spanish mismatch** | filters.ts | Filters use Spanish names but CJ API returns English category names |
| M11 | **Payment after order is not atomic** | Checkout.tsx | Order created first, then payment — failure leaves order without payment |
| M12 | **No price locking** | Cart→Checkout | Price can change between add-to-cart and order creation |

### 🔵 LOW (Polish / Technical Debt)

| # | Issue | File(s) | Impact |
|---|---|---|---|
| L1 | `salePrice` / `costPrice` fields never populated | NexaProductMapper.ts, product.ts | Dead type fields |
| L2 | Variant attribute parsing assumes dash separator | NexaProductMapper.ts | Multi-word values may misparse |
| L3 | 3D tilt on ProductCard may hurt perf on mobile | ProductCard.tsx | UX on low-end devices |
| L4 | PromoSlider fallback uses Unsplash URLs | PromoSlider.tsx | External dependency, CORS risk |
| L5 | Infinite scroll accumulates ALL pages in memory | useNexaProducts.ts | Memory issue with large catalogs |
| L6 | JWT decoded without signature verification | AuthContext.tsx | Acceptable for UI, but noted |

---

## 7. SECURITY CONCERNS

| # | Concern | Details |
|---|---|---|
| S1 | **Tokens in localStorage** | Vulnerable to XSS. Consider httpOnly cookies for refresh token. |
| S2 | **nxFetch gateway token is trivially decodable** | `btoa(clientId:timestamp)` — not a security measure, only identification. |
| S3 | **DOMPurify used for description HTML** | Good — sanitizes CJ HTML before `dangerouslySetInnerHTML`. |
| S4 | **No CSRF protection** | API calls use Bearer tokens (stateless) — CSRF not applicable for JWT-based auth. |
| S5 | **Checkout accepts unauthenticated access** | Should redirect to login — potential abuse vector. |

---

## 8. RECOMMENDATIONS

### Immediate (Pre-Launch Blockers)

1. **Add AuthGuard to checkout route** — Move `/checkout` under the authenticated route tree or add inline auth check.
2. **Remove fabricated stock fallbacks** — Set `FALLBACK_STOCK = 0` and `VARIANT_FALLBACK_STOCK = 0`, or better, show "Contact for availability" when stock is unknown.
3. **Disable quick-add for multi-variant products** — Either force navigation to detail page or show variant picker in modal.
4. **Replace mock crypto wallets** — Integrate with real payment processor or remove crypto payment option.
5. **Replace hardcoded BTC price** — Fetch from CoinGecko/Binance API or remove BTC payment.
6. **Remove mock store locations and pickup points** — Either integrate with real location API or disable these delivery options.
7. **Fix Footer links** — Use `urls.category()` from `lib/urls.ts` instead of query params.

### Short-term (Sprint 1-2)

8. **Wire FlashDeals to real data** — Use `useNexaProducts` or a dedicated campaigns API instead of StoreContext mock.
9. **Wire related products** — Fetch from API based on category/tags instead of relying on StoreContext.
10. **Fix optimistic cart update** — Add rollback on backend failure (revert local state, show error toast).
11. **Add stock/price re-validation** — Re-fetch cart item availability at checkout start.
12. **Make shipping address-dependent** — Pass destination to shipping API.
13. **Persist reviews** — Create backend review CRUD or integrate third-party review service.
14. **Make payment atomic with order** — Use backend saga/orchestration so order+payment succeed or fail together.

### Medium-term (Sprint 3-5)

15. **Move filtering server-side** — Add query params to `/api/v1/products` for brand, price range, attributes.
16. **Add product list virtualization** — Use `react-window` or `@tanstack/react-virtual` for large catalogs.
17. **Campaign integration** — Surface CampaignRepository data in product prices and banners.
18. **Address validation** — Integrate postal code validation and delivery zone checking.
19. **Re-validate coupons at order submit** — Or ensure backend validates coupon during order creation.
20. **Persist compare list** — Use localStorage or backend.

---

*End of audit report.*
