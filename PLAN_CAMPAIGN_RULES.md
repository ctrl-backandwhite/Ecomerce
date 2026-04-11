# PLAN: Análisis de Reglas de Campañas y Correcciones

## Resumen Ejecutivo

Análisis completo de los 6 tipos de campaña (PERCENTAGE, FIXED, FLASH, BUNDLE, BUY2GET1, FREE_SHIPPING), su interacción con el sistema de márgenes de ganancia (PriceRule), y las incongruencias encontradas entre frontend y backend.

---

## Contexto del Sistema de Precios

### Pipeline de Pricing
```
Proveedor (costPrice)
  → PricingService.applyMargin(costPrice, PriceRule)  → sellPrice (precio de venta)
  → CampaignDiscount (descuento SOLO sobre margen)    → precio final con descuento
  → Conversión de moneda (USD → moneda local)          → precio mostrado
```

### PriceRule (Márgenes de Ganancia por Rango de Precio)
- **Scopes**: VARIANT > PRODUCT > CATEGORY > GLOBAL (más específico gana)
- **MarginType**: PERCENTAGE (`cost × (1 + margin/100)`) o FIXED (`cost + margin`)
- **Rango**: `minPrice` / `maxPrice` para matching por costPrice
- **Resultado**: `sellPrice = costPrice + margen`

### Regla Fundamental
> Los descuentos de campaña se aplican **SOLO sobre el margen de ganancia**, nunca por debajo del costPrice del proveedor.

---

## Estado Actual por Tipo de Campaña

### 1. FLASH ✅ Funcional (con observaciones)
| Aspecto | Estado | Detalle |
|---------|--------|---------|
| Admin UI | ✅ | Formulario completo con valor %, fechas, scope, badge |
| Backend CMS | ✅ | CRUD completo, findAllActive() |
| Frontend storefront | ✅ | `useFlashDeals.ts` aplica descuento % sobre margen |
| Backend order validation | ✅ | `CmsClient.calculateBestCampaignDiscount()` valida |
| Cálculo | ✅ | `cost + margin × (1 - value/100)` — correcto |

**Observaciones:**
- Es el ÚNICO tipo que se muestra en el carousel FlashDeals del Home
- El hook `useFlashDeals.ts` filtra `c.type === "FLASH"` (línea 112) — los demás tipos NO se muestran

---

### 2. PERCENTAGE ⚠️ Parcialmente Funcional
| Aspecto | Estado | Detalle |
|---------|--------|---------|
| Admin UI | ✅ | Se puede crear con valor % |
| Backend CMS | ✅ | Se guarda correctamente |
| Frontend storefront | ❌ **BUG** | `useFlashDeals.ts` filtra solo `type === "FLASH"` — PERCENTAGE nunca se muestra |
| Backend order validation | ✅ | `CmsClient` maneja `"PERCENTAGE"` igual que `"FLASH"` |
| Cálculo backend | ✅ | `margin.percentage(value)` — correcto |

**Bug**: Las campañas PERCENTAGE se crean en admin pero **nunca se aplican visualmente** en la tienda. Sin embargo, el backend SÍ las aplica al crear la orden (step 1.5 de `OrderUseCaseImpl.createFromCart()`), lo que causa una **discrepancia** entre el precio que ve el usuario y el que se cobra.

---

### 3. FIXED ⚠️ Parcialmente Funcional
| Aspecto | Estado | Detalle |
|---------|--------|---------|
| Admin UI | ✅ | Se puede crear con valor fijo ($) |
| Backend CMS | ✅ | Se guarda correctamente |
| Frontend storefront | ❌ **BUG** | Mismo problema: filtrado por `"FLASH"` |
| Backend order validation | ✅ | `Money.of(value).min(margin)` — correcto |
| Cálculo backend | ✅ | Descuento fijo cappeado al margen |

**Bug**: Mismo que PERCENTAGE — el usuario ve un precio, el backend aplica otro diferente al crear la orden.

---

### 4. BUNDLE ❌ No Funcional
| Aspecto | Estado | Detalle |
|---------|--------|---------|
| Admin UI | ✅ | Formulario con buyQty/getQty |
| Backend CMS | ✅ | Se guardan buyQty/getQty |
| Frontend storefront | ❌ | No hay lógica de bundle en el carrito |
| Backend order validation | ❌ | `CmsClient.calculateBestCampaignDiscount()` retorna `Money.zero()` para tipo desconocido |
| Lógica de "Compra X lleva Y" | ❌ | **No existe en ningún lado** |

**Problemas:**
1. El `switch(type)` en `CmsClient.java` solo maneja `PERCENTAGE`, `FLASH`, y `FIXED` — `BUNDLE` cae en `default -> Money.zero()`
2. No hay lógica en el carrito/checkout que verifique si el usuario tiene `buyQty` items para aplicar `getQty` gratis
3. El campo `value` es @NotNull pero no tiene sentido para BUNDLE (debería usar buyQty/getQty)

---

### 5. BUY2GET1 ❌ No Funcional
| Aspecto | Estado | Detalle |
|---------|--------|---------|
| Admin UI | ✅ | Se puede crear (2x1) |
| Backend CMS | ✅ | Se guarda |
| Frontend storefront | ❌ | No hay lógica de 2x1 en el carrito |
| Backend order validation | ❌ | `BUY2GET1` cae en `default -> Money.zero()` |
| Lógica de "El 2do gratis" | ❌ | **No existe en ningún lado** |

**Problemas:**
1. Mismo que BUNDLE: no hay case en el switch
2. No hay lógica en el carrito que detecte qty >= 2 y aplique descuento al 2do item
3. El campo `value` es forzado (@NotNull) pero irrelevante para 2x1

---

### 6. FREE_SHIPPING ❌ No Funcional (como campaña)
| Aspecto | Estado | Detalle |
|---------|--------|---------|
| Admin UI | ✅ | Se puede crear |
| Backend CMS | ✅ | Se guarda |
| Frontend storefront | ❌ | No hay verificación de campañas FREE_SHIPPING en checkout |
| Backend order validation | ❌ | `FREE_SHIPPING` cae en `default -> Money.zero()` |
| Waive shipping | ❌ | **Solo funciona para cupones** (`CouponType.FREE_SHIPPING`), no para campañas |

**Problemas:**
1. El checkout solo verifica `coupon.type === FREE_SHIPPING` (sistema de cupones separado)
2. Las campañas FREE_SHIPPING se crean pero nunca se aplican
3. El campo `value` es forzado pero no tiene sentido

---

## Incongruencias Transversales

### I-01: Frontend vs Backend — Desincronización de Precios 🔴
**Severidad: ALTA**

El usuario ve precio X en la tienda (solo descuento FLASH), pero al hacer checkout el backend aplica el descuento de la MEJOR campaña (PERCENTAGE, FIXED, o FLASH). Esto causa:
- Si hay una campaña PERCENTAGE activa, el usuario paga MENOS de lo que vio → genera confusión
- El frontend no muestra que hay descuento → el usuario puede no notar el ahorro

**Archivos afectados:**
- `useFlashDeals.ts` (línea 112): `campaignsRes.filter((c) => c.type === "FLASH" && c.active)`
- `CmsClient.java` (línea 101-104): maneja PERCENTAGE, FLASH, FIXED

### I-02: Campos obligatorios inadecuados por tipo 🟡
**Severidad: MEDIA**

`CampaignDtoIn.value` es `@NotNull` para TODOS los tipos, pero:
- BUNDLE: debería requerir `buyQty` y `getQty`, no `value`
- BUY2GET1: `value` no tiene sentido (el 2do es gratis)
- FREE_SHIPPING: `value` no tiene sentido

### I-03: maxDiscount nunca se aplica 🟡
**Severidad: MEDIA**

El campo `maxDiscount` existe en el modelo y en el admin UI, pero:
- `useFlashDeals.ts`: NO verifica maxDiscount
- `CmsClient.calculateBestCampaignDiscount()`: NO verifica maxDiscount
- Impacto: un descuento del 50% aplicado a un producto con margen alto no tiene tope

**Archivos afectados:**
- `useFlashDeals.ts` (líneas 155-170)
- `CmsClient.java` (líneas 91-110)

### I-04: minOrder nunca se verifica 🟡
**Severidad: MEDIA**

El campo `minOrder` existe en el modelo y en el admin UI, pero:
- `useFlashDeals.ts`: NO verifica si el subtotal del carrito cumple el mínimo
- `CmsClient.calculateBestCampaignDiscount()`: NO recibe ni verifica subtotal contra minOrder
- Impacto: campañas que deberían activarse solo con compras mínimas se aplican siempre

### I-05: priority nunca se usa 🟢
**Severidad: BAJA**

El campo `priority` existe pero el backend siempre toma el MEJOR descuento (mayor). No respeta prioridad configurada por el admin.

### I-06: No hay tracking de campañas en órdenes 🟡
**Severidad: MEDIA**

- `OrderItem` no tiene `campaignId` ni `discountReason`
- `Order` tiene `discountAmount` pero solo refleja cupones, no campañas
- Los stats de campañas en el admin (revenue, ordersCount, usesCount) están hardcodeados a 0
- No se puede medir ROI de campañas

### I-07: Validación de negocio inexistente en CampaignUseCaseImpl 🟡
**Severidad: MEDIA**

`CampaignUseCaseImpl.create()` hace `campaignRepository.save(campaign)` sin validar:
- Que PERCENTAGE/FLASH tenga value entre 0-100
- Que FIXED tenga un value > 0
- Que BUNDLE tenga buyQty > 0 y getQty > 0
- Que startDate < endDate
- Que no haya conflicto de scope con otras campañas activas

---

## Plan de Corrección Propuesto

### Fase 1: Corregir tipos funcionales (PERCENTAGE, FIXED) — Prioridad ALTA
1. **Frontend `useFlashDeals.ts`**: Cambiar filtro de `c.type === "FLASH"` a `["FLASH", "PERCENTAGE", "FIXED"].includes(c.type)` 
2. **Frontend `useFlashDeals.ts`**: Aplicar verificación de `maxDiscount` después de calcular descuento
3. **Backend `CmsClient.java`**: Verificar y aplicar `maxDiscount` al cálculo

### Fase 2: Implementar tipos no funcionales — Prioridad MEDIA
4. **BUNDLE**: Agregar case en `CmsClient.java` switch + lógica en carrito frontend
5. **BUY2GET1**: Agregar case en `CmsClient.java` switch + lógica en carrito frontend
6. **FREE_SHIPPING**: Agregar verificación de campañas FREE_SHIPPING activas en checkout backend y frontend

### Fase 3: Validaciones y campos — Prioridad MEDIA
7. **CampaignDtoIn**: Hacer `value` optional para tipos que no lo necesitan (BUNDLE, BUY2GET1, FREE_SHIPPING)
8. **CampaignUseCaseImpl**: Agregar validación de negocio por tipo
9. **`minOrder`**: Implementar verificación en frontend y backend
10. **`priority`**: Respetar prioridad cuando hay múltiples campañas

### Fase 4: Tracking y métricas — Prioridad BAJA  
11. **OrderItem**: Agregar `campaignId` y `campaignDiscount` 
12. **Order**: Agregar `campaignDiscountTotal` separado de `discountAmount` (cupones)
13. **Stats**: Calcular revenue/uses reales por campaña

---

## Flujo Corregido (Post-Fix)

```
Usuario navega tienda
  → useFlashDeals: muestra FLASH, PERCENTAGE, FIXED como descuentos (sobre margen)
  → BUNDLE: badge "Compra 3, lleva 1 gratis" en productos del scope
  → BUY2GET1: badge "2x1" en productos del scope
  → FREE_SHIPPING: badge "Envío gratis" en productos del scope

Usuario agrega al carrito
  → Precio con descuento FLASH/PERCENTAGE/FIXED ya aplicado
  → BUNDLE: al tener buyQty items, se agrega getQty a precio 0
  → BUY2GET1: al tener 2, el 2do a precio 0

Checkout
  → subtotal incluye descuentos de campaña
  → FREE_SHIPPING campaign: waive shipping
  → maxDiscount aplicado
  → minOrder verificado

Backend createFromCart
  → Re-verifica TODOS los precios con campañas activas
  → Registra campaignId en OrderItem
  → Actualiza stats de campaña
```

---

## Archivos a Modificar

| Archivo | Servicio | Cambio |
|---------|----------|--------|
| `useFlashDeals.ts` | Frontend | Expandir filtro a PERCENTAGE+FIXED, aplicar maxDiscount |
| `CmsClient.java` | mic-orderservice | Agregar cases BUNDLE/BUY2GET1/FREE_SHIPPING, maxDiscount, minOrder |
| `CampaignUseCaseImpl.java` | mic-cmsservice | Agregar validación de negocio |
| `CampaignDtoIn.java` | mic-cmsservice | Hacer `value` optional para ciertos tipos |
| `CartContext.tsx` | Frontend | Lógica BUNDLE/BUY2GET1 |
| `Checkout.tsx` | Frontend | Verificar campañas FREE_SHIPPING |
| `OrderUseCaseImpl.java` | mic-orderservice | Pasar minOrder, trackear campaignId |
| `OrderItem.java` / entity | mic-orderservice | Agregar campaignId, campaignDiscount |
| `Order.java` / entity | mic-orderservice | Agregar campaignDiscountTotal |
| DB migration | mic-orderservice | Nuevos campos en order_items y orders |
