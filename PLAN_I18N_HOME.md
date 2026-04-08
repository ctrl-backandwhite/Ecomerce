# Plan: Internacionalización (i18n) del Home — Slider, Banner y secciones

## Objetivo
Hacer que **todos los textos hardcodeados** del Home (PromoSlider, InfoBanner, Gift Card Banner, Features Strip, filtros, estados vacíos/error) soporten el cambio de idioma usando el sistema `useLanguage()` / `t()` ya existente en `LanguageContext.tsx`.

## Estado Actual
- Sistema i18n: diccionario en memoria en `LanguageContext.tsx` con 24 keys (solo Header, nav, timezone)
- Idiomas soportados: `es`, `en`, `pt`
- Patrón: `const { t } = useLanguage()` → `t("key.name")`
- **0 keys** cubren el Home, PromoSlider, InfoBanner ni Features

## Archivos a Modificar

| # | Archivo | Cambio |
|---|---------|--------|
| 1 | `src/app/context/LanguageContext.tsx` | Agregar ~60 nuevas keys para los 3 idiomas |
| 2 | `src/app/components/PromoSlider.tsx` | Usar `t()` en fallbacks, chips, aria-labels |
| 3 | `src/app/components/InfoBanner.tsx` | Usar `t()` en los 3 ítems del marquee |
| 4 | `src/app/pages/Home.tsx` | Usar `t()` en gift card, features, filtros, estados |

## Fase 1 — Nuevas Translation Keys

### Grupo: `slide.*` (PromoSlider fallbacks)
| Key | es | en | pt |
|-----|----|----|-----|
| `slide.fb1.title` | Descubre los Mejores Productos | Discover the Best Products | Descubra os Melhores Produtos |
| `slide.fb1.subtitle` | Tecnología de vanguardia | Cutting-edge technology | Tecnologia de ponta |
| `slide.fb1.desc` | Ofertas exclusivas con garantía de satisfacción y envío gratis en tu primera compra. | Exclusive deals with satisfaction guarantee and free shipping on your first order. | Ofertas exclusivas com garantia de satisfação e frete grátis na sua primeira compra. |
| `slide.fb1.badge` | Nuevo | New | Novo |
| `slide.fb1.btn` | Ver Ofertas | View Deals | Ver Ofertas |
| `slide.fb2.title` | Hasta 50% OFF | Up to 50% OFF | Até 50% OFF |
| `slide.fb2.subtitle` | Moda & Tendencias | Fashion & Trends | Moda & Tendências |
| `slide.fb2.desc` | Las últimas tendencias de moda con descuentos increíbles. Stock limitado. | The latest fashion trends with incredible discounts. Limited stock. | As últimas tendências de moda com descontos incríveis. Estoque limitado. |
| `slide.fb2.badge` | Oferta | Sale | Oferta |
| `slide.fb2.btn` | Ver Ofertas de Moda | View Fashion Deals | Ver Ofertas de Moda |
| `slide.fb3.title` | Gaming al Siguiente Nivel | Gaming to the Next Level | Gaming no Próximo Nível |
| `slide.fb3.subtitle` | Setups Épicos | Epic Setups | Setups Épicos |
| `slide.fb3.desc` | Consolas, periféricos y accesorios para dominar cada partida. | Consoles, peripherals and accessories to dominate every game. | Consoles, periféricos e acessórios para dominar cada partida. |
| `slide.fb3.badge` | Destacado | Featured | Destaque |
| `slide.fb3.btn` | Explorar Gaming | Explore Gaming | Explorar Gaming |
| `slide.fb4.title` | Electrónica de Alta Gama | Premium Electronics | Eletrônicos Premium |
| `slide.fb4.subtitle` | Innovación sin límites | Innovation without limits | Inovação sem limites |
| `slide.fb4.desc` | Los mejores smartphones, laptops y gadgets con descuentos especiales para miembros NX036. | The best smartphones, laptops and gadgets with special discounts for NX036 members. | Os melhores smartphones, laptops e gadgets com descontos especiais para membros NX036. |
| `slide.fb4.badge` | Exclusivo | Exclusive | Exclusivo |
| `slide.fb4.btn` | Ver Electrónica | View Electronics | Ver Eletrônicos |
| `slide.default.btn` | Ver más | View more | Ver mais |
| `slide.chip.discount` | Con descuento | On sale | Com desconto |
| `slide.prev` | Anterior | Previous | Anterior |
| `slide.next` | Siguiente | Next | Próximo |
| `slide.goTo` | Ir a slide | Go to slide | Ir ao slide |

### Grupo: `banner.*` (InfoBanner)
| Key | es | en | pt |
|-----|----|----|-----|
| `banner.freeShipping` | Envío gratis en compras sobre | Free shipping on orders over | Frete grátis em compras acima de |
| `banner.freeShipping.amount` | $100 | $100 | $100 |
| `banner.secureBuy` | Compra 100% segura | 100% secure purchase | Compra 100% segura |
| `banner.multiPayment` | Múltiples métodos de pago | Multiple payment methods | Múltiplos métodos de pagamento |

### Grupo: `gift.*` (Gift Card Banner)
| Key | es | en | pt |
|-----|----|----|-----|
| `gift.title` | Tarjetas de regalo NX036 | NX036 Gift Cards | Cartões presente NX036 |
| `gift.subtitle` | El regalo perfecto — envíalo directo al email de quien quieras | The perfect gift — send it directly to anyone's email | O presente perfeito — envie direto para o email de quem quiser |
| `gift.cta` | Regalar ahora | Gift now | Presentear agora |

### Grupo: `home.*` (Home.tsx)
| Key | es | en | pt |
|-----|----|----|-----|
| `home.filters` | Filtros | Filters | Filtros |
| `home.products` | productos | products | produtos |
| `home.results` | resultados | results | resultados |
| `home.featured` | Destacados | Featured | Destaques |
| `home.priceLow` | Precio: menor a mayor | Price: low to high | Preço: menor a maior |
| `home.priceHigh` | Precio: mayor a menor | Price: high to low | Preço: maior a menor |
| `home.topRated` | Mejor valorados | Top rated | Mais avaliados |
| `home.nameAZ` | Nombre A–Z | Name A–Z | Nome A–Z |
| `home.all` | Todos | All | Todos |
| `home.allProducts` | Todos los Productos | All Products | Todos os Produtos |
| `home.searchResults` | Resultados para | Results for | Resultados para |
| `home.dealsFor` | Ofertas · | Deals · | Ofertas · |
| `home.deals` | Ofertas y Descuentos | Deals & Discounts | Ofertas e Descontos |
| `home.catalogLive` | Catálogo en vivo | Live catalog | Catálogo ao vivo |
| `home.demoMode` | Modo demo — datos de muestra | Demo mode — sample data | Modo demo — dados de exemplo |
| `home.errorLoading` | Error al cargar productos | Error loading products | Erro ao carregar produtos |
| `home.retry` | Reintentar | Retry | Tentar novamente |
| `home.noResults` | Sin resultados | No results | Sem resultados |
| `home.noResultsHint` | Prueba ajustando los filtros o cambia la búsqueda | Try adjusting filters or changing search | Tente ajustar os filtros ou alterar a busca |
| `home.clearFilters` | Limpiar filtros | Clear filters | Limpar filtros |
| `home.loadingMore` | Cargando más productos... | Loading more products... | Carregando mais produtos... |
| `home.allLoaded` | Todos los productos cargados | All products loaded | Todos os produtos carregados |

### Grupo: `features.*` (Features Strip)
| Key | es | en | pt |
|-----|----|----|-----|
| `features.shipping` | Envío Gratis | Free Shipping | Frete Grátis |
| `features.shipping.sub` | En compras sobre $100 | On orders over $100 | Em compras acima de $100 |
| `features.secure` | Compra Segura | Secure Purchase | Compra Segura |
| `features.secure.sub` | Protección garantizada | Guaranteed protection | Proteção garantida |
| `features.payment` | Pago Fácil | Easy Payment | Pagamento Fácil |
| `features.payment.sub` | Múltiples métodos | Multiple methods | Múltiplos métodos |
| `features.support` | Soporte 24/7 | Support 24/7 | Suporte 24/7 |
| `features.support.sub` | Siempre disponible | Always available | Sempre disponível |

## Fase 2 — Actualizar PromoSlider.tsx
- Importar `useLanguage` 
- Convertir `fallbackPromos` en función `getFallbackPromos(t)` que use keys traducidas
- Traducir `slideToPromo` default button, chip "Con descuento", aria-labels

## Fase 3 — Actualizar InfoBanner.tsx
- Importar `useLanguage`
- Reemplazar textos hardcoded por `t()` calls

## Fase 4 — Actualizar Home.tsx
- Importar `useLanguage`
- Gift card banner: `t("gift.title")`, `t("gift.subtitle")`, `t("gift.cta")`
- Sort options: usar `t()` en cada `<option>`
- Section title: usar `t()` para "Todos los Productos", "Resultados para", etc.
- Features strip: `t("features.*")`
- Estados vacío/error/loading: `t("home.*")`

## Fase 5 — Verificación
- `npx vite build` sin errores
- Probar cambio de idioma en el selector y confirmar que todo el Home se traduce
