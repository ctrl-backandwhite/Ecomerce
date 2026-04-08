# Plan: Coherencia de Precios de Envío (Admin ↔ Checkout)

## Problema

Los precios de envío mostrados en el **Admin** (`/admin/shipping`) no coinciden con los del **Checkout** (`/checkout`).

**Ejemplo real:**
| Vista | Transportista | Precio mostrado |
|-------|--------------|-----------------|
| Admin (Transportistas) | Correos Express | **3,00 €** |
| Checkout (Resumen) | Correos Express | **8,99 €** |

## Causa Raíz

### 1. El API de reglas NO expone el campo `active`
- `ShippingRuleDtoOut.java` no incluye el campo `active`, a pesar de que el dominio (`ShippingRule.java`) y la entidad (`ShippingRuleEntity.java`) sí lo tienen.
- El endpoint `GET /api/v1/shipping/rules` devuelve **todas** las reglas (activas e inactivas) sin indicar cuáles son cuáles.

### 2. El Admin toma la regla equivocada
- En `AdminShipping.tsx`, la función `loadAll()` enriquece cada carrier con datos de su regla:
  ```tsx
  const rule = rawRules.find(r => r.carrierId === c.id);  // ← primera que encuentra
  ```
- `Array.find()` devuelve la **primera** coincidencia, que puede ser una regla **inactiva**.
- Correos Express (SC-001) tiene 4 reglas en zona ES:
  - SR-002: rate=3.00, **active=false** ← la que `find()` devuelve
  - SR-003: rate=8.99, **active=true** ← la que el checkout usa
  - SR-001: rate=3.50, active=false
  - SR-004: rate=5.00, active=false

### 3. El Checkout usa solo reglas activas
- El endpoint `GET /api/v1/shipping/options?country=ES&subtotal=1` ejecuta un query nativo que filtra por `r.active = true AND c.active = true`.
- Correctamente devuelve SR-003 (8.99€), la única regla activa para Correos Express en ES.

### 4. Resumen del flujo de datos

```
DB (13 reglas, solo 3 activas)
    │
    ├─→ GET /rules (Admin) → 13 reglas SIN campo active
    │        → loadAll() → find() toma la primera → precio INCORRECTO
    │
    └─→ GET /options (Checkout) → filtra active=true → precio CORRECTO
```

## Solución

### Paso 1: Backend — Exponer `active` en el DTO de reglas
**Archivo:** `ShippingRuleDtoOut.java`
- Añadir campo `boolean active` al DTO de salida.
- MapStruct ya mapeará automáticamente `ShippingRule.active → ShippingRuleDtoOut.active` sin cambios en el mapper.

### Paso 2: Frontend — Añadir `active` al tipo `ShippingRule`
**Archivo:** `ShippingRepository.ts`
- Añadir `active: boolean` a la interfaz `ShippingRule`.

### Paso 3: Frontend — Enriquecer carriers con la regla ACTIVA
**Archivo:** `AdminShipping.tsx` → `loadAll()`
- Cambiar:
  ```tsx
  const rule = rawRules.find(r => r.carrierId === c.id);
  ```
  por:
  ```tsx
  const rule = rawRules.find(r => r.carrierId === c.id && r.active)
            || rawRules.find(r => r.carrierId === c.id);
  ```
  Esto prioriza la regla activa; si no hay ninguna activa, cae a la primera como fallback.

### Paso 4: Frontend — Mostrar estado activo/inactivo en la tabla de reglas
**Archivo:** `AdminShipping.tsx` → Pestaña "Tarifas"
- Añadir columna "Estado" a la tabla de reglas con indicador visual (punto verde/gris).
- Añadir `active` al tipo `ShippingRule` local del admin y al mapeo `mapRuleToUi`.

### Paso 5: Rebuild y verificación
1. Rebuild `mic-orderservice` → reiniciar → verificar que `GET /rules` ahora incluye `active`.
2. Verificar que el Admin muestra los mismos precios que el Checkout para las reglas activas.

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `mic-orderservice/.../ShippingRuleDtoOut.java` | Añadir `boolean active` |
| `Ecomerce/src/app/repositories/ShippingRepository.ts` | Añadir `active: boolean` a `ShippingRule` |
| `Ecomerce/src/app/pages/admin/AdminShipping.tsx` | Priorizar regla activa en `loadAll()`; mostrar estado en tabla de reglas; añadir `active` a tipos locales |

## Resultado Esperado

- Admin muestra **8.99 €** para Correos Express (la regla activa SR-003).
- Checkout muestra **8.99 €** para Correos Express.
- La tabla de reglas muestra un indicador de activo/inactivo por cada regla.
- Los precios son coherentes en toda la aplicación.
