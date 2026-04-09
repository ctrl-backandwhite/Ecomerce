# PLAN_COHERENCIA_SITIO.md — Auditoría Integral de Coherencia del Sitio

> **Fecha:** Junio 2025  
> **Plataforma:** NX036 eCommerce  
> **Alcance:** 8 microservicios backend + frontend React  
> **Objetivo:** Documentar qué funciona correctamente, qué está roto o incompleto, y plan de implementación priorizado.

---

## 1. Arquitectura Actual

### 1.1 Backend (Java 21 / Spring Boot 4.0.5 / Hexagonal)

| Microservicio | Puerto | Responsabilidad |
|---|---|---|
| mic-coreservice (app-common) | — | Módulo compartido: Money VO, Currency enum, CurrencyHolder, CurrencyRateCache, PriceConversionService |
| mic-productcategory | 8081 | Catálogo de productos: CRUD, PricingService (márgenes + conversión de moneda), TaxCalculationService |
| mic-orderservice | 8082 | Pedidos, carrito, cupones, shipping, tax, facturas |
| mic-paymentservice | 8083 | Procesamiento de pagos: Stripe (tarjeta), PayPal, Crypto (USDT/BTC) |
| mic-apigatewayservice | 8080 | Gateway API: routing, autenticación, rate limiting |
| mic-authservice | 8084 | OAuth2 Authorization Server: PKCE, JWT |
| mic-userdetailservice | 8085 | Perfiles de usuario, direcciones, métodos de pago |
| mic-notificationservice | 8086 | Notificaciones por email/Kafka |
| mic-cmsservice | 8087 | CMS: campañas, tipos de cambio, contenido |

### 1.2 Frontend (React 18.3.1 / Vite / TypeScript)

| Capa | Componentes |
|---|---|
| Contexts (9) | Auth, Cart, Compare, Currency, Language, Newsletter, RecentlyViewed, Timezone, User |
| Repositories (39+) | NexaProduct, Order, Cart, Payment, Shipping, Tax, Currency, Invoice, Coupon, Loyalty, etc. |
| Types (7 archivos) | product.ts, api.ts, currency.ts, admin.ts, giftcard.ts, invoice.ts, review.ts |
| Mapper | NexaProductMapper.ts |
| Config | api.ts, filters.ts, priceRanges.ts |

### 1.3 Flujo de Conversión de Moneda (Pipeline)

```
Usuario selecciona país → CurrencyContext detecta moneda → localStorage "nexa-currency"
                                          ↓ (window.location.reload)
Frontend envía header X-Currency: EUR → API Gateway propaga el header
                                          ↓
CurrencyRequestFilter → CurrencyHolder (ThreadLocal) → PricingService lee CurrencyHolder
                                          ↓
CurrencyRateCache (5min TTL, CMS) → rate = 0.92 (EUR/USD)
                                          ↓
PricingService.convertProductToRequestCurrency() → convierte sellPrice, costPrice, variantes
                                          ↓
ProductDtoOut: sellPriceRaw=27.60, currencyCode="EUR", currencySymbol="€"
                                          ↓
Frontend NexaProductMapper: product.price = sellPriceRaw → CurrencyContext.formatPrice() → "€27,60"
```

---

## 2. Lo que está CORRECTO ✅

### 2.1 Catálogo de Productos
- ✅ **PricingService** convierte precios a la moneda del usuario server-side (márgenes + conversión)
- ✅ **ProductDtoOut** incluye `sellPriceRaw`, `costPriceRaw`, `currencyCode`, `currencySymbol`
- ✅ **NexaProductMapper** usa `sellPriceRaw` (pre-convertido) cuando está disponible
- ✅ **Money VO** inmutable, scale=2, HALF_UP, con `convertTo()` y `convertViaUsd()`
- ✅ **Currency enum** soporta 12 monedas (USD, EUR, BRL, MXN, ARS, CLP, COP, PEN, HNL, VES, PYG, PAB)
- ✅ **CurrencyRateCache** con TTL de 5 minutos, fallback a `BigDecimal.ONE` en caso de fallo

### 2.2 Carrito de Compras
- ✅ **Modo dual** — localStorage para invitados, API backend para autenticados
- ✅ **Merge de carrito** al iniciar sesión (fusiona items anónimos → carrito del usuario)
- ✅ **Optimistic updates con rollback** en CartContext
- ✅ **CartApiMapper** usa MapStruct con MoneyMapperHelper para `Money ↔ BigDecimal`

### 2.3 Pedidos
- ✅ **Flujo DRAFT → PENDING** — Crea pedido en borrador, procesa pago, confirma
- ✅ **Verificación de precios** — OrderUseCaseImpl re-verifica contra catálogo + campañas activas
- ✅ **Verificación de stock** — Comprueba disponibilidad antes de crear el pedido
- ✅ **Descuento de campañas** — `CmsPort.calculateBestCampaignDiscount()` server-side
- ✅ **Cupones con scope** — Filtra por productos/categorías aplicables
- ✅ **Multi-currency en pedidos** — `currencyCode` + `exchangeRateToUsd` se almacenan
- ✅ **Conversión de precios en order creation** — Si `currencyCode ≠ USD`, convierte subtotal, shipping, tax, discount
- ✅ **Factura auto-generada** al confirmar pedido
- ✅ **Deducción de stock vía Kafka** al confirmar
- ✅ **Email de factura** vía Kafka → notification service
- ✅ **Máquina de estados de pedido** con transiciones válidas

### 2.4 Pagos
- ✅ **Idempotency key** en procesamiento de pagos (evita duplicados)
- ✅ **Flujo de reembolsos** parciales y totales
- ✅ **PaymentGateway pattern** — Strategy pattern con `resolveGateway(method)`
- ✅ **PaymentMethod enum** — CARD, PAYPAL, USDT, BTC
- ✅ **Eventos Kafka** — payment.initiated, payment.confirmed, payment.failed, refund.completed

### 2.5 Impuestos y Envío
- ✅ **Tax calculation** vía backend con reglas por país/región
- ✅ **Shipping options** vía backend con reglas por país, peso y subtotal
- ✅ **ShippingOptionsDtoOut** incluye `currencyCode`
- ✅ **TaxCalculationDtoOut** incluye `currencyCode`

### 2.6 Frontend General
- ✅ **CurrencyContext** — Delega conversión al backend (identity `convertPrice`)
- ✅ **formatPrice** usa `Intl.NumberFormat` con el currency code correcto
- ✅ **OAuth2 PKCE** flow completo en AuthContext
- ✅ **Auto-detección de moneda** basada en país del usuario

---

## 3. Lo que está MAL o INCOMPLETO ❌

### P0 — CRÍTICO (Bloquean funcionalidad core)

#### ❌ F1: CreateOrderPayload NO envía currencyCode

**Frontend** — `OrderRepository.ts`
```typescript
export interface CreateOrderPayload {
    shippingAddress: Record<string, unknown>;
    billingAddress?: Record<string, unknown>;
    paymentMethod: string;
    couponCode?: string;
    giftCardCode?: string;
    giftCardAmount?: number;
    loyaltyPointsUsed?: number;
    loyaltyDiscount?: number;
    notes?: string;
    // ⚠️ FALTA: currencyCode
}
```

**Backend** — `CreateOrderDtoIn.java`
```java
private String currencyCode;  // ← el backend lo espera pero el frontend no lo envía
```

**Impacto:** El pedido SIEMPRE se crea en USD, sin importar la moneda seleccionada por el usuario. La conversión multi-moneda en `OrderUseCaseImpl` (sección 4.5) nunca se activa porque `currencyCode` llega como null → resuelve a "USD".

**Fix:** Agregar `currencyCode?: string` a `CreateOrderPayload` y enviarlo en `useCheckoutSubmit.ts`.

---

#### ❌ F2: Checkout hardcodea currency:"USD" en el pago

**Archivo:** `useCheckoutSubmit.ts`
```typescript
await paymentRepository.processPayment({
    orderId: order.id,
    userId: user.id,
    email: contact.email || user.email,
    amount: total,
    currency: "USD",  // ⚠️ HARDCODED — debería ser la moneda del usuario/pedido
    paymentMethod: methodMap[activeType] ?? "CARD",
});
```

**Impacto:** El pago siempre se registra como USD independientemente de la moneda del pedido. Si el pedido es de €92.00, el pago se registra como $92.00 USD (monto correcto pero moneda incorrecta).

**Fix:** Usar la moneda del `CurrencyContext` o la moneda devuelta en la respuesta de creación del pedido.

---

#### ❌ F3: Lógica de cobro en pasarela NO implementada (Requisito del negocio)

**Requisito:**
> "Si es tarjeta, internamente se cobrará en USDT. Si en cripto, en criptos."

**Estado actual:** `PaymentUseCaseImpl` simplemente pasa la moneda que recibe al gateway, sin ninguna conversión interna:

```java
// PaymentUseCaseImpl.java — NO hay lógica de routing de moneda
Payment payment = repository.save(Payment.builder()
    .currency(currency != null ? currency : "USD")  // Pass-through
    .paymentMethod(method)
    .build());
```

**Lo que falta:**
1. **Para CARD:** Convertir `amount` de `order.currency` → USDT equivalente → cobrar en USDT vía Stripe
2. **Para USDT:** Cobrar directamente en USDT
3. **Para BTC:** Cobrar directamente en BTC
4. **Para PAYPAL:** Definir política (¿USD? ¿moneda local?)
5. **Nuevos campos en Payment:** `settlementAmount`, `settlementCurrency`, `exchangeRate`
6. **Integración con rate provider** para conversión a USDT (CoinGecko / CMS)

---

#### ❌ F4: El carrito NO tiene tracking de moneda

**Backend** — `CartItem.java`
```java
public class CartItem {
    private Money unitPrice;    // ← ¿En qué moneda?
    private String productName;
    // ⚠️ FALTA: currencyCode
}
```

**Backend** — `Cart.java`
```java
public class Cart {
    private Money subtotal;
    // ⚠️ FALTA: currencyCode
}
```

**Flujo problemático:**
1. Usuario selecciona EUR
2. Frontend muestra precio del producto: €27.60 (convertido por PricingService)
3. User agrega al carrito → frontend envía `unitPrice: 27.60` al backend
4. Backend almacena `unitPrice = Money(27.60)` sin saber que es EUR
5. Al crear orden → `OrderUseCaseImpl` re-verifica contra catalogo → obtiene precio USD $30.00
6. `ci.getUnitPrice() ≠ verifiedPrice` → **Corrección de precio** → Se usa $30.00
7. Luego se aplica conversión multi-moneda si se envía currencyCode

**Resultado:** El precio del carrito se sobreescribe con el precio del catálogo (USD). Esto no causa un error funcional grande PORQUE el pedido recalcula todo, pero genera logs de warnings con "Price correction" constantemente y el subtotal mostrado en el carrito frontend puede no coincidir con el del pedido.

**Fix:** Opción A: Los precios del carrito siempre deben ser en USD (base), y la conversión se aplica solo al mostrar. Opción B: Agregar `currencyCode` al carrito y hacer la conversión al crear el pedido.

---

### P1 — ALTO (Funcionalidad degradada)

#### ❌ F5: Frontend Order type no tiene campos de moneda

**Frontend** — `OrderRepository.ts`
```typescript
export interface Order {
    // ... todos los campos monetarios son number
    subtotal: number;
    total: number;
    // ⚠️ FALTA: currencyCode, exchangeRateToUsd
}
```

**Backend** — `OrderDtoOut.java`
```java
private String currencyCode;
private BigDecimal exchangeRateToUsd;
```

**Impacto:** El historial de pedidos y detalle de pedido no pueden mostrar la moneda correcta. El usuario ve "$92.00" cuando debería ver "€92.00".

---

#### ❌ F6: Payment type tiene nombre de campo incorrecto

**Frontend:**
```typescript
export interface Payment {
    method: string;  // ← "method"
}
```

**Backend** — `PaymentDtoOut.java`:
```java
private PaymentMethod paymentMethod;  // ← "paymentMethod"
```

**Impacto:** Jackson serializa como `paymentMethod` pero el frontend lee `method`. El campo será `undefined` en el frontend.

---

#### ❌ F7: Mismatch de paymentMethod entre order y payment

**Checkout crea order con:**
```typescript
const paymentMethodMap = {
    card: "CREDIT_CARD",   // ← para el Order
    paypal: "PAYPAL", usdt: "CRYPTO_USDT", btc: "CRYPTO_BTC",
};
```

**Checkout procesa pago con:**
```typescript
const methodMap = {
    card: "CARD",          // ← para el Payment
    paypal: "PAYPAL", usdt: "USDT", btc: "BTC",
};
```

**Backend PaymentMethod enum:**
```java
enum PaymentMethod { CARD, PAYPAL, USDT, BTC }
```

**Impacto:** El pedido almacena `"CREDIT_CARD"` como método de pago, pero el sistema de pagos usa `"CARD"`. La factura formatea `"CREDIT_CARD"` como "Tarjeta de crédito" (funciona), pero no hay consistencia. Si el backend necesita correlacionar el payment method del order con el del payment, fallará.

**Fix:** Unificar a un solo enum de payment methods usado en ambos lados.

---

#### ❌ F8: ProductDetailDtoOut NO tiene campos de moneda

**ProductDtoOut (lista):**
```java
private String currencyCode;      // ✅
private String currencySymbol;    // ✅ 
private BigDecimal sellPriceRaw;  // ✅
private BigDecimal costPriceRaw;  // ✅
```

**ProductDetailDtoOut (detalle):**
```java
// ⚠️ FALTAN: currencyCode, currencySymbol, sellPriceRaw, costPriceRaw
```

**Impacto:** La página de detalle del producto no puede mostrar correctamente la moneda ni el precio pre-convertido.

---

#### ❌ F9: Filtros de precio hardcodeados en USD

**priceRanges.ts:**
```typescript
export const priceRanges = [
    { label: "Todos", min: 0, max: Infinity },
    { label: "Hasta $50", min: 0, max: 50 },
    { label: "$50 – $150", min: 50, max: 150 },
    { label: "$150 – $500", min: 150, max: 500 },
    { label: "$500 – $1000", min: 500, max: 1000 },
    { label: "Más de $1000", min: 1000, max: Infinity },
];
```

**Impacto:** Si el backend retorna precios en EUR, los filtros comparan EUR contra umbrales USD. Un producto de €45 (≈$49 USD) no aparecería en "Hasta $50" porque es €45 < 50 → lo incluye, pero es impreciso. Para monedas con tasa alta (BRL, ARS), los filtros son inútiles.

**Fix:** Convertir los rangos dinámicamente usando la tasa de cambio, o recibir los rangos del backend.

---

### P2 — MEDIO (Funcionalidad parcial o inconsistente)

#### ❌ F10: selectedAttrs del carrito no se persisten en backend

**Frontend envía:**
```typescript
interface AddItemPayload {
    selectedAttrs?: Record<string, string>;  // { "Color": "Rojo", "Talla": "M" }
}
```

**Backend CartItemDtoIn:**
```java
public class CartItemDtoIn {
    // ⚠️ NO tiene selectedAttrs — Jackson lo ignora silenciosamente
}
```

**Backend CartItem:**
```java
public class CartItem {
    // ⚠️ NO tiene selectedAttrs
}
```

**Impacto:** Los atributos seleccionados (color, talla) se pierden cuando el carrito es server-side. Solo se conserva el `variantId`, que es suficiente para el pedido, pero la UI no puede mostrar los atributos seleccionados desde el backend cart.

---

#### ❌ F11: Totales del checkout calculados en frontend y backend separadamente

**Frontend** (`Checkout.tsx` + `useCheckoutSubmit.ts`):
```typescript
const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
const tax = state.taxCalc?.taxAmount ?? subtotal * 0.1;  // ← FALLBACK 10%!
const total = subtotal + shipping + tax - couponDiscount - loyaltyDiscount - giftCardDiscount;
```

**Backend** (`OrderUseCaseImpl.java`):
```java
Money subtotal = cart.getItems().stream()...  // Recalcula desde precios verificados
Money taxAmount = shippingTaxUseCase.calculateTax(country, region, subtotal);
Money total = subtotal.add(shippingCost).add(taxAmount).subtract(discountAmount).floor();
```

**El pago usa el total del frontend:**
```typescript
await paymentRepository.processPayment({
    amount: total,  // ← total calculado en frontend, NO el del backend
});
```

**Impacto:** Si los cálculos frontend ≠ backend (por precio corrections, conversión, o rounding), el monto del pago no coincide con el total del pedido. Además, el tax fallback del 10% en frontend es arbitrario.

**Fix:** Usar el `total` del pedido creado (`order.total` de la respuesta) como `amount` en el pago.

---

#### ❌ F12: Frontend CartItemDto.createdAt no existe en backend

**Frontend:**
```typescript
interface CartItemDto {
    createdAt: string | null;  // ←
}
```

**Backend CartItemDtoOut:**
```java
// No tiene createdAt
```

**Impacto:** Menor — `createdAt` será siempre null. No afecta funcionalidad.

---

#### ❌ F13: Frontend CryptoPayment type vs Backend CryptoCreateDtoIn/PaymentDtoOut

**Frontend:**
```typescript
interface CryptoPayment {
    network: string;   // ← Backend no tiene "network" en PaymentDtoOut
    expiresAt: string; // ← Backend: cryptoExpiresAt
    status: "AWAITING" | "CONFIRMED" | "EXPIRED";  // ← Backend: PaymentStatus enum diferente
}
```

**Backend PaymentDtoOut:**
```java
private String cryptoAddress;
private Instant cryptoExpiresAt;  // ← "cryptoExpiresAt", no "expiresAt"
private String qrCodeUrl;
// No tiene "network"
```

**Impacto:** Deserialización crypto incorrecta — campos null/undefined en frontend.

---

### P3 — BAJO (Deuda técnica / mejoras)

#### ⚠️ F14: Duplicate useNexaProducts

- `src/app/services/useNexaProducts.ts`
- `src/app/hooks/useNexaProducts.ts`

Implementaciones casi idénticas. Consolidar en una sola.

---

#### ⚠️ F15: BTC rate se obtiene de CoinGecko en frontend

```typescript
// Checkout.tsx
fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd")
```

Debería obtenerse del backend para consistencia con las tasas de cambio del CMS.

---

#### ⚠️ F16: Mock payment gateways

- `StripeGatewayAdapter` — Retorna mock success
- `CryptoGatewayAdapter` — Genera direcciones crypto falsas
- `PayPalGatewayAdapter` — Probablemente mock

No es un bug, pero bloqueará pagos reales.

---

#### ⚠️ F17: Frontend no recolecta billingAddress

El checkout solo recolecta `shippingAddress`. El backend usa `shippingAddress` como fallback. Es correcto para MVP pero debería ser opcional configurable.

---

## 4. Diagrama de Flujo del Checkout (Estado Actual vs Esperado)

### 4.1 Estado Actual (BUGGY)

```
┌─ CHECKOUT ──────────────────────────────────────────────────────────────┐
│                                                                         │
│  1. Frontend calcula totales client-side                                │
│     subtotal = Σ(item.price * qty)   ← precio en moneda del usuario    │
│     tax = taxCalc?.taxAmount ?? subtotal * 0.1  ← FALLBACK 10%!        │
│     total = subtotal + shipping + tax - discounts                       │
│                                                                         │
│  2. Crea orden:                                                         │
│     POST /api/v1/orders                                                 │
│     ❌ NO envía currencyCode → backend asume USD                        │
│     → Backend re-verifica precios contra catálogo (USD)                 │
│     → Backend NO convierte moneda (currencyCode es null → USD)          │
│                                                                         │
│  3. Procesa pago:                                                       │
│     POST /api/v1/payments/process                                       │
│     amount = total (calculado en frontend, posiblemente en EUR)          │
│     ❌ currency = "USD" (HARDCODED)                                     │
│     → Backend almacena pago en "USD" con monto que podría ser EUR       │
│                                                                         │
│  4. Confirma orden:                                                     │
│     POST /api/v1/orders/me/{id}/confirm                                 │
│     → Stock deducido, factura creada, email enviado                     │
│                                                                         │
│  RESULTADO: Pedido en USD, pago en "USD" con monto incorrecto          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Estado Esperado (CORRECTED)

```
┌─ CHECKOUT ──────────────────────────────────────────────────────────────┐
│                                                                         │
│  1. Crea orden con currencyCode del usuario:                            │
│     POST /api/v1/orders { ...payload, currencyCode: "EUR" }            │
│     → Backend verifica precios (USD base), convierte a EUR               │
│     → Responde con order.total en EUR, order.currencyCode = "EUR"       │
│                                                                         │
│  2. Procesa pago usando datos DEL ORDER:                                │
│     POST /api/v1/payments/process                                       │
│     amount = order.total (del backend, ya convertido)                   │
│     currency = order.currencyCode ("EUR")                               │
│     paymentMethod = "CARD"                                              │
│                                                                         │
│  3. NUEVO — Payment routing interno:                                    │
│     PaymentUseCaseImpl detecta method=CARD → settlement=USDT            │
│     Convierte EUR 92.00 → USDT 100.00 (usando tasa EUR/USDT)           │
│     Cobra en USDT via Stripe                                            │
│     Almacena: amount=92.00 EUR, settlementAmount=100.00 USDT            │
│                                                                         │
│  4. Si method=USDT/BTC → cobra directamente en esa cripto              │
│     Convierte EUR 92.00 → USDT 100.00 o BTC 0.00146                   │
│     Genera address + QR para el monto exacto                           │
│                                                                         │
│  5. Confirma orden + factura + stock + email                            │
│                                                                         │
│  RESULTADO: Pedido en EUR, pago liquidado en USDT/BTC, todo coherente  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Matriz de Mapeo DTO Frontend ↔ Backend

### 5.1 Order

| Frontend (CreateOrderPayload) | Backend (CreateOrderDtoIn) | ¿Match? |
|---|---|---|
| shippingAddress | shippingAddress | ✅ |
| billingAddress? | billingAddress | ✅ |
| paymentMethod | paymentMethod | ⚠️ Valores diferentes (CREDIT_CARD vs CARD) |
| couponCode? | couponCode | ✅ |
| giftCardCode? | giftCardCode | ✅ |
| giftCardAmount? | giftCardAmount | ✅ |
| loyaltyPointsUsed? | loyaltyPointsUsed | ✅ |
| loyaltyDiscount? | loyaltyDiscount | ✅ |
| notes? | notes | ✅ |
| ❌ **FALTA** | currencyCode | ❌ |

| Frontend (Order response) | Backend (OrderDtoOut) | ¿Match? |
|---|---|---|
| subtotal, total, etc. (number) | subtotal, total, etc. (BigDecimal → number) | ✅ |
| ❌ **FALTA** | currencyCode (String) | ❌ |
| ❌ **FALTA** | exchangeRateToUsd (BigDecimal) | ❌ |

### 5.2 Cart

| Frontend (AddItemPayload) | Backend (CartItemDtoIn) | ¿Match? |
|---|---|---|
| productId | productId | ✅ |
| variantId? | variantId | ✅ |
| quantity | quantity | ✅ |
| unitPrice | unitPrice | ✅ (pero moneda desconocida) |
| productName | productName | ✅ |
| productImage? | productImage | ✅ |
| selectedAttrs? | ❌ **NO EXISTE** | ❌ |

| Frontend (CartItemDto response) | Backend (CartItemDtoOut) | ¿Match? |
|---|---|---|
| id, productId, variantId, etc. | id, productId, variantId, etc. | ✅ |
| selectedAttrs | ❌ **NO EXISTE** | ❌ |
| createdAt | ❌ **NO EXISTE** | ❌ |

### 5.3 Payment

| Frontend (ProcessPaymentPayload) | Backend (PaymentProcessDtoIn) | ¿Match? |
|---|---|---|
| orderId | orderId | ✅ |
| userId | userId | ✅ |
| email? | email | ✅ |
| amount | amount | ✅ |
| currency? | currency | ⚠️ Frontend HARDCODEA "USD" |
| paymentMethod | paymentMethod | ✅ (enum values match) |
| idempotencyKey? | idempotencyKey | ✅ |

| Frontend (Payment response) | Backend (PaymentDtoOut) | ¿Match? |
|---|---|---|
| id, orderId, userId | id, orderId, userId | ✅ |
| amount, currency | amount, currency | ✅ |
| **method** | **paymentMethod** | ❌ Nombre diferente |
| **transactionId** | **providerRef** | ❌ Nombre diferente |
| status | status | ✅ |
| ❌ **FALTA** | cryptoAddress | ❌ |
| ❌ **FALTA** | cryptoExpiresAt | ❌ |
| ❌ **FALTA** | qrCodeUrl | ❌ |
| ❌ **FALTA** | errorMessage | ❌ |

| Frontend (CryptoPayment) | Backend (PaymentDtoOut crypto fields) | ¿Match? |
|---|---|---|
| address | cryptoAddress | ⚠️ Nombre diferente |
| expiresAt | cryptoExpiresAt | ⚠️ Nombre diferente |
| network | ❌ **NO EXISTE** | ❌ |
| status (AWAITING/CONFIRMED/EXPIRED) | status (PaymentStatus enum diferente) | ❌ |

### 5.4 Product

| Frontend (NexaProduct repo) | Backend (ProductDtoOut) | ¿Match? |
|---|---|---|
| sellPrice, sellPriceRaw | sellPrice, sellPriceRaw | ✅ |
| costPrice, costPriceRaw | costPrice, costPriceRaw | ✅ |
| currencyCode, currencySymbol | currencyCode, currencySymbol | ✅ |
| variants[].variantSellPrice | variants[].variantSellPrice | ✅ |

| Frontend (Product detail) | Backend (ProductDetailDtoOut) | ¿Match? |
|---|---|---|
| ❌ No tiene sellPriceRaw | ❌ **FALTA** sellPriceRaw | ❌ |
| ❌ No tiene currencyCode | ❌ **FALTA** currencyCode | ❌ |

---

## 6. Plan de Implementación por Prioridad

### Sprint 1 — Coherencia de Moneda en Checkout (P0)

| # | Tarea | Archivos | Esfuerzo |
|---|---|---|---|
| **S1-01** | Agregar `currencyCode` a `CreateOrderPayload` frontend | `OrderRepository.ts` | 0.5h |
| **S1-02** | Enviar `currencyCode` del CurrencyContext en `useCheckoutSubmit.ts` | `useCheckoutSubmit.ts` | 0.5h |
| **S1-03** | Usar `order.total` y `order.currencyCode` del backend para el pago (en vez del total calculado client-side) | `useCheckoutSubmit.ts` | 1h |
| **S1-04** | Agregar `currencyCode`, `exchangeRateToUsd` al type Order del frontend | `OrderRepository.ts` | 0.5h |
| **S1-05** | Corregir nombre de campo Payment: `method` → `paymentMethod`, `transactionId` → `providerRef` | `PaymentRepository.ts` | 0.5h |
| **S1-06** | Agregar campos crypto a Payment type: `cryptoAddress`, `cryptoExpiresAt`, `qrCodeUrl`, `errorMessage` | `PaymentRepository.ts` | 0.5h |
| **S1-07** | Unificar paymentMethod strings entre order y payment (usar CARD en vez de CREDIT_CARD) | `useCheckoutSubmit.ts`, `Checkout types` | 0.5h |
| **S1-08** | Actualizar `fmtPaymentMethod()` en backend para soportar "CARD" | `OrderUseCaseImpl.java` | 0.5h |

**Total Sprint 1: ~4.5h**

### Sprint 2 — Payment Currency Routing (P0)

| # | Tarea | Archivos | Esfuerzo |
|---|---|---|---|
| **S2-01** | Agregar campos al domain Payment: `settlementAmount(Money)`, `settlementCurrency(String)`, `exchangeRate(BigDecimal)` | `Payment.java`, `PaymentDtoOut.java`, Entity/Schema | 2h |
| **S2-02** | Crear `PaymentCurrencyRouter` service: define currency rules por payment method (CARD→USDT, USDT→USDT, BTC→BTC, PAYPAL→USD) | Nuevo service en payment service | 3h |
| **S2-03** | Integrar CurrencyRateCache en payment service (o usar CMS rate endpoint) para conversión a USDT/BTC | Config + dependency | 2h |
| **S2-04** | Modificar `PaymentUseCaseImpl.processPayment()` para: (a) resolver settlement currency, (b) convertir amount, (c) cobrar en settlement currency, (d) almacenar ambos amounts | `PaymentUseCaseImpl.java` | 4h |
| **S2-05** | Actualizar `CryptoGatewayAdapter` para recibir amount en crypto nativo | `CryptoGatewayAdapter.java` | 1h |
| **S2-06** | Actualizar frontend Payment type con campos de settlement | `PaymentRepository.ts` | 0.5h |
| **S2-07** | Actualizar factura para mostrar ambas monedas (display currency + settlement currency) | `OrderUseCaseImpl.java` email template | 2h |

**Total Sprint 2: ~14.5h**

### Sprint 3 — Coherencia del Carrito (P1)

| # | Tarea | Archivos | Esfuerzo |
|---|---|---|---|
| **S3-01** | **Decisión de diseño:** Cart siempre almacena precios en USD base. Frontend muestra precios convertidos usando formatPrice() pero envía USD al cart API. | Documento de decisión | 1h |
| **S3-02** | Modificar CartContext: al agregar item, enviar `unitPrice` en USD (usar `costPriceRaw` o base price del producto) | `CartContext.tsx` | 2h |
| **S3-03** | Agregar `currencyCode` a Cart y CartItem domain y DTOs (opcional — para tracking incluso si siempre es USD) | `Cart.java`, `CartItem.java`, DTOs | 2h |
| **S3-04** | Agregar `selectedAttrs` a backend `CartItemDtoIn` y `CartItem` domain | `CartItemDtoIn.java`, `CartItem.java`, entity, schema | 2h |
| **S3-05** | Retornar `selectedAttrs` en `CartItemDtoOut` | `CartItemDtoOut.java`, mapper | 0.5h |

**Total Sprint 3: ~7.5h**

### Sprint 4 — Product Detail + Filtros (P1)

| # | Tarea | Archivos | Esfuerzo |
|---|---|---|---|
| **S4-01** | Agregar `sellPriceRaw`, `costPriceRaw`, `currencyCode`, `currencySymbol` a `ProductDetailDtoOut` | `ProductDetailDtoOut.java`, mapper | 1h |
| **S4-02** | Hacer `priceRanges` dinámicos basados en moneda: multiplicar umbrales por tasa de cambio | `priceRanges.ts` → refactor a hook/function | 2h |
| **S4-03** | Actualizar labels de price ranges con símbolo de moneda correcto | `priceRanges.ts` + componentes que lo usan | 1h |

**Total Sprint 4: ~4h**

### Sprint 5 — Deuda Técnica (P2-P3)

| # | Tarea | Archivos | Esfuerzo |
|---|---|---|---|
| **S5-01** | Consolidar `useNexaProducts` en una sola implementación | `services/useNexaProducts.ts`, `hooks/useNexaProducts.ts` | 1h |
| **S5-02** | Mover obtención de BTC rate al backend (endpoint en CMS o payment service) | `Checkout.tsx`, backend | 2h |
| **S5-03** | Remover CryptoPayment type separado, usar Payment con campos opcionales crypto | `PaymentRepository.ts` | 1h |
| **S5-04** | Eliminar `createdAt` de `CartItemDto` frontend (no existe en backend) | `CartRepository.ts` | 0.5h |
| **S5-05** | Remover tax fallback 10% en checkout, requerir taxCalc del backend | `Checkout.tsx`, `useCheckoutSubmit.ts` | 1h |
| **S5-06** | Agregar billingAddress opcional al checkout UI | Components de checkout | 3h |

**Total Sprint 5: ~8.5h**

---

## 7. Resumen Ejecutivo

| Categoría | Correcto | Incorrecto | Total |
|---|---|---|---|
| P0 — Crítico | — | 4 issues | Bloquean multi-moneda y pagos |
| P1 — Alto | — | 5 issues | Degradan UX y datos |
| P2 — Medio | — | 4 issues | Inconsistencias menores |
| P3 — Bajo | — | 4 issues | Deuda técnica |
| **Total** | **17 áreas correctas** | **17 issues** | — |

**Esfuerzo total estimado:** ~39 horas (5 sprints)

**Orden de ejecución recomendado:**
1. **Sprint 1** (4.5h) — Fix inmediato de coherencia checkout → permite que pedidos funcionen con multi-moneda
2. **Sprint 3** (7.5h) — Fix carrito → elimina warnings de price correction
3. **Sprint 4** (4h) — Fix product detail + filtros → UX consistente
4. **Sprint 2** (14.5h) — Payment routing → implementa regla CARD→USDT, crypto→crypto
5. **Sprint 5** (8.5h) — Limpieza de deuda técnica

> **Nota:** Sprint 2 se posiciona después del Sprint 3 porque requiere más diseño e integración. Sin embargo, si el requisito de cobro en USDT es bloqueante para producción, puede priorizarse antes.

---

## 8. Archivos Afectados (Referencia Rápida)

### Frontend
- `src/app/repositories/OrderRepository.ts` — F1, F5, S1-01, S1-04
- `src/app/repositories/PaymentRepository.ts` — F6, S1-05, S1-06, S2-06
- `src/app/repositories/CartRepository.ts` — F10, F12, S3-04, S5-04
- `src/app/pages/checkout/hooks/useCheckoutSubmit.ts` — F2, F7, F11, S1-02, S1-03, S1-07
- `src/app/pages/checkout/Checkout.tsx` — F11, F15, S5-02, S5-05
- `src/app/context/CartContext.tsx` — F4, S3-02
- `src/app/config/priceRanges.ts` — F9, S4-02
- `src/app/mappers/NexaProductMapper.ts` — Verificar fallbacks

### Backend
- `mic-paymentservice/.../PaymentUseCaseImpl.java` — F3, S2-04
- `mic-paymentservice/.../Payment.java` — S2-01
- `mic-paymentservice/.../PaymentDtoOut.java` — S2-01
- `mic-paymentservice/.../CryptoGatewayAdapter.java` — S2-05
- `mic-orderservice/.../OrderUseCaseImpl.java` — S1-08
- `mic-orderservice/.../CartItem.java` — F4, S3-03, S3-04
- `mic-orderservice/.../Cart.java` — F4, S3-03
- `mic-orderservice/.../CartItemDtoIn.java` — S3-04
- `mic-orderservice/.../CartItemDtoOut.java` — S3-05
- `mic-productcategory/.../ProductDetailDtoOut.java` — F8, S4-01
- `mic-productcategory/.../ProductDetailApiMapper.java` — S4-01
