import { useState, useEffect, useRef, useMemo } from "react";
import { useCart } from "../context/CartContext";
import { useUser } from "../context/UserContext";
import { useCurrency } from "../context/CurrencyContext";
import { useTimezone } from "../context/TimezoneContext";
import { useLanguage } from "../context/LanguageContext";
import { taxRepository, type TaxCalculation } from "../repositories/TaxRepository";
import { shippingRepository } from "../repositories/ShippingRepository";
import { resolveCountryCode } from "../utils/resolveCountryCode";
import { Button } from "../components/ui/button";
import { Link, useNavigate } from "react-router";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, ArrowLeft, Heart } from "lucide-react";
import { Badge } from "../components/ui/badge";

export function Cart() {
  const { items, removeFromCart, updateQuantity, getTotalPrice } = useCart();
  const { user, toggleFavorite, isFavorite } = useUser();
  const { formatPrice, convertFromUsd } = useCurrency();
  const { selectedCountry, countries } = useTimezone();
  const { t } = useLanguage();
  const navigate = useNavigate();

  // ── Tax country: prefer default shipping address (same as checkout) ─────
  const knownCodes = useMemo(() => countries.map((c) => c.code), [countries]);

  const defaultAddr = useMemo(
    () => user.addresses.find((a) => a.isDefault) ?? user.addresses[0] ?? null,
    [user.addresses],
  );

  const taxCountry = useMemo(() => {
    if (defaultAddr?.country) return resolveCountryCode(defaultAddr.country, knownCodes);
    return selectedCountry?.code ?? "US";
  }, [defaultAddr, knownCodes, selectedCountry]);

  const taxState = defaultAddr?.state ?? undefined;

  const taxCountryLabel = useMemo(() => {
    if (defaultAddr?.country) {
      const resolved = resolveCountryCode(defaultAddr.country, knownCodes);
      const match = countries.find((c) => c.code === resolved);
      return match?.country ?? defaultAddr.country;
    }
    return selectedCountry?.country ?? "EE.UU.";
  }, [defaultAddr, knownCodes, countries, selectedCountry]);

  // ── Estimated tax based on shipping address / selected country ──────────
  const [taxEstimate, setTaxEstimate] = useState<TaxCalculation | null>(null);
  const [taxLoading, setTaxLoading] = useState(false);
  const taxTimer = useRef<ReturnType<typeof setTimeout>>();

  const subtotal = getTotalPrice();
  const countryCode = selectedCountry?.code ?? "US";

  useEffect(() => {
    clearTimeout(taxTimer.current);
    if (subtotal === 0) { setTaxEstimate(null); return; }
    setTaxLoading(true);
    taxTimer.current = setTimeout(() => {
      taxRepository
        .calculate({ subtotal, country: taxCountry, state: taxState })
        .then(setTaxEstimate)
        .catch(() => setTaxEstimate(null))
        .finally(() => setTaxLoading(false));
    }, 500);
    return () => clearTimeout(taxTimer.current);
  }, [subtotal, taxCountry, taxState]);

  // Prefer backend value; if backend has no rules configured (taxAmount === 0 / null)
  // fall back to 10 % of subtotal so the UI matches what the order service will charge.
  const backendTax = taxEstimate?.taxAmount ?? 0;
  const estimatedTax = backendTax > 0 ? backendTax : +(subtotal * 0.10).toFixed(2);

  // ── Free-shipping threshold from real shipping rules ─────────────────
  const [minFreeAbove, setMinFreeAbove] = useState<number | null>(null);

  useEffect(() => {
    if (!countryCode) return;
    shippingRepository
      .getOptions({ country: countryCode, subtotal: "0", weight: "1" })
      .then((opts) => {
        const thresholds = opts
          .map((o) => o.freeAbove)
          .filter((v): v is number => v != null && v > 0);
        setMinFreeAbove(thresholds.length > 0 ? Math.min(...thresholds) : null);
      })
      .catch(() => setMinFreeAbove(null));
  }, [countryCode]);

  // Prices are already in display currency (backend converts via X-Currency)
  const displaySubtotal = subtotal;
  const displayTax = estimatedTax;
  const displayTotal = displaySubtotal + displayTax;

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center px-4">
          <ShoppingBag className="w-24 h-24 mx-auto text-gray-300 mb-6" />
          <h2 className="text-3xl font-bold mb-4">{t("cart.empty.title")}</h2>
          <p className="text-gray-600 mb-8">
            {t("cart.empty.subtitle")}
          </p>
          <Link to="/">
            <Button size="lg">
              {t("cart.empty.cta")}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-xl tracking-tight mb-6">{t("cart.title")}</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg p-4 sm:p-6 shadow-sm"
              >
                <div className="flex gap-4">
                  {/* Image */}
                  <Link
                    to={`/product/${item.productId ?? item.id}`}
                    className="flex-shrink-0"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-lg hover:opacity-75 transition-opacity"
                    />
                  </Link>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 min-w-0 pr-4">
                        <Link to={`/product/${item.productId ?? item.id}`}>
                          <h3 className="text-sm text-gray-900 hover:text-gray-600 transition-colors line-clamp-2">
                            {item.name}
                          </h3>
                        </Link>
                        {item.category && !/^[0-9a-f-]{36}$/i.test(item.category) && (
                          <Badge variant="secondary" className="mt-1">
                            {item.category}
                          </Badge>
                        )}
                        {/* Variant attributes selected */}
                        {item.selectedAttrs && Object.keys(item.selectedAttrs).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {Object.entries(item.selectedAttrs).map(([k, v]) => (
                              <span key={k} className="text-[11px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                                {k}: {v}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          title={isFavorite(item.productId ?? item.id) ? t("cart.removeFav") : t("cart.moveToFav")}
                          onClick={async () => {
                            const wasAlreadyFavorite = isFavorite(item.productId ?? item.id);
                            await toggleFavorite(item.productId ?? item.id);
                            // Solo mover (eliminar del carrito) si se está AGREGANDO a favoritos desde el carrito
                            if (!wasAlreadyFavorite) {
                              removeFromCart(item.id);
                            }
                          }}
                          className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${isFavorite(item.productId ?? item.id)
                            ? "border-red-200 bg-red-50"
                            : "border-gray-200 hover:border-gray-300 bg-white"
                            }`}
                        >
                          <Heart
                            className={`w-3.5 h-3.5 ${isFavorite(item.productId ?? item.id) ? "fill-red-500 text-red-500" : "text-gray-400"}`}
                            strokeWidth={1.5}
                          />
                        </button>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          title={t("cart.remove")}
                          className="w-8 h-8 rounded-full border border-gray-200 hover:border-red-300 bg-white hover:bg-red-50 flex items-center justify-center transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" strokeWidth={1.5} />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-4">
                      {/* Quantity */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 mr-2">
                          {t("cart.quantity")}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="w-10 text-center text-sm text-gray-900">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            updateQuantity(
                              item.id,
                              item.quantity + 1
                            )
                          }
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        <p className="text-base text-gray-900">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatPrice(item.price)} {t("cart.each")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg p-6 shadow-sm sticky top-24">
              <h2 className="text-sm tracking-widest uppercase text-gray-400 mb-5">{t("cart.summary")}</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>{t("cart.subtotal")}</span>
                  <span>{formatPrice(displaySubtotal)}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>{t("cart.shipping")}</span>
                  <span>{t("cart.shipping.calc")}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>{t("cart.taxes")} ({taxCountryLabel}){taxLoading ? " …" : ` ${t("cart.taxes.est")}`}</span>
                  <span>{displayTax > 0 ? formatPrice(displayTax) : formatPrice(0)}</span>
                </div>
                <div className="border-t pt-3 flex justify-between items-center">
                  <span className="text-sm text-gray-900">{t("cart.total")}</span>
                  <span className="text-lg text-gray-900">
                    {formatPrice(displayTotal)}
                  </span>
                </div>
              </div>

              {subtotal > 0 && minFreeAbove != null && (() => {
                const freeAboveLocal = convertFromUsd(minFreeAbove);
                return displaySubtotal < freeAboveLocal ? (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4 text-sm text-gray-600">
                    <p>
                      {t("cart.addMoreFreeShipping").replace("{amount}", formatPrice(freeAboveLocal - displaySubtotal))}
                    </p>
                  </div>
                ) : null;
              })()}

              <Button
                size="lg"
                className="w-full mb-3"
                onClick={() => navigate("/checkout")}
              >
                {t("cart.checkout")}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>

              <Link to="/store">
                <Button variant="outline" size="lg" className="w-full">
                  <ArrowLeft className="mr-2 w-5 h-5" />
                  {t("common.continueShopping")}
                </Button>
              </Link>

              <div className="mt-6 pt-6 border-t text-sm text-gray-600 space-y-2">
                <p>{t("cart.trust.secure")}</p>
                <p>{t("cart.trust.returns")}</p>
                <p>{t("cart.trust.warranty")}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}