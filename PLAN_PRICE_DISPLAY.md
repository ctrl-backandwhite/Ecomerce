# Plan: Precios con moneda local — símbolo + bandera del país seleccionado

> **Fecha**: 7 abril 2026  
> **Proyecto**: NX036 eCommerce  
> **Objetivo de negocio**: Que todos los precios visibles al usuario se muestren en la moneda de su país con símbolo correcto y bandera, mejorando la confianza y reduciendo fricción en la conversión.

---

## 1. Diagnóstico actual

### Ya convertidos (10 componentes — `formatPrice()` vía `useCurrency()`)

| # | Componente | Tipo |
|---|-----------|------|
| 1 | `ProductCard` | Catálogo |
| 2 | `ProductDetail` | Detalle producto |
| 3 | `Cart` | Carrito |
| 4 | `OrderSummary` (checkout) | Checkout |
| 5 | `FlashDeals` | Home |
| 6 | `QuickViewModal` | Modal producto |
| 7 | `CategoryProducts` | Listado categoría |
| 8 | `HomeSidebar` | Sidebar home |
| 9 | `ComparePage` | Comparador |
| 10 | `ProfileFavoritos` | Perfil usuario |

### Pendientes de conversión (25 archivos con `$` hardcodeado)

**Checkout (6 archivos)**
- `CouponInput.tsx` — 1 instancia
- `LoyaltySection.tsx` — 1 instancia
- `GiftCardSection.tsx` — 6 instancias
- `PaymentStep.tsx` — 8+ instancias
- `useCouponValidation.ts` — 1 instancia (toast)
- `useGiftCardRedemption.ts` — 1 instancia (toast)

**Perfil / Consumer (6 archivos)**
- `ProfileGiftCards.tsx` — 7 instancias
- `ProfileTienda.tsx` — 1 instancia
- `ProfileOverview.tsx` — 1 instancia
- `ProfileFacturas.tsx` — 3 instancias
- `InvoiceDocument.tsx` — 5 instancias
- `GiftCardPurchase.tsx` — 1 instancia

**Admin (13 archivos)** — menor prioridad, solo visible para operaciones
- `AdminProducts.tsx` — 2 instancias
- `AdminVariants.tsx` — 6 instancias
- `AdminShipping.tsx` — 2 instancias
- `AdminOrders.tsx` — 4 instancias
- `AdminCustomers.tsx` — 3 instancias
- `AdminGiftCards.tsx` — 8 instancias
- `AdminCoupons.tsx` — 2 instancias
- `AdminCampaigns.tsx` — 1 instancia
- `AdminReports.tsx` — 2 instancias
- `Dashboard.tsx` — 8 instancias
- `ProductDetailDrawer.tsx` — 2 instancias
- `ProductPreviewModal.tsx` — 1 instancia
- `ProductModal.tsx` — 1 instancia

**Datos estáticos**
- `ShippingPage.tsx` — 4 valores hardcodeados (`$4.99`, `$2.99`, etc.)

---

## 2. Alcance

### MVP (Fase 1) — Impacto directo en conversión
> Prioridad: **CRÍTICA** · Esfuerzo: **S/M** · Impacto: **ALTO**

Convertir todos los componentes **consumer-facing** para que usen `formatPrice()`:

- **Checkout completo** (6 archivos) — máximo impacto, el usuario ve precios al pagar
- **Perfil consumer** (6 archivos) — historial, gift cards, facturas
- **Datos estáticos** (ShippingPage) — reemplazar `$X.XX` por valores dinámicos

**Total: 13 archivos, ~40 instancias**

### Fase 2 — Consistencia operativa
> Prioridad: **MEDIA** · Esfuerzo: **M** · Impacto: **MEDIO**

Convertir admin pages para que el panel interno también muestre precios en la moneda base (USD) con formato consistente.

**Total: 13 archivos, ~42 instancias**

### Fuera de alcance
- Cambio de moneda base del sistema (siempre USD internamente)
- Facturación legal multi-moneda (requiere validación fiscal)
- Precios por país en catálogo (pricing por región)

---

## 3. Historias de usuario

### HU-1: Precios en checkout con moneda del usuario

**Como** comprador que ha seleccionado su país,  
**Quiero** ver todos los importes del checkout en mi moneda local con su símbolo,  
**Para** entender exactamente cuánto pagaré sin confusión de divisas.

**Criterios de aceptación**

```gherkin
Given un usuario con país "México" seleccionado (MXN, $)
When accede al checkout y tiene un cupón de descuento aplicado
Then el descuento se muestra como "$150.00" (en MXN, no USD)

Given un usuario con país "Brasil" seleccionado (BRL, R$)
When ve la sección de gift cards con saldo $50 USD
Then el saldo se muestra como "R$250.00" (convertido a BRL)

Given un usuario con país "España" seleccionado (EUR, €)
When ve el botón de pago con PayPal
Then el botón dice "Pagar €45.50 con PayPal" (no "$50.00")

Given un usuario con país "Honduras" seleccionado (HNL, L)
When ve el resumen de lealtad
Then el descuento se muestra como "L25.00" (en Lempiras)
```

**Reglas de negocio**
- RB1: Todos los importes se almacenan internamente en USD; la conversión es solo visual
- RB2: Los pagos en crypto (BTC/USDT) siguen mostrando en su unidad nativa, no se convierten
- RB3: `formatPrice()` ya maneja el redondeo a 2 decimales y el locale (es/en/pt)

**Archivos afectados**
| Archivo | Instancias | Cambio |
|---------|-----------|--------|
| `CouponInput.tsx` | 1 | `$${discount.toFixed(2)}` → `formatPrice(discount)` |
| `LoyaltySection.tsx` | 1 | `$${discount.toFixed(2)}` → `formatPrice(discount)` |
| `GiftCardSection.tsx` | 6 | Todas las `$${X.toFixed(2)}` → `formatPrice(X)` |
| `PaymentStep.tsx` | 5 | Importes fiat → `formatPrice(total)`; crypto queda igual |
| `useCouponValidation.ts` | 1 | Toast: pasar `formatPrice` como parámetro |
| `useGiftCardRedemption.ts` | 1 | Toast: pasar `formatPrice` como parámetro |

**NFR**
- Sin regresión visual en el flow de checkout
- Sin nuevo fetch (reutiliza rates del CurrencyContext ya cargado)

---

### HU-2: Precios en perfil del usuario con moneda local

**Como** usuario registrado de Colombia,  
**Quiero** ver mis gift cards, facturas y pedidos anteriores en Pesos Colombianos,  
**Para** entender el valor real de mis compras y saldos.

**Criterios de aceptación**

```gherkin
Given un usuario con país "Colombia" (COP, $)
When ve su lista de gift cards
Then los saldos se muestran en COP: "$200,000.00"

Given un usuario con país "Argentina" (ARS, $)  
When ve su factura
Then subtotal, impuestos y total se muestran en ARS

Given un usuario con país "Chile" (CLP, $)
When ve el overview de perfil
Then el total del último pedido está en CLP
```

**Archivos afectados**
| Archivo | Instancias |
|---------|-----------|
| `ProfileGiftCards.tsx` | 7 |
| `ProfileTienda.tsx` | 1 |
| `ProfileOverview.tsx` | 1 |
| `ProfileFacturas.tsx` | 3 |
| `InvoiceDocument.tsx` | 5 |
| `GiftCardPurchase.tsx` | 1 |

---

### HU-3: Página de envío con precios dinámicos

**Como** comprador,  
**Quiero** ver los costos de envío en mi moneda,  
**Para** comparar opciones sin hacer conversión mental.

**Archivos afectados**
| Archivo | Instancias |
|---------|-----------|
| `ShippingPage.tsx` | 4 (datos estáticos → convertir a variables + `formatPrice()`) |

---

### HU-4: Admin con formato de precio consistente (Fase 2)

**Como** administrador de la tienda,  
**Quiero** ver precios con formato consistente usando USD como moneda base,  
**Para** evitar confusión al operar el backoffice.

**Nota**: En admin, los precios siempre se muestran en USD (moneda base) pero usando `Intl.NumberFormat` para formato consistente en vez de `$${X.toFixed(2)}` manual.

**Archivos afectados**: 13 archivos admin, ~42 instancias

---

## 4. Plan de entrega

```
┌──────────────────────────────────────────────────────────────┐
│  FASE 1 — Consumer-facing (MVP)                             │
│  Esfuerzo: ~2h  │  Impacto: ALTO  │  Riesgo: BAJO          │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Paso 1: Checkout (6 archivos)                              │
│    → CouponInput, LoyaltySection, GiftCardSection           │
│    → PaymentStep, useCouponValidation, useGiftCardRedemption│
│                                                              │
│  Paso 2: Perfil usuario (6 archivos)                        │
│    → ProfileGiftCards, ProfileTienda, ProfileOverview        │
│    → ProfileFacturas, InvoiceDocument, GiftCardPurchase      │
│                                                              │
│  Paso 3: Datos estáticos (1 archivo)                        │
│    → ShippingPage                                            │
│                                                              │
│  Paso 4: Build + smoke test                                 │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  FASE 2 — Admin (consistencia)                              │
│  Esfuerzo: ~3h  │  Impacto: MEDIO  │  Riesgo: BAJO         │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Paso 5: Crear helper `formatUsd()` para admin              │
│    → formato consistente sin conversión                      │
│                                                              │
│  Paso 6: Admin pages (13 archivos)                          │
│    → Products, Variants, Orders, Shipping, Customers         │
│    → GiftCards, Coupons, Campaigns, Reports, Dashboard       │
│    → ProductDetailDrawer, ProductPreviewModal, ProductModal  │
│                                                              │
│  Paso 7: Build final + verificación completa                │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 5. Notas técnicas de implementación

### Patrón a seguir (ya establecido en 10 componentes)

```tsx
// En componentes React
const { formatPrice } = useCurrency();
// Antes:  <span>${price.toFixed(2)}</span>
// Ahora:  <span>{formatPrice(price)}</span>
```

### Para hooks que no son componentes (useCouponValidation, useGiftCardRedemption)

```tsx
// Opción A: Recibir formatPrice como parámetro del hook
export function useCouponValidation(formatPrice: (n: number) => string) { ... }

// Opción B: Llamar useCurrency() dentro del hook (si está dentro del provider tree)
const { formatPrice } = useCurrency();
```

### Para crypto (PaymentStep)
- BTC y USDT **NO se convierten** — se muestran en su unidad nativa
- Solo fiat (PayPal, tarjeta) usa `formatPrice()`

### Para admin (Fase 2)
- Crear `formatUsd(amount: number)` helper que siempre formatee en USD con `Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })`
- No depende del contexto de usuario, es estático

---

## 6. Riesgos y mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Precio convertido confunde al usuario (no sabe que es su moneda) | Media | Alto | Mostrar símbolo + código ISO junto al precio |
| Error de redondeo en conversión | Baja | Medio | `Intl.NumberFormat` ya maneja redondeo correcto |
| Hook fuera del provider tree | Baja | Alto | Verificar que todos los hooks están dentro de `<CurrencyProvider>` |
| Tasa de cambio desactualizada | Media | Medio | Sync automático cada 6h + botón manual en admin |
| Crypto muestra precio erróneo | Baja | Alto | Excluir BTC/USDT del `formatPrice()` explícitamente |

---

## 7. KPIs

| KPI | Baseline | Objetivo |
|-----|---------|---------|
| Abandono de checkout | Actual | -5% (reduce confusión de precios) |
| Conversión LATAM | Actual | +3% (precio en moneda local genera confianza) |
| Tickets de soporte "precio incorrecto" | Actual | -80% |
| Tiempo promedio en checkout | Actual | -10% (menos fricción cognitiva) |

---

## 8. Dependencias

- ✅ `CurrencyContext` y `formatPrice()` ya implementados y funcionando
- ✅ Backend CMS con tasas activas servidas via API 
- ✅ `TimezoneContext` ahora dinámico (solo países activos)
- ✅ 10 componentes ya migrados como referencia del patrón
- ⚠️ Los hooks de checkout que muestran toasts necesitan acceso a `formatPrice`
