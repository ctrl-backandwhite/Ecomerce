# PLAN_MONEY_OBJECT.md — Value Object `Money` para Backend NX036

> **Proyecto:** NX036 eCommerce  
> **Fecha:** Julio 2025  
> **Autor:** PO Técnico  
> **Versión:** 1.0  
> **Estado:** Planificado

---

## 1. Resumen Ejecutivo

Actualmente los 9 microservicios del backend manejan montos monetarios como campos `BigDecimal` sueltos (sin tipo semántico), con lógica de redondeo dispersa y duplicada. Existen además inconsistencias graves:

- `Product.sellPrice` almacenado como `String` (mic-productcategory)
- `Customer.totalSpent` mapeado a `double` (mic-userdetailservice)
- `ProductFacets.priceMin/priceMax` como `Double` (mic-productcategory)
- Sin valor objeto compartido `Money` — cada servicio repite `setScale(2, RoundingMode.HALF_UP)`

Este plan define la creación de un **value object inmutable `Money`** en el módulo compartido `app-common` de `mic-coreservice`, con métodos de validación y operaciones aritméticas estándar, limitado a **2 decimales** para todas las operaciones monetarias (alineado con el frontend).

---

## 2. Inventario Actual — Campos Monetarios por Microservicio

### 2.1 mic-orderservice (20+ campos — PRIORIDAD ALTA)

| Clase | Campo | Tipo Actual | Precisión DB |
|-------|-------|-------------|--------------|
| `Order` | `subtotal`, `shippingCost`, `taxAmount`, `discountAmount`, `total`, `giftCardAmount`, `loyaltyDiscount` | `BigDecimal` | `NUMERIC(12,2)` |
| `Order` | `exchangeRateToUsd` | `BigDecimal` | `NUMERIC(18,8)` |
| `Order` | `currencyCode` | `String` | `VARCHAR` |
| `OrderItem` | `unitPrice`, `totalPrice` | `BigDecimal` | `NUMERIC(12,2)` |
| `Cart` | `subtotal` | `BigDecimal` | `NUMERIC(12,2)` |
| `CartItem` | `unitPrice` | `BigDecimal` | `NUMERIC(12,2)` |
| `Coupon` | `value`, `minOrderAmount` | `BigDecimal` | `NUMERIC(12,2)` |
| `Invoice` | `subtotal`, `shipping`, `tax`, `total`, `discountAmount`, `giftCardAmount`, `loyaltyDiscount` | `BigDecimal` | `NUMERIC(12,2)` |
| `ShippingRule` | `rate`, `minPrice`, `maxPrice`, `freeAbove` | `BigDecimal` | `NUMERIC(12,2)` |
| `TaxRule` | `rate` | `BigDecimal` | `NUMERIC(6,4)` |
| `ReturnRequest` | `refundAmount` | `BigDecimal` | `NUMERIC(12,2)` |
| `OrderStats` | `totalRevenue`, `avgOrderValue` | `BigDecimal` | — (calculado) |

**Operaciones aritméticas actuales:**
- `unitPrice × quantity` → subtotal ítem (multiply + reduce)
- `subtotal + shipping + tax - discount` → total (add/subtract chain)
- `subtotal × rate` → tax (multiply + setScale(2, HALF_UP))
- `subtotal × value / 100` → descuento porcentual (multiply + divide con scale=2)
- `value.min(subtotal)` → descuento fijo (tope)
- `amount × exchangeRate` → conversión FX (multiply + setScale(2, HALF_UP))
- `1 / exchangeRate` → tasa inversa (divide con scale=8, HALF_UP)
- `fmt()` helper → `setScale(2, HALF_UP).toPlainString()`

### 2.2 mic-paymentservice (6 campos)

| Clase | Campo | Tipo Actual | Precisión DB |
|-------|-------|-------------|--------------|
| `Payment` | `amount` | `BigDecimal` | `NUMERIC(15,2)` |
| `Payment` | `currency` | `String` | `VARCHAR` |
| `PaymentRefund` | `amount` | `BigDecimal` | `NUMERIC(15,2)` |
| `PaymentRequest` | `amount`, `currency` | `BigDecimal`, `String` | — (DTO) |
| `RefundRequest` | `amount` | `BigDecimal` | — (DTO) |

**Operaciones:** `compareTo` (validar que refund ≤ payment), status check (full vs partial).

### 2.3 mic-cmsservice (10+ campos)

| Clase | Campo | Tipo Actual | Precisión DB |
|-------|-------|-------------|--------------|
| `GiftCard` | `originalAmount`, `balance` | `BigDecimal` | `NUMERIC(12,2)` |
| `GiftCardTransaction` | `amount` | `BigDecimal` | `NUMERIC(12,2)` |
| `CurrencyRate` | `rate` | `BigDecimal` | `NUMERIC(18,8)` |
| `Campaign` | `value` | `BigDecimal` | `NUMERIC(12,2)` |
| `LoyaltyTier` | `multiplier` | `BigDecimal` | `NUMERIC(5,2)` |
| `LoyaltyRule` | `pointsPerUnit` | `int` | `INTEGER` |

**Operaciones:**
- `amount / fromRate × toRate` → conversión de divisa (divide DECIMAL128, multiply + setScale(2))
- `balance.subtract(amount)` → débito gift card
- `amount.negate()` → transacción REDEEM

### 2.4 mic-productcategory (6 campos — TIENE ISSUES)

| Clase | Campo | Tipo Actual | Precisión DB | Issue |
|-------|-------|-------------|--------------|-------|
| `Product` | `sellPrice` | **`String`** | `VARCHAR(50)` | ⚠️ No numérico |
| `ProductDetail` | `sellPrice` | **`String`** | `VARCHAR(50)` | ⚠️ No numérico |
| `ProductFacets` | `priceMin`, `priceMax` | **`Double`** | — (ES index) | ⚠️ Punto flotante |
| `ProductDetailVariant` | `variantSellPrice`, `variantSugSellPrice` | `BigDecimal` | `NUMERIC(10,2)` | ✅ OK |

**Operaciones:** Ninguna aritmética en este servicio (solo almacenamiento/consulta).

### 2.5 mic-userdetailservice (2 campos — TIENE ISSUES)

| Clase | Campo | Tipo Actual | Precisión DB | Issue |
|-------|-------|-------------|--------------|-------|
| `UserProfile` | `totalSpent` | `BigDecimal` | `NUMERIC(12,2)` | ✅ OK |
| `Customer` / `CustomerDtoOut` | `totalSpent` | **`double`** | — (DTO) | ⚠️ Pérdida de precisión |

**Operaciones:** `totalSpent.add(orderTotal)`, `BigDecimal.doubleValue()` (lossy conversion).

### 2.6 Servicios sin campos monetarios

| Servicio | Nota |
|----------|------|
| `mic-notificationservice` | Solo template vars (String pass-through) |
| `mic-authservice` | Sin campos monetarios |
| `mic-apigatewayservice` | Sin campos monetarios |
| `mic-coreservice` | Shared library (host del nuevo `Money`) |

---

## 3. Diseño del Value Object `Money`

### 3.1 Ubicación

```
mic-coreservice/
  app-common/
    src/main/java/com/backandwhite/common/
      domain/
        valueobject/
          Money.java                ← Value Object principal
          Currency.java             ← Enum con las 10 monedas activas
          MoneyConverter.java       ← JPA AttributeConverter
          MoneySerializer.java      ← Jackson serializer
          MoneyDeserializer.java    ← Jackson deserializer
```

**Paquete:** `com.backandwhite.common.domain.valueobject`

> Todos los microservicios ya dependen de `app-common` — **cero cambios en pom.xml**.

### 3.2 Propiedades del Value Object

```java
public final class Money implements Comparable<Money>, Serializable {
    
    private static final int SCALE = 2;
    private static final RoundingMode ROUNDING = RoundingMode.HALF_UP;
    
    private final BigDecimal amount;   // siempre scale=2, HALF_UP
    private final Currency currency;   // nullable para montos sin moneda explícita (backward compat)
}
```

**Invariantes:**
- `amount` nunca es `null`
- `amount` siempre tiene exactamente 2 decimales
- Inmutable (todos los métodos retornan nuevas instancias)
- Implementa `Comparable<Money>`, `Serializable`, `equals()`, `hashCode()`
- Comparaciones entre monedas distintas lanzan `IllegalArgumentException`

### 3.3 Factory Methods

| Método | Firma | Descripción |
|--------|-------|-------------|
| `of(BigDecimal)` | `Money.of(new BigDecimal("99.99"))` | Desde BigDecimal, aplica scale=2 |
| `of(String)` | `Money.of("99.99")` | Desde String, parsea y aplica scale=2 |
| `of(long)` | `Money.of(100)` | Desde entero (centavos NO, unidades) |
| `of(double)` | `Money.of(99.99)` | Desde double (convierte a BigDecimal primero) |
| `of(BigDecimal, Currency)` | `Money.of(bd, Currency.USD)` | Con moneda explícita |
| `of(String, String)` | `Money.of("99.99", "USD")` | Con código de moneda |
| `zero()` | `Money.zero()` | → `Money(BigDecimal.ZERO.setScale(2))` |
| `zero(Currency)` | `Money.zero(Currency.USD)` | Zero con moneda |

### 3.4 Operaciones Aritméticas (scale=2, HALF_UP)

| Método | Firma | Descripción | Caso de uso actual |
|--------|-------|-------------|-------------------|
| `add(Money)` | `Money add(Money other)` | Suma | `subtotal + shipping + tax` |
| `subtract(Money)` | `Money subtract(Money other)` | Resta | `total - discount`, gift card debit |
| `multiply(int)` | `Money multiply(int quantity)` | × cantidad entera | `unitPrice × quantity` |
| `multiply(BigDecimal)` | `Money multiply(BigDecimal factor)` | × factor decimal | `subtotal × taxRate` |
| `divide(BigDecimal)` | `Money divide(BigDecimal divisor)` | ÷ divisor | `revenue / count` (avg) |
| `percentage(BigDecimal)` | `Money percentage(BigDecimal pct)` | × pct / 100 | `subtotal × 15 / 100` (descuento %) |
| `negate()` | `Money negate()` | Invierte signo | Gift card REDEEM tx |
| `min(Money)` | `Money min(Money other)` | El menor | Tope de descuento fijo |
| `max(Money)` | `Money max(Money other)` | El mayor | — |
| `abs()` | `Money abs()` | Valor absoluto | — |
| `floor()` | `Money floor()` | Mínimo ZERO (no negativo) | `total = max(calculated, 0)` |

**Regla:** Todas las operaciones aplican `setScale(2, RoundingMode.HALF_UP)` al resultado.

### 3.5 Métodos de Validación y Consulta

| Método | Retorno | Descripción |
|--------|---------|-------------|
| `isZero()` | `boolean` | `amount.compareTo(ZERO) == 0` |
| `isPositive()` | `boolean` | `amount.compareTo(ZERO) > 0` |
| `isNegative()` | `boolean` | `amount.compareTo(ZERO) < 0` |
| `isGreaterThan(Money)` | `boolean` | Compara con validación de moneda |
| `isLessThan(Money)` | `boolean` | Compara con validación de moneda |
| `isGreaterThanOrEqual(Money)` | `boolean` | Compara con validación de moneda |
| `isLessThanOrEqual(Money)` | `boolean` | Compara con validación de moneda |
| `hasCurrency(Currency)` | `boolean` | Verifica moneda |
| `sameCurrencyAs(Money)` | `boolean` | Verifica misma moneda |
| `getAmount()` | `BigDecimal` | Acceso al valor interno |
| `getCurrency()` | `Currency` | Acceso a la moneda |
| `toPlainString()` | `String` | `amount.toPlainString()` → `"99.99"` |
| `format()` | `String` | `currency.symbol + toPlainString()` → `"$99.99"` |

### 3.6 Operaciones de Conversión de Divisa

| Método | Firma | Descripción |
|--------|-------|-------------|
| `convertTo(Currency, BigDecimal)` | `Money convertTo(Currency target, BigDecimal rate)` | Convierte a otra moneda con tasa directa |
| `convertViaUsd(BigDecimal, BigDecimal, Currency)` | `Money convertViaUsd(BigDecimal fromRate, BigDecimal toRate, Currency target)` | Convierte vía USD intermedio (patrón actual del CMS) |

**Lógica interna de `convertViaUsd`:**
```java
// amount / fromRate → USD (intermedio sin redondear)
// × toRate → moneda destino
// setScale(2, HALF_UP) al final
BigDecimal usd = this.amount.divide(fromRate, MathContext.DECIMAL128);
BigDecimal result = usd.multiply(toRate).setScale(SCALE, ROUNDING);
return new Money(result, target);
```

### 3.7 Enum `Currency`

```java
public enum Currency {
    USD("$",   "US Dollar",               "en-US"),
    EUR("€",   "Euro",                    "de-DE"),
    BRL("R$",  "Brazilian Real",          "pt-BR"),
    MXN("$",   "Mexican Peso",           "es-MX"),
    ARS("$",   "Argentine Peso",         "es-AR"),
    CLP("$",   "Chilean Peso",           "es-CL"),
    COP("$",   "Colombian Peso",         "es-CO"),
    HNL("L",   "Honduran Lempira",       "es-HN"),
    VES("Bs.", "Venezuelan Bolívar",     "es-VE"),
    PYG("₲",   "Paraguayan Guaraní",     "es-PY");

    private final String symbol;
    private final String name;
    private final String locale;

    public static Currency fromCode(String code) { ... }
}
```

### 3.8 Serialización

#### JPA — `MoneyConverter` (para entidades con columna única `NUMERIC`)

```java
@Converter
public class MoneyConverter implements AttributeConverter<Money, BigDecimal> {
    @Override
    public BigDecimal convertToDatabaseColumn(Money money) {
        return money == null ? null : money.getAmount();
    }
    @Override
    public Money convertToEntityAttribute(BigDecimal dbData) {
        return dbData == null ? null : Money.of(dbData);
    }
}
```

> Uso: `@Convert(converter = MoneyConverter.class) private Money subtotal;`
> La columna DB sigue siendo `NUMERIC(12,2)` — **cero cambios de esquema**.

#### Jackson — Serializer/Deserializer

**Formato JSON** (backward compatible):

```json
// Opción A: valor plano (compatible con frontend actual)
{ "subtotal": 99.99 }

// Opción B: objeto rico (para campos con moneda)
{ "amount": { "value": 99.99, "currency": "USD" } }
```

> **Decisión:** Usar **Opción A** por defecto (el serializer escribe el `BigDecimal` plano). Los endpoints que necesiten moneda explícita la envían como campo separado (`currencyCode`), tal como se hace actualmente.

---

## 4. Fases de Implementación

### FASE 0 — Crear `Money` + `Currency` en `app-common` (1-2 días)

**Archivos a crear:**
| Archivo | Descripción |
|---------|-------------|
| `Money.java` | Value Object inmutable con todas las operaciones |
| `Currency.java` | Enum de las 10 monedas activas |
| `MoneyConverter.java` | JPA AttributeConverter |
| `MoneySerializer.java` | Jackson serializer |
| `MoneyDeserializer.java` | Jackson deserializer |
| `MoneyTest.java` | Tests unitarios exhaustivos |

**Criterios de aceptación:**
- [ ] `Money.of("99.99")` → `amount = 99.99`, scale=2
- [ ] `Money.of(99.999)` → `amount = 100.00` (redondeo HALF_UP)
- [ ] `Money.of("99.99").add(Money.of("0.01"))` → `100.00`
- [ ] `Money.of("100").subtract(Money.of("100.01")).floor()` → `0.00`
- [ ] `Money.of("100").percentage(new BigDecimal("15"))` → `15.00`
- [ ] `Money.of("100", "USD").add(Money.of("50", "EUR"))` → `IllegalArgumentException`
- [ ] `Money.of("-5")` permitido (para transacciones REDEEM/refund)
- [ ] `MoneyConverter` persiste como `BigDecimal` y recupera como `Money`
- [ ] Serialización JSON: `{"subtotal": 99.99}` (plano, backward compatible)
- [ ] 100% de cobertura en tests unitarios
- [ ] `mvn clean install` de mic-coreservice pasa sin errores

**Publicar:** `mvn deploy` de `app-common:0.0.1-SNAPSHOT` con el nuevo `Money`.

---

### FASE 1 — Migrar `mic-orderservice` (2-3 días) — PRIORIDAD ALTA

**Es el servicio con más operaciones aritméticas.** Impacto alto, riesgo controlado.

#### 1.1 Domain Models → `Money`

| Clase | Campos a migrar |
|-------|----------------|
| `Order` | `subtotal`, `shippingCost`, `taxAmount`, `discountAmount`, `total`, `giftCardAmount`, `loyaltyDiscount` |
| `OrderItem` | `unitPrice`, `totalPrice` |
| `Cart` | `subtotal` |
| `CartItem` | `unitPrice` |
| `Coupon` | `value`, `minOrderAmount` |
| `Invoice` | `subtotal`, `shipping`, `tax`, `total`, `discountAmount`, `giftCardAmount`, `loyaltyDiscount` |
| `ShippingRule` | `rate`, `minPrice`, `maxPrice`, `freeAbove` |
| `ReturnRequest` | `refundAmount` |
| `OrderStats` | `totalRevenue`, `avgOrderValue` |

> **Excluir:** `TaxRule.rate` (es una tasa, no dinero — mantener `BigDecimal`), `Order.exchangeRateToUsd` (es una tasa FX — mantener `BigDecimal`).

#### 1.2 Infrastructure Entities → `@Convert`

```java
// Antes
@Column(precision = 12, scale = 2)
private BigDecimal subtotal;

// Después
@Convert(converter = MoneyConverter.class)
@Column(precision = 12, scale = 2)
private Money subtotal;
```

> **Sin cambios de esquema Liquibase** — la columna sigue siendo `NUMERIC(12,2)`.

#### 1.3 Use Cases → Reemplazar aritmética

**OrderUseCaseImpl — antes:**
```java
BigDecimal lineTotal = ci.getUnitPrice()
    .multiply(BigDecimal.valueOf(ci.getQuantity()));
BigDecimal subtotal = items.stream()
    .map(i -> i.getUnitPrice().multiply(BigDecimal.valueOf(i.getQuantity())))
    .reduce(BigDecimal.ZERO, BigDecimal::add);
BigDecimal total = subtotal.add(shippingCost).add(taxAmount)
    .subtract(discountAmount);
if (total.compareTo(BigDecimal.ZERO) < 0) total = BigDecimal.ZERO;
```

**OrderUseCaseImpl — después:**
```java
Money lineTotal = ci.getUnitPrice().multiply(ci.getQuantity());
Money subtotal = items.stream()
    .map(i -> i.getUnitPrice().multiply(i.getQuantity()))
    .reduce(Money.zero(), Money::add);
Money total = subtotal.add(shippingCost).add(taxAmount)
    .subtract(discountAmount).floor();
```

**CouponUseCaseImpl — antes:**
```java
subtotal.multiply(coupon.getValue())
    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
```

**CouponUseCaseImpl — después:**
```java
subtotal.percentage(coupon.getValue().getAmount());
```

**ShippingTaxUseCaseImpl — antes:**
```java
subtotal.multiply(DEFAULT_TAX_RATE).setScale(2, RoundingMode.HALF_UP);
```

**ShippingTaxUseCaseImpl — después:**
```java
subtotal.multiply(DEFAULT_TAX_RATE);  // Money.multiply ya aplica scale=2
```

**Conversión FX — antes:**
```java
BigDecimal converted = subtotal.multiply(exchangeRate)
    .setScale(2, java.math.RoundingMode.HALF_UP);
```

**Conversión FX — después:**
```java
Money converted = subtotal.convertTo(targetCurrency, exchangeRate);
```

**`fmt()` helper — eliminar**, reemplazar por `money.toPlainString()`.

#### 1.4 DTOs y Mappers

Los DTOs de API pueden mantener `BigDecimal` o `double` para backward compatibility con el frontend. El mapper convierte:

```java
// Entity/Domain → DTO
dto.setSubtotal(order.getSubtotal().getAmount());  // BigDecimal

// DTO → Domain
Money.of(dto.getSubtotal());
```

> Alternativa: Si el DTO cambia a `Money`, Jackson (de)serializa automáticamente como número plano.

#### 1.5 Criterios de aceptación FASE 1

- [ ] Todos los domain models de orderservice usan `Money` para montos
- [ ] Tasas (`TaxRule.rate`, `exchangeRateToUsd`) mantienen `BigDecimal`
- [ ] Todas las operaciones aritméticas usan métodos de `Money`
- [ ] `fmt()` helper eliminado — usa `Money.toPlainString()`
- [ ] Cero cambios de esquema Liquibase
- [ ] API response format sin cambios (backward compatible)
- [ ] Tests existentes pasan (adaptar tipos)
- [ ] `mvn clean verify` pasa sin errores

---

### FASE 2 — Migrar `mic-paymentservice` (1 día)

#### Campos a migrar

| Clase | Campo |
|-------|-------|
| `Payment` | `amount` |
| `PaymentRefund` | `amount` |
| `PaymentRequest` | `amount` |
| `RefundRequest` | `amount` |

#### Operaciones a reemplazar

```java
// Antes
if (amount.compareTo(refundable) > 0) throw ...;
if (amount.compareTo(payment.getAmount()) >= 0) → REFUNDED

// Después
if (amount.isGreaterThan(refundable)) throw ...;
if (amount.isGreaterThanOrEqual(payment.getAmount())) → REFUNDED
```

#### Criterios de aceptación FASE 2

- [ ] `Payment.amount` y `PaymentRefund.amount` son tipo `Money`
- [ ] Comparaciones usan `isGreaterThan()` / `isGreaterThanOrEqual()`
- [ ] `toPlainString()` en eventos Kafka mantiene formato actual
- [ ] API backward compatible
- [ ] `mvn clean verify` pasa

---

### FASE 3 — Migrar `mic-cmsservice` (1-2 días)

#### Campos a migrar

| Clase | Campo | Nota |
|-------|-------|------|
| `GiftCard` | `originalAmount`, `balance` | Money |
| `GiftCardTransaction` | `amount` | Money |
| `Campaign` | `value` | Money |

> **Excluir:** `CurrencyRate.rate` (es una tasa FX, no dinero — mantener `BigDecimal`), `LoyaltyTier.multiplier` (es un multiplicador — mantener `BigDecimal`).

#### Operaciones a reemplazar

```java
// Conversión de divisa — antes
BigDecimal amountInUsd = amount.divide(from.getRate(), MathContext.DECIMAL128);
return amountInUsd.multiply(to.getRate()).setScale(2, RoundingMode.HALF_UP);

// Después
return Money.of(amount).convertViaUsd(from.getRate(), to.getRate(), Currency.fromCode(to.getCurrencyCode()));

// Gift card debit — antes
card.setBalance(card.getBalance().subtract(amount));

// Después
card.setBalance(card.getBalance().subtract(amount));  // Money.subtract retorna nuevo Money
```

#### Criterios de aceptación FASE 3

- [ ] Gift cards y campaigns usan `Money`
- [ ] `CurrencyRate.rate` mantiene `BigDecimal(18,8)`
- [ ] Conversión de divisa usa `Money.convertViaUsd()`
- [ ] Eventos Kafka mantienen formato actual
- [ ] `mvn clean verify` pasa

---

### FASE 4 — Corregir inconsistencias en `mic-productcategory` (1-2 días)

#### 4.1 Migrar `Product.sellPrice`: `String` → `Money`

**Cambios requeridos:**

1. **Domain model:** `String sellPrice` → `Money sellPrice`
2. **Entity JPA:** Agregar `@Convert(converter = MoneyConverter.class)` + cambiar tipo columna
3. **Migración Liquibase:**
   ```sql
   -- Paso 1: Agregar columna temporal
   ALTER TABLE products ADD COLUMN sell_price_new NUMERIC(12,2);
   
   -- Paso 2: Migrar datos (parsear String → numeric)
   UPDATE products SET sell_price_new = CAST(sell_price AS NUMERIC(12,2))
   WHERE sell_price IS NOT NULL AND sell_price ~ '^\d+\.?\d*$';
   
   -- Paso 3: Drop vieja, renombrar nueva
   ALTER TABLE products DROP COLUMN sell_price;
   ALTER TABLE products RENAME COLUMN sell_price_new TO sell_price;
   ```
4. **`ProductDetail.sellPrice`:** Mismo cambio `String` → `Money`

#### 4.2 Migrar `ProductFacets`: `Double` → `BigDecimal` (Elasticsearch)

```java
// Antes
private Double priceMin;
private Double priceMax;

// Después (BigDecimal para índice ES — no Money porque son facets de búsqueda)
private BigDecimal priceMin;
private BigDecimal priceMax;
```

> Los facets de búsqueda de ES no necesitan el tipo `Money` completo, pero deben ser `BigDecimal` para evitar imprecisión de punto flotante.

#### 4.3 Migrar variantes (ya son `BigDecimal` → `Money`)

```java
// ProductDetailVariant
private Money variantSellPrice;      // antes: BigDecimal
private Money variantSugSellPrice;   // antes: BigDecimal
```

#### Criterios de aceptación FASE 4

- [ ] `Product.sellPrice` es tipo `Money` (no `String`)
- [ ] Migración Liquibase ejecutada sin pérdida de datos
- [ ] `ProductFacets` usa `BigDecimal` (no `Double`)
- [ ] Variantes usan `Money`
- [ ] Importación CJ Dropshipping parsea `String` → `Money.of(String)`
- [ ] API de búsqueda mantiene formato de respuesta
- [ ] `mvn clean verify` pasa

---

### FASE 5 — Corregir inconsistencia en `mic-userdetailservice` (0.5 días)

#### Eliminar `double` → usar `Money`

**Cambios:**

1. **Domain model:** `UserProfile.totalSpent` → `Money`
2. **DTO:** `Customer.totalSpent`, `CustomerDtoOut.totalSpent` → `BigDecimal` (o `Money`)
3. **Eliminar conversión lossy:**
   ```java
   // Antes (CustomerUseCaseImpl:53)
   .totalSpent(profile.getTotalSpent() != null 
       ? profile.getTotalSpent().doubleValue() : 0.0)
   
   // Después
   .totalSpent(profile.getTotalSpent() != null 
       ? profile.getTotalSpent().getAmount() : BigDecimal.ZERO)
   ```

#### Criterios de aceptación FASE 5

- [ ] `UserProfile.totalSpent` es `Money`
- [ ] `Customer.totalSpent` es `BigDecimal` (no `double`)
- [ ] Sin `doubleValue()` en todo el servicio
- [ ] `mvn clean verify` pasa

---

### FASE 6 — Limpieza y documentación (0.5 días)

- [ ] Buscar y eliminar TODO `setScale(2, RoundingMode.HALF_UP)` residual en todos los servicios
- [ ] Buscar y eliminar TODO `BigDecimal.ZERO` reemplazable por `Money.zero()`
- [ ] Eliminar helpers `fmt()` en orderservice
- [ ] Buscar `BigDecimal.doubleValue()` en todos los servicios — eliminar
- [ ] Agregar Javadoc completo a `Money.java`
- [ ] Actualizar `CHANGELOG.md` / release notes

---

## 5. Reglas de Diseño (No Negociables)

| Regla | Detalle |
|-------|---------|
| **Siempre 2 decimales** | `setScale(2, RoundingMode.HALF_UP)` en toda operación |
| **Inmutable** | Cada operación retorna un nuevo `Money` |
| **Null-safe factories** | `Money.of(null)` → `Money.zero()` |
| **Moneda validada** | Operaciones entre monedas distintas → `IllegalArgumentException` |
| **Sin montos monetarios como `double`/`float`** | Prohibido en todo el backend |
| **Sin montos monetarios como `String`** | Prohibido (excepto serialización JSON) |
| **Tasas NO son Money** | Exchange rates, tax rates, multipliers → `BigDecimal` |
| **DB sin cambios (FASE 0-3)** | `NUMERIC(12,2)` sigue igual; `MoneyConverter` mapea transparente |
| **API backward compatible** | JSON sigue enviando números planos |

---

## 6. Riesgos y Mitigaciones

| Riesgo | Impacto | Probabilidad | Mitigación |
|--------|---------|-------------|------------|
| Romper serialización Kafka entre servicios | Alto | Media | Serializar como `BigDecimal` plano; migrar un servicio a la vez |
| Regresión en cálculos de totales | Alto | Baja | Tests unitarios exhaustivos del `Money` + tests de integración |
| `String` → `NUMERIC` en productcategory falla por datos basura | Medio | Media | Query de validación pre-migración; manejar NULLs |
| `MoneyConverter` JPA no registrado en algún servicio | Bajo | Baja | Auto-registrar via `@EntityScan` en `app-common` config |
| Confusión entre Money (montos) y BigDecimal (tasas) | Medio | Media | Documentar la regla: "tasas = BigDecimal, montos = Money" |

---

## 7. Orden de Ejecución y Timeline

```
Semana 1:
  ├── FASE 0: Money + Currency + Tests (app-common)      ← 1-2 días
  └── FASE 1: mic-orderservice                           ← 2-3 días

Semana 2:
  ├── FASE 2: mic-paymentservice                         ← 1 día
  ├── FASE 3: mic-cmsservice                             ← 1-2 días
  └── FASE 4: mic-productcategory (String→Money + DB)    ← 1-2 días

Semana 3:
  ├── FASE 5: mic-userdetailservice (double→Money)       ← 0.5 días
  └── FASE 6: Limpieza + documentación                   ← 0.5 días
```

**Total estimado: 8-12 días de desarrollo**

---

## 8. Definición de Done (Global)

- [ ] `Money` value object en `app-common` con 100% test coverage
- [ ] Todos los montos monetarios en domain models usan `Money`
- [ ] Todas las tasas (FX, tax, multipliers) mantienen `BigDecimal`
- [ ] Cero uso de `double`/`float`/`String` para montos monetarios
- [ ] Cero `setScale(2, HALF_UP)` duplicado fuera de `Money`
- [ ] Cero cambios de esquema DB en FASES 0-3 y 5
- [ ] Migración Liquibase exitosa en FASE 4 (productcategory `String` → `NUMERIC`)
- [ ] API responses backward compatible (JSON plano)
- [ ] Eventos Kafka backward compatible
- [ ] `mvn clean verify` pasa en los 9 microservicios
- [ ] Frontend funciona sin cambios (ya usa `formatPrice()`)

---

## 9. Referencia Rápida — Operaciones Actuales vs `Money`

| Operación actual | Money equivalente |
|-----------------|-------------------|
| `a.add(b)` | `a.add(b)` |
| `a.subtract(b)` | `a.subtract(b)` |
| `a.multiply(BigDecimal.valueOf(qty))` | `a.multiply(qty)` |
| `a.multiply(rate).setScale(2, HALF_UP)` | `a.multiply(rate)` |
| `a.multiply(v).divide(BD.valueOf(100), 2, HALF_UP)` | `a.percentage(v)` |
| `a.compareTo(BigDecimal.ZERO) > 0` | `a.isPositive()` |
| `a.compareTo(BigDecimal.ZERO) < 0` | `a.isNegative()` |
| `a.compareTo(BigDecimal.ZERO) == 0` | `a.isZero()` |
| `a.compareTo(b) > 0` | `a.isGreaterThan(b)` |
| `a.compareTo(b) >= 0` | `a.isGreaterThanOrEqual(b)` |
| `a.min(b)` | `a.min(b)` |
| `a.negate()` | `a.negate()` |
| `if (total < 0) total = ZERO` | `total.floor()` |
| `a.setScale(2, HALF_UP).toPlainString()` | `a.toPlainString()` |
| `a.multiply(fx).setScale(2, HALF_UP)` | `a.convertTo(currency, fx)` |
| `a.divide(fromR, DECIMAL128).multiply(toR).setScale(2, HALF_UP)` | `a.convertViaUsd(fromR, toR, target)` |
| `BigDecimal.ZERO` | `Money.zero()` |
| `new BigDecimal("0.00")` | `Money.zero()` |
