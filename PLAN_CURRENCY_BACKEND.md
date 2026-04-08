# Plan: Centralizar Conversión de Moneda en Backend

> **Objetivo**: Eliminar TODA conversión de divisas del frontend. Los microservicios deben devolver precios ya convertidos a la moneda del usuario. El frontend solo formatea y muestra.

---

## 1. Diagnóstico Actual

### Estado del frontend (Ecomerce — React/Vite)

| Función | Ubicación | Qué hace | Problema |
|---------|-----------|----------|----------|
| `formatPrice(amountUsd)` | `CurrencyContext.tsx` L140 | `amountUsd × rate` + `Intl.NumberFormat` | Convierte USD→display en cliente |
| `convertPrice(amountUsd)` | `CurrencyContext.tsx` L132 | `amountUsd × rate` (solo número) | Conversión numérica en cliente |
| `formatDirect(amount)` | `CurrencyContext.tsx` L160 | Solo `Intl.NumberFormat`, sin conversión | ✅ Correcto — MANTENER |
| Carga de tasas | `CurrencyContext.tsx` L85 | `GET /api/v1/currency-rates?active=true` | Trae todas las tasas al cliente |

**22 archivos** usan `useCurrency()`, **~75 llamadas** a `formatPrice()`, **2 llamadas** a `convertPrice(1)`.

### Estado del backend

| Microservicio | Precios en | Convierte? | Devuelve moneda? |
|---------------|-----------|------------|-----------------|
| **mic-productcategory** | USD (implícito) | No | No — `sellPrice: String` ("27.99") |
| **mic-orderservice** | USD → moneda orden | Sí (al crear orden) | Sí — `currency_code` + `exchange_rate_to_usd` |
| **mic-cmsservice** | N/A (tasas) | Sí — endpoint `/convert` | Sí — `ConvertResultDtoOut` |
| **mic-paymentservice** | Moneda de la orden | No | Sí — `currency VARCHAR(3)` |
| **mic-apigatewayservice** | N/A | No | No |

### Problema de raíz

Los productos salen del catálogo en **USD** sin metadata de moneda. El frontend descarga las tasas de cambio y hace `price × rate` en cada renderizado. Esto causa:
- Mezcla de divisas (shipping en EUR vs subtotal en USD)
- Doble conversión accidental (`formatPrice` sobre valores ya convertidos)
- Inconsistencia: el rate del front puede diferir del rate usado en el backend al crear la orden
- El cliente ve un total estimado que no coincide con lo que el backend cobrará

---

## 2. Arquitectura Objetivo

```
┌─────────────┐    currency=EUR     ┌──────────────────┐
│  Frontend    │ ──────────────────▶ │  API Gateway     │
│  (solo       │  Header:           │  (propaga header) │
│   formatea)  │  X-Currency: EUR   └────────┬─────────┘
└─────────────┘                              │
                                             ▼
                              ┌──────────────────────────┐
                              │  mic-productcategory      │
                              │  Devuelve:                │
                              │    price: 25.88           │
                              │    currencyCode: "EUR"    │
                              │    currencySymbol: "€"    │
                              └──────────────────────────┘
                                             │
                                    consulta tasas
                                             ▼
                              ┌──────────────────────────┐
                              │  mic-cmsservice           │
                              │  GET /currency-rates/EUR  │
                              │  rate: 0.926              │
                              └──────────────────────────┘
```

**Principio**: El frontend envía un header `X-Currency: EUR` en cada request. Cada microservicio convierte sus precios USD a la moneda solicitada antes de responder.

---

## 3. Fases de Implementación

### FASE 1 — Header de moneda y módulo compartido de conversión (mic-coreservice)
**Esfuerzo**: M | **Riesgo**: Bajo | **Prioridad**: 🔴 Bloqueante

#### 3.1.1 Crear `PriceConversionService` en mic-coreservice (app-common)

Módulo compartido que cualquier microservicio pueda usar:

```java
// com.backandwhite.common.currency.PriceConversionService
public class PriceConversionService {
    
    /** Convierte un monto de USD a la moneda destino */
    Money convertFromUsd(BigDecimal amountUsd, String targetCurrency, BigDecimal rate);
    
    /** Estructura de precio con metadata de moneda */
    PriceDisplay toDisplay(BigDecimal amountUsd, String targetCurrency, BigDecimal rate);
}
```

```java
// com.backandwhite.common.currency.PriceDisplay
public record PriceDisplay(
    BigDecimal amount,        // monto convertido y redondeado (2 decimales)
    String currencyCode,      // "EUR"
    String currencySymbol,    // "€"
    String formatted          // "25,88 €" (formateado por el backend con Locale)
) {}
```

#### 3.1.2 Definir header estándar

```java
// com.backandwhite.common.constants.AppConstants
public static final String HEADER_CURRENCY = "X-Currency";
public static final String DEFAULT_CURRENCY = "USD";
```

#### 3.1.3 Crear `CurrencyRequestFilter` (compartido o por micro)

Interceptor que extrae el header y lo pone en un `ThreadLocal` / `RequestAttributes` para acceso fácil:

```java
@Component
public class CurrencyRequestFilter implements HandlerInterceptor {
    @Override
    public boolean preHandle(HttpServletRequest request, ...) {
        String currency = request.getHeader("X-Currency");
        if (currency == null) currency = "USD";
        CurrencyHolder.set(currency);  // ThreadLocal
        return true;
    }
}
```

#### 3.1.4 Cache de tasas en cada microservicio

Para que mic-productcategory no llame a mic-cmsservice en cada request:

```java
@Component
public class CurrencyRateCache {
    // Cache local con TTL de 5 min, se refresca vía HTTP a mic-cmsservice
    // GET /api/v1/currency-rates/{code}
    
    BigDecimal getRate(String currencyCode);      // rate USD→target
    String getSymbol(String currencyCode);
}
```

**Archivos a crear:**
- `mic-coreservice/app-common/src/.../currency/PriceConversionService.java`
- `mic-coreservice/app-common/src/.../currency/PriceDisplay.java`
- `mic-coreservice/app-common/src/.../currency/CurrencyHolder.java`
- `mic-coreservice/app-common/src/.../currency/CurrencyRequestFilter.java`
- `mic-coreservice/app-common/src/.../currency/CurrencyRateCache.java`

---

### FASE 2 — mic-productcategory: Precios convertidos en respuesta
**Esfuerzo**: L | **Riesgo**: Medio | **Prioridad**: 🔴 Crítico

#### 3.2.1 Modificar `ProductDtoOut`

Añadir campos de moneda al DTO de producto:

```java
// Antes:
private String sellPrice;    // "27.99" (USD)
private String costPrice;    // "0.84" (USD)

// Después: 
private String sellPrice;          // "25,88" (ya convertido)
private String costPrice;          // "0,78" (ya convertido)
private String currencyCode;       // "EUR"
private String currencySymbol;     // "€"
private BigDecimal sellPriceRaw;   // 25.88 (numérico convertido)
private BigDecimal costPriceRaw;   // 0.78 (numérico convertido)
```

> **Nota**: `sellPrice` mantiene el tipo String por compatibilidad con rangos ("10,50 -- 25,88"). Los campos `Raw` son numéricos para cálculos.

#### 3.2.2 Modificar `ProductDetailVariantDtoOut`

```java
// Añadir:
private BigDecimal retailPrice;     // ya convertido
private String currencyCode;
```

#### 3.2.3 Modificar `PricingService.applyMarginsToProduct()`

Después de calcular el margen en USD, convertir al currency del request:

```java
public Product applyMarginsToProduct(Product product) {
    // ... lógica actual de márgenes (no cambia) ...
    
    // NUEVO: convertir a moneda del request
    String currency = CurrencyHolder.get();
    if (!"USD".equals(currency)) {
        BigDecimal rate = currencyRateCache.getRate(currency);
        product.convertPricesTo(currency, rate);
    }
    return product;
}
```

#### 3.2.4 Añadir `CmsClient` al mic-productcategory

Necesita comunicarse con mic-cmsservice para obtener tasas:

```java
@FeignClient(name = "cms-service", url = "${services.cms.url}")
public interface CmsClient {
    @GetMapping("/api/v1/currency-rates/{code}")
    CurrencyRateResponse getRate(@PathVariable String code);
}
```

**Archivos a modificar:**
- `mic-productcategory/src/.../api/dto/out/ProductDtoOut.java`
- `mic-productcategory/src/.../api/dto/out/ProductDetailVariantDtoOut.java`
- `mic-productcategory/src/.../application/service/PricingService.java`
- `mic-productcategory/src/.../api/mapper/ProductApiMapper.java`

**Archivos a crear:**
- `mic-productcategory/src/.../infrastructure/client/CmsClient.java`
- `mic-productcategory/src/.../infrastructure/config/CurrencyConfig.java`

---

### FASE 3 — mic-orderservice: Tax y Shipping en moneda del usuario
**Esfuerzo**: M | **Riesgo**: Medio | **Prioridad**: 🔴 Crítico

#### 3.3.1 Endpoint de tax: devolver en moneda del usuario

```
GET /api/v1/taxes/calculate?subtotal=25.88&country=ES
Header: X-Currency: EUR
```

Actualmente recibe subtotal en USD y devuelve tax en USD. Cambiar a:

**Opción A (recomendada)**: El frontend envía subtotal **ya en la moneda del usuario** (porque los precios ya vienen convertidos). El backend calcula el tax sobre ese monto directamente sin reconvertir.

```java
// TaxController.java
@GetMapping("/calculate")
public ResponseEntity<TaxCalculationDtoOut> calculate(
    @RequestHeader("X-Currency") String currency,
    @RequestParam BigDecimal subtotal,     // ya en moneda del usuario
    @RequestParam String country) {
    
    // Calcular tax: subtotal × tasa = taxAmount (en la misma moneda)
    TaxCalculation result = taxUseCase.calculateTax(country, region, Money.of(subtotal));
    // Añadir currencyCode al response
    return ResponseEntity.ok(toDto(result, currency));
}
```

**Response nuevo:**
```json
{
    "subtotal": 25.88,
    "taxAmount": 5.43,
    "total": 31.31,
    "currencyCode": "EUR",
    "appliedRates": [...]
}
```

#### 3.3.2 Endpoint de shipping options: incluir moneda

```
GET /api/v1/shipping/options?country=ES&subtotal=25.88
Header: X-Currency: EUR
```

Las tarifas de envío están en la DB en EUR (admin las configura así). Si el usuario pide precios en EUR → no hay conversión. Si pide otra moneda → convertir.

**Actualmente**: `freeAbove` y `rate` se devuelven como están en DB (sin moneda).
**Nuevo**: Añadir `currencyCode` a la respuesta y convertir si `X-Currency ≠ moneda base del envío`.

```java
// ShippingOptionDto — añadir:
private String currencyCode;
```

**Archivos a modificar:**
- `mic-orderservice/src/.../api/controller/TaxController.java`
- `mic-orderservice/src/.../api/dto/out/TaxCalculationDtoOut.java`
- `mic-orderservice/src/.../api/controller/ShippingController.java`
- `mic-orderservice/src/.../api/dto/out/ShippingOptionsDtoOut.java`

---

### FASE 4 — Frontend: Eliminar conversión, solo formatear
**Esfuerzo**: L | **Riesgo**: Alto (muchos archivos) | **Prioridad**: 🔴 Crítico

#### 3.4.1 Añadir header `X-Currency` a todas las peticiones

En `authFetch.ts` y `nxFetch.ts`:

```typescript
const headers = {
    ...options.headers,
    "X-Currency": getCurrentCurrencyCode(),  // "EUR", "USD", etc.
};
```

#### 3.4.2 Simplificar `CurrencyContext.tsx`

**Eliminar**: `convertPrice()`, `formatPrice()` (que convierte)
**Mantener**: `formatDirect()` → renombrar a `formatPrice()` (ya que ahora todos los precios vienen convertidos)
**Mantener**: `currency`, `rates`, `setCurrencyCode` (para el selector de moneda)

```typescript
// NUEVO CurrencyContext simplificado
interface CurrencyContextType {
    currency: CurrencyRate | null;
    rates: CurrencyRate[];
    setCurrencyCode: (code: string) => void;
    /** Formatea un monto ya en la moneda display (SIN conversión) */
    formatPrice: (amount: number) => string;
    loading: boolean;
}
```

El nuevo `formatPrice` = el actual `formatDirect` (solo `Intl.NumberFormat`, sin `× rate`).

#### 3.4.3 Actualizar 22 archivos consumidores

Todos los archivos que usan `formatPrice(amountUsd)` ahora reciben montos ya convertidos del backend. El cambio es **transparente** si la firma se mantiene (`formatPrice(amount: number) => string`). Solo hay que:

1. **Eliminar** todas las llamadas a `convertPrice()`
2. **Eliminar** la lógica manual `* rate` en Cart.tsx y OrderSummary.tsx
3. **Eliminar** `formatDirect()` — ya no se necesita (todo es "direct")

**Archivos del frontend a modificar (22 archivos, ~75 call sites):**

| # | Archivo | Cambio |
|---|---------|--------|
| 1 | `context/CurrencyContext.tsx` | Eliminar `convertPrice`, `formatPrice` viejo. Renombrar `formatDirect` → `formatPrice` |
| 2 | `pages/Cart.tsx` | Eliminar `convertPrice(1)`, `displaySubtotal/Tax` manual. Usar `formatPrice()` directo |
| 3 | `pages/checkout/components/OrderSummary.tsx` | Eliminar `convertPrice(1)`, `round2()`. Usar `formatPrice()` directo |
| 4 | `pages/checkout/components/PaymentStep.tsx` | Sin cambio funcional (firma se mantiene) |
| 5 | `pages/checkout/components/CouponInput.tsx` | Sin cambio funcional |
| 6 | `pages/checkout/components/LoyaltySection.tsx` | Sin cambio funcional |
| 7 | `pages/checkout/components/GiftCardSection.tsx` | Sin cambio funcional |
| 8 | `pages/checkout/hooks/useGiftCardRedemption.ts` | Sin cambio funcional |
| 9 | `pages/checkout/hooks/useCouponValidation.ts` | Sin cambio funcional |
| 10 | `pages/ProductDetail.tsx` | Sin cambio funcional |
| 11 | `pages/ComparePage.tsx` | Sin cambio funcional |
| 12 | `pages/GiftCardPurchase.tsx` | Sin cambio funcional |
| 13 | `pages/admin/AdminShipping.tsx` | Eliminar `formatDirect` → usar `formatPrice` |
| 14 | `components/ProductCard.tsx` | Sin cambio funcional |
| 15 | `components/QuickViewModal.tsx` | Sin cambio funcional |
| 16 | `components/CategoryProducts.tsx` | Sin cambio funcional |
| 17 | `components/HomeSidebar.tsx` | Sin cambio funcional |
| 18 | `components/FlashDeals.tsx` | Sin cambio funcional |
| 19 | `components/InvoiceDocument.tsx` | Sin cambio funcional |
| 20 | `components/profile/ProfileTienda.tsx` | Sin cambio funcional |
| 21 | `components/profile/ProfileGiftCards.tsx` | Sin cambio funcional |
| 22 | `components/profile/ProfileFacturas.tsx` | Sin cambio funcional |
| 23 | `components/profile/ProfileFavoritos.tsx` | Sin cambio funcional |
| 24 | `components/profile/ProfileOverview.tsx` | Sin cambio funcional |
| 25 | `repositories/CurrencyRateRepository.ts` | Mantener (sigue siendo necesario para el selector) |
| 26 | `types/currency.ts` | Mantener — no cambia |
| 27 | `lib/authFetch.ts` | Añadir header `X-Currency` |
| 28 | `lib/nxFetch.ts` | Añadir header `X-Currency` |
| 29 | `mappers/NexaProductMapper.ts` | Usar `sellPriceRaw` numérico en vez de parsear string |

#### 3.4.4 Actualizar tipo Product

```typescript
// types/product.ts — añadir:
export interface Product {
    // ... existentes ...
    currencyCode?: string;   // "EUR" — viene del backend
    currencySymbol?: string; // "€"
}
```

---

### FASE 5 — mic-apigatewayservice: Propagar header
**Esfuerzo**: S | **Riesgo**: Bajo | **Prioridad**: 🟡 Necesario

Asegurar que el gateway propague el header `X-Currency` a todos los microservicios downstream. Revisar los filtros del gateway para que no lo elimine.

**Archivo a verificar:**
- `mic-apigatewayservice/src/.../filter/` — asegurar propagación de headers custom

---

### FASE 6 — Tipos monetarios en Product (futuro)
**Esfuerzo**: L | **Riesgo**: Bajo | **Prioridad**: 🟢 Nice-to-have

Cambiar `Product.sellPrice` de `String` a `Money` en mic-productcategory. Actualmente es `VARCHAR(50)` para soportar rangos ("10.50 -- 27.99"). Migrar a:
- `sell_price_min DECIMAL(12,2)`
- `sell_price_max DECIMAL(12,2)` (nullable para no-rango)

Esto elimina el `parseSellPrice()` del frontend.

---

## 4. Matriz de Impacto por Microservicio

| Microservicio | Cambios | Complejidad | Dependencias |
|---------------|---------|-------------|--------------|
| **mic-coreservice** | Crear módulo currency compartido | Baja | Ninguna |
| **mic-cmsservice** | Sin cambios (ya tiene todo) | Ninguna | — |
| **mic-productcategory** | Convertir precios en respuesta, CmsClient, cache | Alta | mic-cmsservice (tasas) |
| **mic-orderservice** | Añadir currency al tax/shipping response | Media | mic-cmsservice (tasas) |
| **mic-apigatewayservice** | Propagar header | Baja | Ninguna |
| **mic-paymentservice** | Sin cambios | Ninguna | — |
| **mic-authservice** | Sin cambios | Ninguna | — |
| **mic-notificationservice** | Sin cambios | Ninguna | — |
| **mic-userdetailservice** | Sin cambios | Ninguna | — |
| **Frontend (Ecomerce)** | 29 archivos, eliminar conversión | Alta (volumen) | Backend ready |

---

## 5. Conversiones del Frontend a Eliminar (detalle)

### 5.1 Eliminar `convertPrice()` — 2 archivos

| Archivo | Línea | Código actual | Acción |
|---------|-------|---------------|--------|
| `Cart.tsx` | ~62 | `const rate = convertPrice(1)` | **ELIMINAR** — ya no se necesita rate |
| `Cart.tsx` | ~63-64 | `Math.round(subtotal * rate * 100) / 100` | **ELIMINAR** — subtotal ya viene convertido |
| `OrderSummary.tsx` | ~67 | `const rate = convertPrice(1)` | **ELIMINAR** |
| `OrderSummary.tsx` | ~68 | `round2 = (usd) => Math.round(usd * rate * 100) / 100` | **ELIMINAR** — helper de conversión |

### 5.2 Simplificar `formatPrice()` — impacto en ~75 call sites

**NO HAY CAMBIO en los call sites** si mantenemos la firma `formatPrice(amount: number) => string`. La implementación interna cambia de:

```typescript
// ANTES (convierte):
const formatPrice = (amountUsd: number) => {
    const converted = amountUsd * currency.rate;    // ← ELIMINAR
    return new Intl.NumberFormat(locale, { style: "currency", currency: code }).format(converted);
};

// DESPUÉS (solo formatea):
const formatPrice = (amount: number) => {
    return new Intl.NumberFormat(locale, { style: "currency", currency: code }).format(amount);
};
```

### 5.3 Eliminar `formatDirect()` — 3 archivos

Ya no se necesitan dos funciones. `formatDirect` se fusiona con el nuevo `formatPrice`:

| Archivo | Llamadas | Acción |
|---------|----------|--------|
| `Cart.tsx` | 5 | Cambiar `formatDirect(x)` → `formatPrice(x)` |
| `OrderSummary.tsx` | 2 | Cambiar `formatDirect(x)` → `formatPrice(x)` |
| `AdminShipping.tsx` | 3 | Cambiar `formatDirect(x)` → `formatPrice(x)` |

### 5.4 Eliminar lógica manual de redondeo — 2 archivos

| Archivo | Código a eliminar |
|---------|-------------------|
| `Cart.tsx` | `displaySubtotal`, `displayTax`, `displayTotal` (cálculos `* rate`) |
| `OrderSummary.tsx` | `round2()`, `rSubtotal`, `rTax`, etc. (helper de conversión + redondeo) |

---

## 6. Secuencia de Ejecución (Orden de PRs)

```
PR 1: [mic-coreservice]   Módulo currency compartido (PriceDisplay, CurrencyHolder, cache)
  │
  ├── PR 2: [mic-productcategory]  Convertir precios en API response + header X-Currency
  │
  ├── PR 3: [mic-orderservice]     Tax y shipping con currencyCode en response
  │
  └── PR 4: [mic-apigatewayservice] Propagar header X-Currency
       │
       └── PR 5: [Ecomerce frontend]  Eliminar conversión, simplificar CurrencyContext
                  │
                  └── PR 6: [Cleanup]  Eliminar formatDirect, convertPrice exports
```

**Regla**: Cada PR debe ser desplegable sin romper la versión actual. Se usa **feature flag** o **fallback a USD** si el header no está presente.

---

## 7. Estrategia de Backward Compatibility

Durante la migración, ambos flujos coexisten:

```java
// Backend: si no viene X-Currency, devolver en USD (comportamiento actual)
String currency = CurrencyHolder.get();  // "EUR" o "USD" (default)
if ("USD".equals(currency)) {
    // Sin conversión — comportamiento legacy
    return existingResponse;
}
// Convertir a moneda solicitada
return convertedResponse;
```

```typescript
// Frontend: detectar si backend ya envía currencyCode
if (product.currencyCode) {
    // Backend already converted — use formatDirect
    return formatDirect(product.price);
} else {
    // Legacy: still USD — use old formatPrice (with conversion)
    return formatPrice(product.price);
}
```

Esto permite desplegar backend y frontend **independientemente**.

---

## 8. Riesgos y Mitigaciones

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Latencia: mic-productcategory llama a mic-cmsservice por tasa | +30-50ms por request | Cache local con TTL 5min + precarga |
| Inconsistencia de tasa entre catálogo y orden | Usuario ve un precio, se cobra otro | Al crear orden, usar exactamente la misma tasa vigente |
| 22 archivos frontend a modificar simultáneamente | Alto riesgo de regresión | La firma `formatPrice()` no cambia, solo la implementación. Tests E2E (Cypress) |
| Shipping rules en EUR vs productos en USD | Mezcla de monedas en comparaciones | Con backend unificado, todo sale en la misma moneda |
| Rate = 0 o currency no soportada | División por cero / crash | Fallback a USD si rate no disponible |

---

## 9. Criterios de Aceptación

### Backend
- [ ] Todo endpoint que devuelva montos monetarios incluye `currencyCode` en la respuesta
- [ ] Si `X-Currency` no está presente, responde en USD (backward compatible)
- [ ] Tasa de conversión se cachea localmente (TTL ≤ 5 min)
- [ ] Logs incluyen la moneda solicitada para trazabilidad

### Frontend
- [ ] `CurrencyContext` no contiene lógica de `× rate` (solo `Intl.NumberFormat`)
- [ ] No existe `convertPrice()` en el codebase
- [ ] `formatDirect()` eliminado — fusionado con `formatPrice()`
- [ ] `authFetch` y `nxFetch` envían header `X-Currency` en toda petición
- [ ] Subtotal, tax, shipping, total: todos usan `formatPrice()` sin conversión manual
- [ ] Al cambiar de moneda en el selector, se re-fetch los datos (no se reconvierte en cliente)

### QA
- [ ] Cambiar país a España → precios en EUR, símbolo €
- [ ] Cambiar país a Brasil → precios en BRL, símbolo R$
- [ ] Subtotal + Tax + Shipping = Total (sin discrepancia de centavos)
- [ ] Checkout total coincide exactamente con lo cobrado en la orden
- [ ] Cart "envío gratis" muestra umbral correcto en la moneda del usuario

---

## 10. Estimación de Esfuerzo

| Fase | Descripción | Story Points | Días (1 dev) |
|------|-------------|-------------|--------------|
| F1 | Módulo compartido (core) | 3 | 1-2 |
| F2 | mic-productcategory (precios convertidos) | 8 | 3-4 |
| F3 | mic-orderservice (tax/shipping con moneda) | 5 | 2-3 |
| F4 | Frontend (eliminar conversión, 29 archivos) | 8 | 3-4 |
| F5 | Gateway (propagar header) | 2 | 0.5 |
| F6 | QA + ajustes | 5 | 2-3 |
| **Total** | | **31 SP** | **~12-16 días** |
