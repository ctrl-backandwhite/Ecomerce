# Plan: Impuestos (IVA/Tax) por País

## Objetivo
Crear un sistema de impuestos por país con Liquibase, backend CRUD + cálculo, e integración con el flujo de precios existente. El impuesto se calcula según el país seleccionado por el usuario en `TimezoneContext`.

---

## Arquitectura

```
┌──────────────────────────────────────────────────────┐
│  Frontend (React)                                     │
│                                                       │
│  TimezoneContext ──► selectedCountry.code ("ES")      │
│        │                                              │
│  CurrencyContext ──► formatPrice(amountUsd)           │
│        │                                              │
│  TaxRepository ──► GET /api/v1/taxes/calculate        │
│        │            ?subtotal=X&country=ES             │
│        │                                              │
│  AdminTaxes ──► CRUD /api/v1/taxes (ya existe)        │
└──────────────────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────────────────┐
│  API Gateway (mic-apigatewayservice)                  │
│  Path=/api/v1/taxes/** → catalog-service              │
└──────────────────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────────────────┐
│  mic-productcategory (Backend Spring Boot 4)          │
│                                                       │
│  ┌─ DB (Liquibase) ──────────────────────────────┐   │
│  │  country_taxes                                 │   │
│  │  ├── id VARCHAR(64) PK                         │   │
│  │  ├── country_code VARCHAR(3) NOT NULL          │   │
│  │  ├── region VARCHAR(100)                       │   │
│  │  ├── rate NUMERIC(8,6) NOT NULL                │   │
│  │  ├── type VARCHAR(20) NOT NULL                 │   │
│  │  ├── applies_to TEXT[] (categorías)            │   │
│  │  ├── includes_shipping BOOLEAN DEFAULT true    │   │
│  │  ├── active BOOLEAN DEFAULT true               │   │
│  │  ├── created_at TIMESTAMPTZ                    │   │
│  │  └── updated_at TIMESTAMPTZ                    │   │
│  └────────────────────────────────────────────────┘   │
│                                                       │
│  Capas (siguiendo patrón PriceRule):                  │
│  ├── domain/valueobject/TaxType.java (enum)           │
│  ├── domain/model/CountryTax.java                     │
│  ├── domain/repository/CountryTaxRepository.java      │
│  ├── infrastructure/entity/CountryTaxEntity.java      │
│  ├── infrastructure/repository/                       │
│  │   ├── CountryTaxJpaRepository.java                 │
│  │   └── impl/CountryTaxRepositoryImpl.java           │
│  ├── infrastructure/mapper/CountryTaxInfraMapper.java │
│  ├── application/usecase/CountryTaxUseCase.java       │
│  ├── application/usecase/impl/CountryTaxUseCaseImpl   │
│  ├── application/service/TaxCalculationService.java   │
│  ├── api/dto/in/CountryTaxDtoIn.java                  │
│  ├── api/dto/out/CountryTaxDtoOut.java                │
│  ├── api/dto/out/TaxCalculationDtoOut.java            │
│  ├── api/mapper/CountryTaxApiMapper.java              │
│  └── api/controller/CountryTaxController.java         │
└──────────────────────────────────────────────────────┘
```

---

## Fases de Implementación

### Fase 1: Migración Liquibase (db.changelog-3.4.sql)

**Tabla `country_taxes`:**
- `id` VARCHAR(64) PK — UUID generado por la app
- `country_code` VARCHAR(3) NOT NULL — ISO 3166-1 alpha-2 (ES, US, MX, etc.)
- `region` VARCHAR(100) NULL — estado/provincia (NULL = todo el país)
- `rate` NUMERIC(8,6) NOT NULL — tasa decimal (0.21 = 21%)
- `type` VARCHAR(20) NOT NULL — PERCENTAGE | FIXED
- `applies_to` TEXT DEFAULT NULL — categorías separadas por coma
- `includes_shipping` BOOLEAN NOT NULL DEFAULT TRUE
- `active` BOOLEAN NOT NULL DEFAULT TRUE
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()
- `updated_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()

**Datos iniciales:** IVA estándar para los principales países:
| País | Código | IVA Estándar |
|------|--------|-------------|
| España | ES | 21% |
| Portugal | PT | 23% |
| Francia | FR | 20% |
| Alemania | DE | 19% |
| Italia | IT | 22% |
| Países Bajos | NL | 21% |
| Reino Unido | GB | 20% |
| Estados Unidos | US | 0% (sin IVA federal) |
| México | MX | 16% |
| Brasil | BR | 17% |
| Argentina | AR | 21% |
| Colombia | CO | 19% |
| Chile | CL | 19% |
| Perú | PE | 18% |
| Canadá | CA | 5% (GST) |
| Japón | JP | 10% |
| Corea del Sur | KR | 10% |
| China | CN | 13% |
| Australia | AU | 10% |
| India | IN | 18% |

### Fase 2: Backend — Domain + Infrastructure

Siguiendo el patrón exacto de PriceRule:

1. **TaxType enum** — `PERCENTAGE`, `FIXED`
2. **CountryTax domain model** — Lombok POJO
3. **CountryTaxRepository** — domain interface
4. **CountryTaxEntity** — JPA entity (sin extender AuditableEntity, auto-timestamps con @PrePersist/@PreUpdate)
5. **CountryTaxJpaRepository** — Spring Data JPA
6. **CountryTaxInfraMapper** — MapStruct Entity↔Domain
7. **CountryTaxRepositoryImpl** — bridges JPA→Domain

### Fase 3: Backend — Application Layer

1. **CountryTaxUseCase** — interface CRUD + calculate
2. **CountryTaxUseCaseImpl** — @Service con @Transactional
3. **TaxCalculationService** — resuelve regla fiscal por país y calcula impuesto:
   - Busca reglas activas para el `countryCode`
   - Si hay regla con `region` que coincida, la usa (más específica)
   - Si no, usa la regla general del país
   - Calcula: `taxAmount = subtotal × rate`  o  `taxAmount = fixedAmount`
   - Retorna: `{ subtotal, taxAmount, total, appliedRates[] }`

### Fase 4: Backend — API Layer

1. **CountryTaxDtoIn** — @Valid con annotations
2. **CountryTaxDtoOut** — respuesta completa
3. **TaxCalculationDtoOut** — respuesta del cálculo
4. **CountryTaxApiMapper** — MapStruct DtoIn↔Domain↔DtoOut
5. **CountryTaxController** — REST `/api/v1/taxes`:
   - `GET /` — listar todas
   - `GET /{id}` — obtener por ID
   - `POST /` — crear regla
   - `PUT /{id}` — actualizar
   - `DELETE /{id}` — eliminar
   - `GET /calculate?subtotal=X&country=ES&state=` — calcular impuesto

### Fase 5: API Gateway

Agregar `/api/v1/taxes/**` a la ruta `catalog-service` en `RouteSeeder.java`.

### Fase 6: Verificación Backend

- Build del microservicio con `mvn clean package -DskipTests`
- Ejecutar migración SQL manualmente (Liquibase está deshabilitado en local)
- Iniciar el servicio y probar endpoints via curl
- Verificar que el frontend AdminTaxes se conecta correctamente

### Fase 7: Frontend — Integración de Impuestos en el Flujo de Compra

> **Estado:** ✅ Implementado

El frontend ya tenía la estructura base (`TaxRepository`, `useTaxCalculation`, `OrderSummary`).
Se realizaron las siguientes mejoras:

1. **`useTaxCalculation.ts`** — Ahora importa `useTimezone()` y usa `selectedCountry.code` como
   fallback en lugar de `"US"` hardcodeado. Si el usuario tiene España seleccionada en el
   TimezoneContext, el impuesto se calcula automáticamente con IVA español sin necesidad de
   que el usuario ingrese una dirección.

2. **`Cart.tsx`** — Ahora muestra una estimación real de impuestos en el resumen del carrito:
   - Llama a `taxRepository.calculate()` con el `subtotal` y el `countryCode` del TimezoneContext
   - Muestra "Impuestos (España) (est.)" con el monto real del IVA
   - Muestra "Total estimado" en lugar de solo "Subtotal"
   - Usa debounce de 500ms y muestra spinner `…` mientras calcula

**Flujo completo:**
```
TimezoneContext (país seleccionado)
    │
    ├─► Cart.tsx → taxRepository.calculate() → muestra IVA estimado
    │
    └─► Checkout.tsx
         ├─► useTaxCalculation (fallback: país del TimezoneContext)
         │    └─► taxRepository.calculate() → dispatch(taxCalc)
         │
         └─► OrderSummary.tsx → muestra IVA real con nombre de la tasa
              - "Impuestos (est.)" cuando no hay cálculo
              - "Impuestos" con monto cuando hay taxCalc
              - Spinner "…" mientras carga
```

---

## Endpoints del API

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/taxes` | Listar todas las reglas fiscales |
| GET | `/api/v1/taxes/{id}` | Obtener regla por ID |
| POST | `/api/v1/taxes` | Crear nueva regla fiscal |
| PUT | `/api/v1/taxes/{id}` | Actualizar regla |
| DELETE | `/api/v1/taxes/{id}` | Eliminar regla |
| GET | `/api/v1/taxes/calculate?subtotal=100&country=ES` | Calcular impuesto |

---

## Compatibilidad con Frontend Existente

El frontend (`AdminTaxes.tsx` + `TaxRepository.ts`) ya existe y espera:
- **TaxRate**: `{ id, country, region, rate, type, active, appliesToCategories, createdAt, updatedAt }`
- **TaxRatePayload**: `{ country, region?, rate, type, appliesToCategories?, active? }`
- **TaxCalculation**: `{ subtotal, taxAmount, total, appliedRates: [{name, rate, amount}] }`

El backend debe retornar exactamente estos contratos JSON.

---

## Estimación
- Fase 1 (Liquibase): ~15 min ✅
- Fase 2 (Domain + Infra): ~30 min ✅
- Fase 3 (Application): ~20 min ✅
- Fase 4 (API): ~20 min ✅
- Fase 5 (Gateway): ~5 min ✅
- Fase 6 (Verificación Backend): ~15 min ✅
- Fase 7 (Frontend): ~15 min ✅
- **Total: ~2 horas**
