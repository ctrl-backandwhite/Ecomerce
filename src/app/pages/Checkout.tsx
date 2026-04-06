import { useState, useEffect, useCallback, useRef } from "react";
import { useCart } from "../context/CartContext";
import type { CartItem } from "../context/CartContext";
import { useUser } from "../context/UserContext";
import { InvoiceDocument } from "../components/InvoiceDocument";
import { useNavigate } from "react-router";
import { orderRepository } from "../repositories/OrderRepository";
import type { Order } from "../repositories/OrderRepository";
import { paymentRepository } from "../repositories/PaymentRepository";
import { shippingRepository } from "../repositories/ShippingRepository";
import type { ShippingOption } from "../repositories/ShippingRepository";
import { taxRepository } from "../repositories/TaxRepository";
import type { TaxCalculation } from "../repositories/TaxRepository";
import { couponRepository } from "../repositories/CouponRepository";
import type { CouponValidation } from "../repositories/CouponRepository";
import { invoiceRepository } from "../repositories/InvoiceRepository";
import type { Invoice } from "../repositories/InvoiceRepository";
import { loyaltyRepository } from "../repositories/CmsRepository";
import { adminGiftCardRepository as giftCardRepository } from "../repositories/CmsRepository";
import {
  CreditCard, Truck, CheckCircle2, ArrowLeft, Lock,
  MapPin, Store, Package2, Plus, Check, ChevronRight, ChevronDown, ChevronLeft,
  Building2, Home, Briefcase, User, Phone, Mail,
  Shield, Tag, AlertCircle, Clock, Navigation, Copy, Star, Gift,
} from "lucide-react";
import { toast } from "sonner";
import {
  VisaLogo, MastercardLogo, PayPalLogo, USDTLogo, BTCLogo,
} from "../components/PaymentLogos";
import type { PaymentMethod } from "../context/UserContext";

/* ── Mock crypto addresses ───────────────────────────────── */
const MOCK_USDT_ADDRESS = "TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE";
const MOCK_BTC_ADDRESS = "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh";

/* ── Delivery type helpers ───────────────────────────────── */
type DeliveryType = "home" | "store" | "pickup";

const deliveryMeta: Record<DeliveryType, { label: string; icon: React.ReactNode; color: string; bg: string; border: string }> = {
  home: { label: "Envío a domicilio", icon: <Truck className="w-4 h-4" strokeWidth={1.5} />, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
  store: { label: "Recogida en tienda", icon: <Store className="w-4 h-4" strokeWidth={1.5} />, color: "text-violet-600", bg: "bg-violet-50", border: "border-violet-200" },
  pickup: { label: "Punto de entrega", icon: <Package2 className="w-4 h-4" strokeWidth={1.5} />, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
};

/* ── Mock store locations ──────────────────────────────────── */
const storeLocations = [
  { id: "store-1", name: "NX036 Manhattan – Fifth Ave", address: "350 Fifth Avenue, New York, NY 10118", hours: "Mon–Sat 9am–9pm · Sun 11am–7pm", distance: "0.8 mi" },
  { id: "store-2", name: "NX036 Brooklyn – Atlantic Ave", address: "530 Atlantic Ave, Brooklyn, NY 11217", hours: "Mon–Sat 10am–8pm · Sun 12pm–6pm", distance: "3.2 mi" },
  { id: "store-3", name: "NX036 Queens – Jamaica Center", address: "168-16 Jamaica Ave, Queens, NY 11432", hours: "Mon–Sun 9am–9pm", distance: "7.4 mi" },
  { id: "store-4", name: "NX036 London – Oxford Street", address: "374 Oxford Street, London W1C 1JX, UK", hours: "Mon–Sat 9am–8pm · Sun 12pm–6pm", distance: "—" },
];

/* ── Mock pickup points ──────────────────────────────────── */
const pickupPoints = [
  { id: "pp-1", name: "InPost Locker – Penn Station", address: "2 Penn Plaza, New York, NY 10121", hours: "24/7", distance: "0.3 mi", type: "Locker" },
  { id: "pp-2", name: "UPS Access Point – Midtown", address: "410 Lexington Ave, New York, NY 10017", hours: "Mon–Fri 8am–8pm · Sat 9am–5pm", distance: "1.1 mi", type: "Access Point" },
  { id: "pp-3", name: "InPost Locker – Grand Central", address: "89 E 42nd St, New York, NY 10017", hours: "24/7", distance: "1.4 mi", type: "Locker" },
  { id: "pp-4", name: "FedEx Drop Box – Herald Square", address: "1 Herald Square, New York, NY 10001", hours: "Mon–Fri 8am–6pm", distance: "0.9 mi", type: "Drop Box" },
  { id: "pp-5", name: "UPS Access Point – Chelsea", address: "185 Seventh Ave, New York, NY 10011", hours: "Mon–Fri 8am–8pm · Sat 9am–5pm", distance: "1.8 mi", type: "Access Point" },
];

function labelIcon(label: string) {
  const l = label.toLowerCase();
  if (l === "home" || l === "casa") return <Home className="w-3.5 h-3.5" strokeWidth={1.5} />;
  if (l === "office" || l === "trabajo") return <Briefcase className="w-3.5 h-3.5" strokeWidth={1.5} />;
  return <MapPin className="w-3.5 h-3.5" strokeWidth={1.5} />;
}

/* ── Step indicator ──────────────────────────────────────── */
function StepBadge({ n, active, done }: { n: number; active: boolean; done: boolean }) {
  return (
    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs transition-colors ${done ? "bg-gray-600 text-white"
      : active ? "bg-gray-600 text-white ring-4 ring-gray-600/10"
        : "bg-gray-100 text-gray-400"
      }`}>
      {done ? <Check className="w-3.5 h-3.5" strokeWidth={2.5} /> : n}
    </div>
  );
}

/* ── Section card ────────────────────────────────────────── */
function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm ${className}`}>
      {children}
    </div>
  );
}

/* ── Payment method type ─────────────────────────────────── */
type PayMethod = "card" | "paypal" | "usdt" | "btc";

/* ── Main component ──────────────────────────────────────── */
export function Checkout() {
  const { items, getTotalPrice, clearCart } = useCart();
  const { user } = useUser();
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderSnapshot, setOrderSnapshot] = useState<CartItem[]>([]);

  /* Backend-generated order / invoice data */
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [backendInvoice, setBackendInvoice] = useState<Invoice | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);

  /* Snapshot of totals at order time (cart is cleared after checkout) */
  const [totalsSnapshot, setTotalsSnapshot] = useState<{
    subtotal: number; shipping: number; tax: number; total: number;
  } | null>(null);

  /* Contact */
  const [contact, setContact] = useState({ email: user.email, phone: user.phone });

  /* Address selection */
  const defaultAddr = user.addresses.find((a) => a.isDefault) ?? user.addresses[0] ?? null;
  const [selectedAddrId, setSelectedAddrId] = useState<string | "new">(defaultAddr?.id ?? "new");

  /* When "new" is selected — which delivery mode? */
  const [newMode, setNewMode] = useState<DeliveryType>("home");

  /* Manual home address */
  const [manualAddr, setManualAddr] = useState({
    name: `${user.firstName} ${user.lastName}`,
    street: "", city: "", state: "", zip: "", country: "United States",
  });

  /* Selected store / pickup point */
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [selectedPickupId, setSelectedPickupId] = useState<string | null>(null);

  /* Payment — saved methods from profile */
  const defaultPm = user.paymentMethods.find((p) => p.isDefault) ?? user.paymentMethods[0] ?? null;
  const [selectedPmId, setSelectedPmId] = useState<string | "new">(defaultPm?.id ?? "new");

  /* New method form state (when "new" is selected) */
  const [payMethod, setPayMethod] = useState<PayMethod>("card");
  const [payment, setPayment] = useState({
    cardNumber: "",
    cardName: `${user.firstName} ${user.lastName}`.toUpperCase(),
    expiry: "", cvv: "",
  });
  const [paypalEmail, setPaypalEmail] = useState(user.email);
  const [copiedAddr, setCopiedAddr] = useState(false);

  /* CVV confirm for saved cards */
  const [savedCardCvv, setSavedCardCvv] = useState("");
  const [pmDropdownOpen, setPmDropdownOpen] = useState(false);

  /* ── Sync from user profile when it loads asynchronously ── */
  const profileSynced = useRef(false);
  useEffect(() => {
    if (profileSynced.current || !user.id) return;
    profileSynced.current = true;

    // Contact
    setContact((c) => ({
      email: c.email || user.email,
      phone: c.phone || user.phone,
    }));

    // Default address
    const addr = user.addresses.find((a) => a.isDefault) ?? user.addresses[0];
    if (addr) setSelectedAddrId((prev) => (prev === "new" ? addr.id : prev));

    // Default payment method
    const pm = user.paymentMethods.find((p) => p.isDefault) ?? user.paymentMethods[0];
    if (pm) setSelectedPmId((prev) => (prev === "new" ? pm.id : prev));

    // Manual address name
    const fullName = `${user.firstName} ${user.lastName}`.trim();
    if (fullName) setManualAddr((m) => ({ ...m, name: m.name || fullName }));

    // PayPal email & card name
    setPaypalEmail((e) => e || user.email);
    setPayment((p) => ({
      ...p,
      cardName: p.cardName || fullName.toUpperCase(),
    }));
  }, [user]);

  /* ── Dynamic shipping / tax / coupon ── */
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedShippingId, setSelectedShippingId] = useState<string | null>(null);
  const [shippingLoading, setShippingLoading] = useState(false);

  const [taxCalc, setTaxCalc] = useState<TaxCalculation | null>(null);
  const [taxLoading, setTaxLoading] = useState(false);

  const [couponCode, setCouponCode] = useState("");
  const [couponResult, setCouponResult] = useState<CouponValidation | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  /* Loyalty */
  const [loyaltyBalance, setLoyaltyBalance] = useState(0);
  const [loyaltyRate, setLoyaltyRate] = useState(100); // points per $1
  const [loyaltyPoints, setLoyaltyPoints] = useState(0); // points user chose to redeem

  /* Gift card */
  const [giftCardCode, setGiftCardCode] = useState("");
  const [giftCardBalance, setGiftCardBalance] = useState<number | null>(null);
  const [giftCardLoading, setGiftCardLoading] = useState(false);
  const [giftCardError, setGiftCardError] = useState<string | null>(null);

  /* BTC real-time rate */
  const [btcRate, setBtcRate] = useState(68500); // fallback

  /* Totals */
  const subtotal = getTotalPrice();
  const selectedShipping = shippingOptions.find((o) => o.id === selectedShippingId);
  const shipping = selectedShipping?.price ?? (shippingOptions[0]?.price ?? 0);
  const tax = taxCalc?.taxAmount ?? subtotal * 0.1; // fallback 10 %
  const couponDiscount = couponResult?.valid ? (couponResult.discount ?? 0) : 0;
  const loyaltyDiscount = loyaltyRate > 0 ? loyaltyPoints / loyaltyRate : 0;
  const giftCardDiscount = giftCardBalance !== null
    ? Math.min(giftCardBalance, subtotal + shipping + tax - couponDiscount - loyaltyDiscount)
    : 0;
  const total = Math.max(0, subtotal + shipping + tax - couponDiscount - loyaltyDiscount - giftCardDiscount);

  /* ── Fetch shipping options on mount ── */
  useEffect(() => {
    let cancelled = false;
    setShippingLoading(true);
    shippingRepository
      .getOptions()
      .then((opts) => {
        if (cancelled) return;
        setShippingOptions(opts);
        if (opts.length > 0) setSelectedShippingId(opts[0].id);
      })
      .catch(() => { /* fallback: keep empty options */ })
      .finally(() => { if (!cancelled) setShippingLoading(false); });
    return () => { cancelled = true; };
  }, []);

  /* ── Fetch loyalty balance + redemption rate ── */
  useEffect(() => {
    if (!user.id) return;
    let cancelled = false;
    Promise.all([
      loyaltyRepository.getBalance().catch(() => null),
      loyaltyRepository.getRedemptionRate().catch(() => null),
    ]).then(([bal, rate]) => {
      if (cancelled) return;
      if (bal) setLoyaltyBalance(bal.balance);
      if (rate) setLoyaltyRate(rate.pointsPerDollar);
    });
    return () => { cancelled = true; };
  }, [user.id]);

  /* ── Fetch BTC rate from CoinGecko ── */
  useEffect(() => {
    let cancelled = false;
    fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data?.bitcoin?.usd) setBtcRate(data.bitcoin.usd);
      })
      .catch(() => { /* keep fallback */ });
    return () => { cancelled = true; };
  }, []);

  /* ── Recalculate tax when subtotal or address changes ── */
  const taxTimer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    clearTimeout(taxTimer.current);
    if (subtotal === 0) return;

    // Determine country/state from selected address
    let country = "US";
    let state: string | undefined;
    if (selectedAddr) {
      country = selectedAddr.country ?? "US";
      state = selectedAddr.state ?? undefined;
    } else if (selectedAddrId === "new" && newMode === "home" && manualAddr.country) {
      country = manualAddr.country;
      state = manualAddr.state || undefined;
    }

    taxTimer.current = setTimeout(() => {
      setTaxLoading(true);
      taxRepository
        .calculate({ subtotal, country, state })
        .then((tc) => setTaxCalc(tc))
        .catch(() => setTaxCalc(null))
        .finally(() => setTaxLoading(false));
    }, 400); // debounce
    return () => clearTimeout(taxTimer.current);
  }, [subtotal, selectedAddrId, manualAddr.country, manualAddr.state]);

  /* ── Coupon validation ── */
  const applyCoupon = useCallback(async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const res = await couponRepository.validate(couponCode.trim(), subtotal);
      setCouponResult(res);
      if (!res.valid) toast.error(res.message ?? "Cupón no válido");
      else toast.success(`Cupón aplicado: -$${(res.discount ?? 0).toFixed(2)}`);
    } catch {
      toast.error("No se pudo validar el cupón");
      setCouponResult(null);
    } finally {
      setCouponLoading(false);
    }
  }, [couponCode, subtotal]);

  /* ── Gift card validation ── */
  const applyGiftCard = useCallback(async () => {
    const code = giftCardCode.trim();
    if (!code) return;
    setGiftCardLoading(true);
    setGiftCardError(null);
    try {
      const { balance } = await giftCardRepository.getBalance(code);
      if (balance <= 0) {
        setGiftCardError("Esta tarjeta no tiene saldo disponible");
        setGiftCardBalance(null);
      } else {
        setGiftCardBalance(balance);
        toast.success(`Tarjeta aplicada · saldo $${balance.toFixed(2)}`);
      }
    } catch {
      setGiftCardError("Tarjeta no válida o expirada");
      setGiftCardBalance(null);
    } finally {
      setGiftCardLoading(false);
    }
  }, [giftCardCode]);

  /* Derived selected address */
  const selectedAddr = selectedAddrId !== "new"
    ? user.addresses.find((a) => a.id === selectedAddrId)
    : null;

  /* Derived "new" selection labels for sidebar */
  const selectedStore = storeLocations.find((s) => s.id === selectedStoreId);
  const selectedPickup = pickupPoints.find((p) => p.id === selectedPickupId);

  /* Derived selected payment method */
  const selectedPm: PaymentMethod | undefined = selectedPmId !== "new"
    ? user.paymentMethods.find((p) => p.id === selectedPmId)
    : undefined;

  /* Step validation */
  const step1Valid = !!(contact.email && contact.phone);
  const step2Valid = selectedAddrId !== "new"
    ? !!selectedAddr
    : newMode === "home"
      ? !!(manualAddr.name && manualAddr.street && manualAddr.city)
      : newMode === "store"
        ? !!selectedStoreId
        : !!selectedPickupId;
  const step3Valid = selectedPmId !== "new"
    ? selectedPm?.type === "card" ? !!savedCardCvv : true
    : payMethod === "card"
      ? !!(payment.cardNumber && payment.cardName && payment.expiry && payment.cvv)
      : payMethod === "paypal"
        ? !!paypalEmail
        : true;

  /* Delivery summary */
  function deliverySummary() {
    if (selectedAddr) {
      return selectedAddr.deliveryType === "home"
        ? `${selectedAddr.street}, ${selectedAddr.city}, ${selectedAddr.state} ${selectedAddr.zip}`
        : selectedAddr.locationName ?? "";
    }
    if (newMode === "home" && manualAddr.street) return `${manualAddr.street}, ${manualAddr.city}`;
    if (newMode === "store" && selectedStore) return `${selectedStore.name} · ${selectedStore.address}`;
    if (newMode === "pickup" && selectedPickup) return `${selectedPickup.name} · ${selectedPickup.address}`;
    return "";
  }

  /* Payment collapsed summary */
  function paymentSummaryLabel() {
    if (selectedPm) {
      if (selectedPm.type === "card") return `${selectedPm.cardBrand === "mastercard" ? "Mastercard" : "Visa"} ···· ${selectedPm.cardLast4}`;
      if (selectedPm.type === "paypal") return `PayPal · ${selectedPm.paypalEmail}`;
      if (selectedPm.type === "usdt") return `USDT · ${selectedPm.cryptoNetwork}`;
      if (selectedPm.type === "btc") return `Bitcoin · ${selectedPm.cryptoNetwork}`;
    }
    if (selectedPmId === "new") {
      if (payMethod === "card" && payment.cardNumber)
        return `•••• •••• •••• ${payment.cardNumber.replace(/\s/g, "").slice(-4)}`;
      if (payMethod === "paypal") return `PayPal · ${paypalEmail}`;
      if (payMethod === "usdt") return "USDT (TRC-20)";
      if (payMethod === "btc") return "Bitcoin (BTC)";
    }
    return "";
  }

  // Helper: get logo for a payment method
  function pmLogo(pm: PaymentMethod) {
    if (pm.type === "card") return pm.cardBrand === "mastercard" ? <MastercardLogo size={18} /> : <VisaLogo size={16} />;
    if (pm.type === "paypal") return <PayPalLogo size={18} />;
    if (pm.type === "usdt") return <USDTLogo size={16} />;
    return <BTCLogo size={16} />;
  }
  function pmDetailLabel(pm: PaymentMethod) {
    if (pm.type === "card") return `${pm.cardBrand === "mastercard" ? "Mastercard" : "Visa"} ···· ${pm.cardLast4} · Vence ${pm.cardExpiry}`;
    if (pm.type === "paypal") return pm.paypalEmail ?? "";
    return pm.cryptoNetwork ?? "";
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedAddr(true);
      setTimeout(() => setCopiedAddr(false), 2000);
    });
  }

  const handleSubmit = async () => {
    if (!step1Valid || !step2Valid || !step3Valid) return;
    setIsProcessing(true);
    setOrderError(null);
    setOrderSnapshot([...items]);
    setTotalsSnapshot({ subtotal, shipping, tax, total });

    try {
      /* 1 ─ Build shippingAddress object */
      let shippingAddress: Record<string, unknown>;
      if (selectedAddrId !== "new" && selectedAddr) {
        shippingAddress = {
          fullName: selectedAddr.name,
          street: selectedAddr.street,
          city: selectedAddr.city,
          region: selectedAddr.state,
          postalCode: selectedAddr.zip,
          country: selectedAddr.country,
          phone: contact.phone,
        };
      } else if (newMode === "store" && selectedStore) {
        shippingAddress = {
          fullName: manualAddr.name || `${user.firstName} ${user.lastName}`,
          street: selectedStore.address,
          city: "",
          region: "",
          postalCode: "",
          country: "",
          phone: contact.phone,
          locationId: selectedStoreId,
          locationType: "store",
          locationName: selectedStore.name,
        };
      } else if (newMode === "pickup" && selectedPickup) {
        shippingAddress = {
          fullName: manualAddr.name || `${user.firstName} ${user.lastName}`,
          street: selectedPickup.address,
          city: "",
          region: "",
          postalCode: "",
          country: "",
          phone: contact.phone,
          locationId: selectedPickupId,
          locationType: "pickup",
          locationName: selectedPickup.name,
        };
      } else {
        shippingAddress = {
          fullName: manualAddr.name,
          street: manualAddr.street,
          city: manualAddr.city,
          region: manualAddr.state,
          postalCode: manualAddr.zip,
          country: manualAddr.country,
          phone: contact.phone,
        };
      }

      /* 2 ─ Determine paymentMethod string */
      const activePmType = selectedPm ? selectedPm.type : payMethod;
      const paymentMethodMap: Record<string, string> = {
        card: "CREDIT_CARD",
        paypal: "PAYPAL",
        usdt: "CRYPTO_USDT",
        btc: "CRYPTO_BTC",
      };
      const paymentMethodStr = paymentMethodMap[activePmType] ?? "CREDIT_CARD";

      /* 3 ─ Create order via backend (DRAFT status — no stock deducted yet) */
      const order = await orderRepository.createOrder({
        shippingAddress,
        paymentMethod: paymentMethodStr,
        couponCode: couponResult?.valid ? couponCode.trim() : undefined,
        notes: undefined,
      });
      setCreatedOrder(order);

      /* 4 ─ Process payment */
      const activePm = selectedPm;
      const activeType = activePm ? activePm.type : payMethod;

      const methodMap: Record<string, "CARD" | "PAYPAL" | "USDT" | "BTC"> = {
        card: "CARD",
        paypal: "PAYPAL",
        usdt: "USDT",
        btc: "BTC",
      };

      try {
        await paymentRepository.processPayment({
          orderId: order.id,
          userId: user.id,
          email: contact.email || user.email,
          amount: total,
          currency: "USD",
          paymentMethod: methodMap[activeType] ?? "CARD",
        });
      } catch (payErr) {
        // Payment failed → cancel the DRAFT order
        try { await orderRepository.cancelOrder(order.id); } catch { /* best-effort */ }
        throw payErr;
      }

      /* 5 ─ Confirm order (DRAFT → PENDING, deducts stock, creates invoice) */
      const confirmed = await orderRepository.confirmOrder(order.id);
      setCreatedOrder(confirmed);

      /* 5b ─ Redeem loyalty points (if any) */
      if (loyaltyPoints > 0) {
        try {
          await loyaltyRepository.redeemPoints(
            loyaltyPoints,
            `Canjeo en pedido ${confirmed.orderNumber ?? order.id}`,
            order.id,
          );
        } catch { /* best-effort — order is already confirmed */ }
      }

      /* 5c ─ Redeem gift card (if applied) */
      if (giftCardDiscount > 0 && giftCardCode.trim()) {
        try {
          await giftCardRepository.redeem({
            code: giftCardCode.trim(),
            amount: giftCardDiscount,
            orderId: order.id,
          });
        } catch { /* best-effort — order is already confirmed */ }
      }

      /* 6 ─ Try to fetch the backend invoice */
      try {
        const inv = await invoiceRepository.findByOrderId(order.id);
        setBackendInvoice(inv);
      } catch {
        /* Invoice might not be generated yet — that's fine */
      }

      /* 7 ─ Done */
      setIsProcessing(false);
      setOrderComplete(true);
      clearCart();
      toast.success("¡Pedido realizado con éxito!");
    } catch (err: unknown) {
      setIsProcessing(false);
      const msg = err instanceof Error ? err.message : "Error al procesar el pedido";
      setOrderError(msg);
      toast.error(msg);
    }
  };

  /* ── Order confirmed screen ── */
  if (orderComplete) {
    const orderId = createdOrder?.orderNumber ?? createdOrder?.id ?? "N/A";
    const today = new Date().toISOString().slice(0, 10);
    const due = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

    // Use backend invoice if available, otherwise build from order data
    const invoiceData = backendInvoice
      ? {
        invoiceNumber: backendInvoice.invoiceNumber,
        orderNumber: backendInvoice.orderNumber,
        date: backendInvoice.issueDate,
        dueDate: backendInvoice.dueDate,
        status: backendInvoice.status.toLowerCase() as "paid",
        customer: {
          name: backendInvoice.customerSnapshot?.name ?? "",
          email: backendInvoice.customerSnapshot?.email ?? "",
          phone: backendInvoice.customerSnapshot?.phone,
          address: backendInvoice.customerSnapshot?.address,
        },
        lines: (backendInvoice.lines ?? []).map((l) => ({
          name: String(l.name ?? ""),
          sku: String(l.sku ?? ""),
          quantity: Number(l.quantity ?? 0),
          unitPrice: Number(l.unitPrice ?? 0),
          total: Number(l.total ?? 0),
        })),
        subtotal: backendInvoice.subtotal,
        shipping: backendInvoice.shipping,
        tax: backendInvoice.tax,
        total: backendInvoice.total,
        paymentMethod: backendInvoice.paymentMethod,
      }
      : {
        invoiceNumber: `FAC-${orderId}`,
        orderNumber: orderId,
        date: today,
        dueDate: due,
        status: "paid" as const,
        customer: {
          name: `${user.firstName} ${user.lastName}`,
          email: contact.email,
          phone: contact.phone,
          address: deliverySummary() || undefined,
        },
        lines: orderSnapshot.map((item) => ({
          name: item.name,
          sku: item.sku,
          quantity: item.quantity,
          unitPrice: item.price,
          total: item.price * item.quantity,
        })),
        subtotal: totalsSnapshot?.subtotal ?? subtotal,
        shipping: totalsSnapshot?.shipping ?? shipping,
        tax: totalsSnapshot?.tax ?? tax,
        total: totalsSnapshot?.total ?? total,
        paymentMethod: paymentSummaryLabel() || undefined,
      };

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Confirmation banner */}
        <div className="bg-white border-b border-gray-100 px-4 py-4">
          <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-4 h-4 text-green-500" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-sm text-gray-900">¡Pedido confirmado!</p>
                <p className="text-xs text-gray-400 mt-0.5">Recibirás un correo de confirmación en breve · <span className="font-mono">{createdOrder?.orderNumber ?? orderId}</span></p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate("/account?tab=orders")}
                className="h-8 px-4 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Mis pedidos
              </button>
              <button
                onClick={() => navigate("/")}
                className="h-8 px-4 text-xs text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Seguir comprando
              </button>
            </div>
          </div>
        </div>

        {/* Full invoice */}
        <div className="py-8 px-4">
          <InvoiceDocument data={invoiceData} mode="page" />
        </div>
      </div>
    );
  }

  if (items.length === 0) { navigate("/cart"); return null; }

  /* ── New address mode tabs ── */
  const newModeTabs: { id: DeliveryType; label: string; icon: React.ReactNode }[] = [
    { id: "home", label: "Domicilio", icon: <Truck className="w-4 h-4" strokeWidth={1.5} /> },
    { id: "store", label: "Tienda NX036", icon: <Store className="w-4 h-4" strokeWidth={1.5} /> },
    { id: "pickup", label: "Punto entrega", icon: <Package2 className="w-4 h-4" strokeWidth={1.5} /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Back */}
        <button
          onClick={() => navigate("/cart")}
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
          Volver al carrito
        </button>

        <div className="grid lg:grid-cols-3 gap-8 items-start">

          {/* ── Left column: steps ── */}
          <div className="lg:col-span-2 space-y-4">
            <h1 className="text-xl text-gray-900 mb-6">Finalizar compra</h1>

            {/* ══ STEP 1: Contact ══════════════════════════════════ */}
            <Section>
              <button
                className="w-full flex items-center gap-3 px-6 py-5 text-left hover:bg-gray-50 transition-colors"
                onClick={() => setStep(1)}
              >
                <StepBadge n={1} active={step === 1} done={step > 1 && !!step1Valid} />
                <div className="flex-1">
                  <p className="text-sm text-gray-900">Información de contacto</p>
                  {step !== 1 && contact.email && (
                    <p className="text-xs text-gray-400 mt-0.5">{contact.email} · {contact.phone}</p>
                  )}
                </div>
                {step !== 1 && <ChevronRight className="w-4 h-4 text-gray-300" strokeWidth={1.5} />}
              </button>

              {step === 1 && (
                <div className="px-6 pb-6 border-t border-gray-50">
                  <div className="pt-5 grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1.5">
                        <Mail className="inline w-3 h-3 mr-1" strokeWidth={1.5} />
                        Email
                      </label>
                      <input
                        type="email"
                        value={contact.email}
                        onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))}
                        className="w-full text-sm text-gray-900 border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-gray-400 placeholder-gray-300"
                        placeholder="your@email.com"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1.5">
                        <Phone className="inline w-3 h-3 mr-1" strokeWidth={1.5} />
                        Teléfono
                      </label>
                      <input
                        type="tel"
                        value={contact.phone}
                        onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value }))}
                        className="w-full text-sm text-gray-900 border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-gray-400 placeholder-gray-300"
                        placeholder="+1 (212) 555-0000"
                      />
                    </div>
                  </div>
                  <div className="mt-5 flex justify-end">
                    <button
                      onClick={() => step1Valid && setStep(2)}
                      disabled={!step1Valid}
                      className={`inline-flex items-center gap-2 text-sm rounded-xl px-5 py-2.5 transition-colors ${step1Valid ? "bg-gray-200 text-gray-700 hover:bg-gray-300" : "bg-gray-100 text-gray-300 cursor-not-allowed"
                        }`}
                    >
                      Continuar
                      <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              )}
            </Section>

            {/* ══ STEP 2: Address ══════════════════════════════════ */}
            <Section>
              <button
                className="w-full flex items-center gap-3 px-6 py-5 text-left hover:bg-gray-50 transition-colors"
                onClick={() => step > 1 && setStep(2)}
              >
                <StepBadge n={2} active={step === 2} done={step > 2 && !!step2Valid} />
                <div className="flex-1">
                  <p className="text-sm text-gray-900">Dirección de entrega</p>
                  {step !== 2 && step2Valid && (
                    <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{deliverySummary()}</p>
                  )}
                </div>
                {step > 2 && <ChevronRight className="w-4 h-4 text-gray-300" strokeWidth={1.5} />}
              </button>

              {step === 2 && (
                <div className="px-6 pb-6 border-t border-gray-50">
                  <div className="pt-5 space-y-3">

                    {/* ── Saved addresses ── */}
                    {user.addresses.length > 0 && (
                      <>
                        <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Mis direcciones guardadas</p>
                        {user.addresses.map((addr) => {
                          const dt = deliveryMeta[addr.deliveryType ?? "home"];
                          const isSelected = selectedAddrId === addr.id;
                          return (
                            <button
                              key={addr.id}
                              type="button"
                              onClick={() => setSelectedAddrId(addr.id)}
                              className={`w-full text-left rounded-xl border-2 overflow-hidden transition-all ${isSelected ? "border-gray-500" : "border-gray-100 hover:border-gray-300"
                                }`}
                            >
                              <div className={`flex items-center gap-2 px-4 py-1.5 border-b ${isSelected ? "bg-gray-100 border-gray-200" : `${dt.bg} border-gray-100`
                                }`}>
                                <span className={isSelected ? "text-gray-700" : dt.color}>{dt.icon}</span>
                                <span className={`text-xs ${isSelected ? "text-gray-600" : dt.color}`}>{dt.label}</span>
                                {addr.isDefault && (
                                  <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full border text-gray-500 bg-white border-gray-200">
                                    Predeterminada
                                  </span>
                                )}
                              </div>
                              <div className={`px-4 py-3 flex items-start justify-between gap-4 ${isSelected ? "bg-gray-50" : "bg-white"}`}>
                                <div className="flex items-start gap-3 min-w-0">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isSelected ? "bg-gray-500 text-white" : "bg-gray-100 text-gray-500"
                                    }`}>
                                    {labelIcon(addr.label)}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm text-gray-900">{addr.label}</p>
                                    {addr.deliveryType === "home" ? (
                                      <>
                                        <p className="text-xs text-gray-500">{addr.name}</p>
                                        <p className="text-xs text-gray-400">{addr.street}</p>
                                        <p className="text-xs text-gray-400">{addr.city}, {addr.state} {addr.zip}</p>
                                        <p className="text-xs text-gray-400">{addr.country}</p>
                                      </>
                                    ) : (
                                      <div className="flex items-start gap-1.5 mt-0.5">
                                        <Building2 className="w-3 h-3 text-gray-400 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                                        <p className="text-xs text-gray-500">{addr.locationName}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${isSelected ? "border-gray-500 bg-gray-500" : "border-gray-200"
                                  }`}>
                                  {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={2.5} />}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </>
                    )}

                    {/* ── Other delivery options ── */}
                    <div className={`rounded-xl border-2 overflow-hidden transition-all ${selectedAddrId === "new" ? "border-gray-900" : "border-dashed border-gray-200 hover:border-gray-300"
                      }`}>
                      <button
                        type="button"
                        onClick={() => setSelectedAddrId("new")}
                        className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors ${selectedAddrId === "new" ? "bg-gray-50" : "bg-white hover:bg-gray-50"
                          }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${selectedAddrId === "new" ? "bg-gray-500 text-white" : "bg-gray-100 text-gray-400"
                          }`}>
                          <Plus className="w-4 h-4" strokeWidth={1.5} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-700">Usar otra dirección de entrega</p>
                          <p className="text-xs text-gray-400">Domicilio, tienda NX036 o punto de entrega</p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${selectedAddrId === "new" ? "border-gray-500 bg-gray-500" : "border-gray-200"
                          }`}>
                          {selectedAddrId === "new" && <Check className="w-3 h-3 text-white" strokeWidth={2.5} />}
                        </div>
                      </button>

                      {selectedAddrId === "new" && (
                        <div className="border-t border-gray-100 bg-gray-50/50 px-4 pb-5">
                          {/* Mode tabs */}
                          <div className="flex gap-2 pt-4 mb-4">
                            {newModeTabs.map(({ id, label, icon }) => {
                              const meta = deliveryMeta[id];
                              const active = newMode === id;
                              return (
                                <button
                                  key={id}
                                  type="button"
                                  onClick={() => setNewMode(id)}
                                  className={`flex-1 flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 text-xs transition-all ${active
                                    ? `border-gray-900 bg-white ${meta.color}`
                                    : "border-gray-200 bg-white text-gray-400 hover:border-gray-300 hover:text-gray-600"
                                    }`}
                                >
                                  <span className={active ? meta.color : "text-gray-400"}>{icon}</span>
                                  {label}
                                </button>
                              );
                            })}
                          </div>

                          {/* Home delivery form */}
                          {newMode === "home" && (
                            <div className="space-y-3">
                              <div>
                                <label className="block text-xs text-gray-400 mb-1.5">
                                  <User className="inline w-3 h-3 mr-1" strokeWidth={1.5} />
                                  Full name
                                </label>
                                <input
                                  value={manualAddr.name}
                                  onChange={(e) => setManualAddr((m) => ({ ...m, name: e.target.value }))}
                                  className="w-full text-sm text-gray-900 border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-gray-400 bg-white placeholder-gray-300"
                                  placeholder="Full name"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-400 mb-1.5">Street address</label>
                                <input
                                  value={manualAddr.street}
                                  onChange={(e) => setManualAddr((m) => ({ ...m, street: e.target.value }))}
                                  className="w-full text-sm text-gray-900 border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-gray-400 bg-white placeholder-gray-300"
                                  placeholder="Street, number, apt / suite"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs text-gray-400 mb-1.5">City</label>
                                  <input
                                    value={manualAddr.city}
                                    onChange={(e) => setManualAddr((m) => ({ ...m, city: e.target.value }))}
                                    className="w-full text-sm text-gray-900 border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-gray-400 bg-white placeholder-gray-300"
                                    placeholder="New York"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-400 mb-1.5">State / County</label>
                                  <input
                                    value={manualAddr.state}
                                    onChange={(e) => setManualAddr((m) => ({ ...m, state: e.target.value }))}
                                    className="w-full text-sm text-gray-900 border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-gray-400 bg-white placeholder-gray-300"
                                    placeholder="NY"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-400 mb-1.5">ZIP / Postcode</label>
                                  <input
                                    value={manualAddr.zip}
                                    onChange={(e) => setManualAddr((m) => ({ ...m, zip: e.target.value }))}
                                    className="w-full text-sm text-gray-900 border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-gray-400 bg-white placeholder-gray-300"
                                    placeholder="10001"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-400 mb-1.5">Country</label>
                                  <input
                                    value={manualAddr.country}
                                    onChange={(e) => setManualAddr((m) => ({ ...m, country: e.target.value }))}
                                    className="w-full text-sm text-gray-900 border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-gray-400 bg-white placeholder-gray-300"
                                    placeholder="United States"
                                  />
                                </div>
                              </div>
                              <div className="flex items-start gap-2 pt-1">
                                <AlertCircle className="w-3.5 h-3.5 text-gray-300 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                                <p className="text-xs text-gray-400">
                                  Para guardar esta dirección,{" "}
                                  <button
                                    type="button"
                                    onClick={() => navigate("/account?tab=addresses")}
                                    className="underline hover:text-gray-600 transition-colors"
                                  >
                                    ve a Mis Direcciones
                                  </button>.
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Store pickup list */}
                          {newMode === "store" && (
                            <div className="space-y-2">
                              <p className="text-xs text-gray-400 mb-1">Selecciona tu tienda NX036 más cercana</p>
                              {storeLocations.map((store) => {
                                const isSelected = selectedStoreId === store.id;
                                return (
                                  <button
                                    key={store.id}
                                    type="button"
                                    onClick={() => setSelectedStoreId(store.id)}
                                    className={`w-full text-left rounded-xl border-2 px-4 py-3 flex items-start gap-3 transition-all ${isSelected ? "border-violet-500 bg-violet-50/40" : "border-gray-200 bg-white hover:border-violet-300"
                                      }`}
                                  >
                                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${isSelected ? "bg-violet-500 text-white" : "bg-violet-50 text-violet-400"
                                      }`}>
                                      <Store className="w-4 h-4" strokeWidth={1.5} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm text-gray-900">{store.name}</p>
                                      <div className="flex items-start gap-1 mt-0.5">
                                        <MapPin className="w-3 h-3 text-gray-300 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                                        <p className="text-xs text-gray-400">{store.address}</p>
                                      </div>
                                      <div className="flex items-center gap-3 mt-1.5">
                                        <div className="flex items-center gap-1">
                                          <Clock className="w-3 h-3 text-gray-300" strokeWidth={1.5} />
                                          <span className="text-[11px] text-gray-400">{store.hours}</span>
                                        </div>
                                        {store.distance !== "—" && (
                                          <div className="flex items-center gap-1">
                                            <Navigation className="w-3 h-3 text-gray-300" strokeWidth={1.5} />
                                            <span className="text-[11px] text-gray-400">{store.distance}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${isSelected ? "border-violet-500 bg-violet-500" : "border-gray-200"
                                      }`}>
                                      {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={2.5} />}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          {/* Pickup point list */}
                          {newMode === "pickup" && (
                            <div className="space-y-2">
                              <p className="text-xs text-gray-400 mb-1">Selecciona un punto de entrega o locker cercano</p>
                              {pickupPoints.map((point) => {
                                const isSelected = selectedPickupId === point.id;
                                return (
                                  <button
                                    key={point.id}
                                    type="button"
                                    onClick={() => setSelectedPickupId(point.id)}
                                    className={`w-full text-left rounded-xl border-2 px-4 py-3 flex items-start gap-3 transition-all ${isSelected ? "border-emerald-500 bg-emerald-50/40" : "border-gray-200 bg-white hover:border-emerald-300"
                                      }`}
                                  >
                                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${isSelected ? "bg-emerald-500 text-white" : "bg-emerald-50 text-emerald-400"
                                      }`}>
                                      <Package2 className="w-4 h-4" strokeWidth={1.5} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <p className="text-sm text-gray-900">{point.name}</p>
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${isSelected
                                          ? "text-emerald-700 bg-emerald-100 border-emerald-200"
                                          : "text-gray-400 bg-gray-50 border-gray-200"
                                          }`}>
                                          {point.type}
                                        </span>
                                      </div>
                                      <div className="flex items-start gap-1 mt-0.5">
                                        <MapPin className="w-3 h-3 text-gray-300 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                                        <p className="text-xs text-gray-400">{point.address}</p>
                                      </div>
                                      <div className="flex items-center gap-3 mt-1.5">
                                        <div className="flex items-center gap-1">
                                          <Clock className="w-3 h-3 text-gray-300" strokeWidth={1.5} />
                                          <span className="text-[11px] text-gray-400">{point.hours}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <Navigation className="w-3 h-3 text-gray-300" strokeWidth={1.5} />
                                          <span className="text-[11px] text-gray-400">{point.distance}</span>
                                        </div>
                                      </div>
                                    </div>
                                    <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${isSelected ? "border-emerald-500 bg-emerald-500" : "border-gray-200"
                                      }`}>
                                      {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={2.5} />}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                  </div>

                  <div className="mt-5 flex justify-end">
                    <button
                      onClick={() => step2Valid && setStep(3)}
                      disabled={!step2Valid}
                      className={`inline-flex items-center gap-2 text-sm rounded-xl px-5 py-2.5 transition-colors ${step2Valid ? "bg-gray-200 text-gray-700 hover:bg-gray-300" : "bg-gray-100 text-gray-300 cursor-not-allowed"
                        }`}
                    >
                      Continuar
                      <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              )}
            </Section>

            {/* ══ STEP 3: Payment ══════════════════════════════════ */}
            <Section>
              <button
                className="w-full flex items-center gap-3 px-6 py-5 text-left hover:bg-gray-50 transition-colors"
                onClick={() => step > 2 && setStep(3)}
              >
                <StepBadge n={3} active={step === 3} done={false} />
                <div className="flex-1">
                  <p className="text-sm text-gray-900">Pago</p>
                  {step !== 3 && paymentSummaryLabel() && (
                    <p className="text-xs text-gray-400 mt-0.5">{paymentSummaryLabel()}</p>
                  )}
                </div>
                {step > 3 && <ChevronRight className="w-4 h-4 text-gray-300" strokeWidth={1.5} />}
              </button>

              {step === 3 && (
                <div className="px-6 pb-6 border-t border-gray-50">
                  <div className="pt-5 space-y-3">

                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Método de pago</p>

                    {/* ── Saved method dropdown ── */}
                    {user.paymentMethods.length > 0 && selectedPmId !== "new" && selectedPm && (
                      <div className="space-y-3">
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setPmDropdownOpen(prev => !prev)}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 bg-white hover:border-gray-400 transition-colors text-left"
                          >
                            <span className="flex-shrink-0">{pmLogo(selectedPm)}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-900 truncate">{selectedPm.label}</p>
                              <p className="text-xs text-gray-400 truncate">{pmDetailLabel(selectedPm)}</p>
                            </div>
                            {selectedPm.isDefault && (
                              <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full flex-shrink-0">Predeterminado</span>
                            )}
                            <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${pmDropdownOpen ? "rotate-180" : ""}`} strokeWidth={1.5} />
                          </button>

                          {pmDropdownOpen && (
                            <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-72 overflow-y-auto">
                              {user.paymentMethods.map((pm) => (
                                <button
                                  key={pm.id}
                                  type="button"
                                  onClick={() => { setSelectedPmId(pm.id); setSavedCardCvv(""); setPmDropdownOpen(false); }}
                                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 ${pm.id === selectedPmId ? "bg-gray-50" : ""}`}
                                >
                                  <span className="flex-shrink-0">{pmLogo(pm)}</span>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm text-gray-900 truncate">{pm.label}</p>
                                    <p className="text-xs text-gray-400 truncate">{pmDetailLabel(pm)}</p>
                                  </div>
                                  {pm.id === selectedPmId && <Check className="w-4 h-4 text-gray-500 flex-shrink-0" strokeWidth={2} />}
                                </button>
                              ))}
                              {/* Option to add new method */}
                              <button
                                type="button"
                                onClick={() => { setSelectedPmId("new"); setPmDropdownOpen(false); }}
                                className="w-full flex items-center gap-3 px-4 py-3 text-left border-t border-gray-100 hover:bg-gray-50 transition-colors"
                              >
                                <div className="w-[18px] h-[18px] rounded flex items-center justify-center bg-gray-100 flex-shrink-0">
                                  <Plus className="w-3 h-3 text-gray-500" strokeWidth={2} />
                                </div>
                                <p className="text-sm text-gray-600">Usar otro método de pago</p>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* CVV for saved cards */}
                        {selectedPm.type === "card" && (
                          <div>
                            <label className="block text-xs text-gray-400 mb-1.5">
                              <Shield className="inline w-3 h-3 mr-1" strokeWidth={1.5} />
                              Confirma tu CVV para continuar
                            </label>
                            <div className="relative w-32">
                              <input
                                type="password"
                                value={savedCardCvv}
                                onChange={(e) => setSavedCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                                className="w-full text-sm text-gray-900 border border-gray-200 rounded-lg px-3 py-2 pr-9 focus:outline-none focus:border-gray-400 font-mono placeholder-gray-300"
                                placeholder="•••"
                                maxLength={4}
                              />
                              <Shield className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" strokeWidth={1.5} />
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                          <Lock className="w-3 h-3" strokeWidth={1.5} />
                          Pago 100% seguro con cifrado SSL de 256 bits
                        </div>
                      </div>
                    )}

                    {/* ── New method form ── */}
                    {(selectedPmId === "new" || user.paymentMethods.length === 0) && (
                      <div className="rounded-xl border border-gray-100 bg-white overflow-hidden">
                        {/* Link back to saved methods */}
                        {user.paymentMethods.length > 0 && (
                          <div className="px-4 pt-4">
                            <button
                              type="button"
                              onClick={() => { const def = user.paymentMethods.find(p => p.isDefault) ?? user.paymentMethods[0]; if (def) setSelectedPmId(def.id); }}
                              className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors mb-1"
                            >
                              <ChevronLeft className="w-3 h-3" strokeWidth={1.5} />
                              Volver a mis métodos guardados
                            </button>
                          </div>
                        )}

                        {selectedPmId === "new" && (
                          <div className="border-t border-gray-100 bg-gray-50/50 px-4 pb-5">
                            {/* Method type tabs */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4 mb-5">
                              {([
                                { id: "card", logo: <div className="flex items-center gap-1.5"><VisaLogo size={16} /><MastercardLogo size={22} /></div>, label: "Tarjeta" },
                                { id: "paypal", logo: <PayPalLogo size={18} />, label: "PayPal" },
                                { id: "usdt", logo: <USDTLogo size={22} />, label: "USDT" },
                                { id: "btc", logo: <BTCLogo size={22} />, label: "Bitcoin" },
                              ] as const).map(({ id, logo, label }) => (
                                <button
                                  key={id}
                                  type="button"
                                  onClick={() => setPayMethod(id)}
                                  className={`relative flex flex-col items-center gap-1.5 rounded-xl border-2 px-2 py-3 transition-all ${payMethod === id ? "border-gray-500 bg-white" : "border-gray-200 bg-white hover:border-gray-300"
                                    }`}
                                >
                                  <div className="h-6 flex items-center">{logo}</div>
                                  <span className="text-[11px] text-gray-500">{label}</span>
                                  {payMethod === id && (
                                    <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-gray-500 flex items-center justify-center">
                                      <Check className="w-2 h-2 text-white" strokeWidth={3} />
                                    </span>
                                  )}
                                </button>
                              ))}
                            </div>

                            {/* New card form */}
                            {payMethod === "card" && (
                              <div className="space-y-4">
                                {/* Accepted cards bar */}
                                <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-100">
                                  <span className="text-[11px] text-gray-400 flex-shrink-0">Aceptamos:</span>
                                  <VisaLogo size={18} />
                                  <MastercardLogo size={22} />
                                  <span className="ml-auto">
                                    <Lock className="w-3.5 h-3.5 text-gray-300" strokeWidth={1.5} />
                                  </span>
                                </div>

                                {/* Card number */}
                                <div>
                                  <label className="block text-xs text-gray-400 mb-1.5">Número de tarjeta</label>
                                  <div className="relative">
                                    <input
                                      value={payment.cardNumber}
                                      onChange={(e) => {
                                        const raw = e.target.value.replace(/\D/g, "").slice(0, 16);
                                        const fmt = raw.match(/.{1,4}/g)?.join(" ") ?? raw;
                                        setPayment((p) => ({ ...p, cardNumber: fmt }));
                                      }}
                                      className="w-full text-sm text-gray-900 border border-gray-200 rounded-lg px-3 py-2.5 pr-28 focus:outline-none focus:border-gray-400 placeholder-gray-300 font-mono tracking-widest"
                                      placeholder="1234 5678 9012 3456"
                                      maxLength={19}
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 opacity-50">
                                      <VisaLogo size={16} />
                                      <MastercardLogo size={22} />
                                    </div>
                                  </div>
                                </div>

                                {/* Card name */}
                                <div>
                                  <label className="block text-xs text-gray-400 mb-1.5">Nombre en la tarjeta</label>
                                  <input
                                    value={payment.cardName}
                                    onChange={(e) => setPayment((p) => ({ ...p, cardName: e.target.value.toUpperCase() }))}
                                    className="w-full text-sm text-gray-900 border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-gray-400 placeholder-gray-300 uppercase tracking-wider"
                                    placeholder="FIRST LAST"
                                  />
                                </div>

                                {/* Expiry + CVV */}
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-xs text-gray-400 mb-1.5">Vencimiento</label>
                                    <input
                                      value={payment.expiry}
                                      onChange={(e) => {
                                        let v = e.target.value.replace(/\D/g, "").slice(0, 4);
                                        if (v.length > 2) v = v.slice(0, 2) + "/" + v.slice(2);
                                        setPayment((p) => ({ ...p, expiry: v }));
                                      }}
                                      className="w-full text-sm text-gray-900 border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-gray-400 placeholder-gray-300 font-mono"
                                      placeholder="MM/YY"
                                      maxLength={5}
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-gray-400 mb-1.5">CVV</label>
                                    <div className="relative">
                                      <input
                                        value={payment.cvv}
                                        onChange={(e) => setPayment((p) => ({ ...p, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
                                        className="w-full text-sm text-gray-900 border border-gray-200 rounded-lg px-3 py-2.5 pr-10 focus:outline-none focus:border-gray-400 placeholder-gray-300 font-mono"
                                        placeholder="•••"
                                        maxLength={4}
                                        type="password"
                                      />
                                      <Shield className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" strokeWidth={1.5} />
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 pt-1">
                                  <Lock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" strokeWidth={1.5} />
                                  <p className="text-xs text-gray-400">Todos tus datos de pago están encriptados y seguros.</p>
                                </div>
                              </div>
                            )}

                            {/* ══ PayPal form ══ */}
                            {payMethod === "paypal" && (
                              <div className="space-y-4">
                                <div className="flex items-center gap-3 px-4 py-3.5 bg-sky-50/40 rounded-xl border border-sky-100">
                                  <PayPalLogo size={22} />
                                  <p className="text-xs text-gray-500 leading-relaxed">
                                    Serás redirigido a PayPal para completar tu pago de forma segura. No compartimos tus datos bancarios.
                                  </p>
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-400 mb-1.5">
                                    <Mail className="inline w-3 h-3 mr-1" strokeWidth={1.5} />
                                    Email de tu cuenta PayPal
                                  </label>
                                  <input
                                    type="email"
                                    value={paypalEmail}
                                    onChange={(e) => setPaypalEmail(e.target.value)}
                                    className="w-full text-sm text-gray-900 border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#179BD7]/60 placeholder-gray-300"
                                    placeholder="your@paypal.com"
                                  />
                                </div>
                                <div className="flex items-center gap-2 pt-1">
                                  <Shield className="w-3.5 h-3.5 text-[#179BD7] flex-shrink-0" strokeWidth={1.5} />
                                  <p className="text-xs text-gray-400">PayPal protege tus datos bancarios con cifrado de extremo a extremo.</p>
                                </div>
                              </div>
                            )}

                            {/* ══ USDT form ══ */}
                            {payMethod === "usdt" && (
                              <div className="space-y-4">
                                <div className="flex items-start gap-3 px-4 py-3.5 bg-emerald-50/40 rounded-xl border border-emerald-100">
                                  <USDTLogo size={20} />
                                  <p className="text-xs text-gray-500 leading-relaxed">
                                    Envía <span className="text-gray-800">exactamente</span> el importe indicado en USDT a la dirección de abajo. El pedido se procesará tras <span className="text-gray-800">1 confirmación</span> en red.
                                  </p>
                                </div>

                                {/* Network selector */}
                                <div>
                                  <label className="block text-xs text-gray-400 mb-1.5">Red de pago</label>
                                  <div className="flex gap-2 flex-wrap">
                                    {[
                                      { label: "TRC-20 (TRON)", active: true },
                                      { label: "ERC-20 (Ethereum)", active: false },
                                      { label: "BEP-20 (BSC)", active: false },
                                    ].map(({ label, active }) => (
                                      <button
                                        key={label}
                                        type="button"
                                        className={`text-[11px] px-3 py-1.5 rounded-full border transition-colors ${active
                                          ? "bg-emerald-600 text-white border-emerald-600"
                                          : "text-gray-400 border-gray-200 hover:border-gray-300"
                                          }`}
                                      >
                                        {label}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                {/* Amount */}
                                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl border border-gray-100">
                                  <span className="text-xs text-gray-400">Importe exacto a enviar</span>
                                  <span className="text-sm text-gray-900 font-mono">{total.toFixed(2)} USDT</span>
                                </div>

                                {/* Address */}
                                <div>
                                  <label className="block text-xs text-gray-400 mb-1.5">Dirección de wallet USDT (TRC-20)</label>
                                  <div className="flex gap-2">
                                    <div className="flex-1 flex items-center px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                                      <span className="text-xs text-gray-700 font-mono truncate select-all">{MOCK_USDT_ADDRESS}</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => copyToClipboard(MOCK_USDT_ADDRESS)}
                                      className={`flex-shrink-0 flex items-center gap-1.5 text-xs px-3 py-2.5 rounded-lg border transition-all ${copiedAddr
                                        ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                                        : "text-gray-500 border-gray-200 hover:border-gray-400 hover:bg-gray-50"
                                        }`}
                                    >
                                      {copiedAddr ? <Check className="w-3.5 h-3.5" strokeWidth={2.5} /> : <Copy className="w-3.5 h-3.5" strokeWidth={1.5} />}
                                      {copiedAddr ? "Copiado" : "Copiar"}
                                    </button>
                                  </div>
                                </div>

                                <div className="flex items-start gap-2">
                                  <AlertCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                                  <p className="text-xs text-gray-400">
                                    Envía únicamente <strong className="text-gray-600">USDT en red TRC-20</strong>. Envíos en otras redes o de otras monedas pueden perderse permanentemente.
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* ══ BTC form ══ */}
                            {payMethod === "btc" && (
                              <div className="space-y-4">
                                <div className="flex items-start gap-3 px-4 py-3.5 bg-orange-50/40 rounded-xl border border-orange-100">
                                  <BTCLogo size={20} />
                                  <p className="text-xs text-gray-500 leading-relaxed">
                                    Envía <span className="text-gray-800">exactamente</span> el importe indicado en BTC a la dirección de abajo. El pedido se procesará tras <span className="text-gray-800">2 confirmaciones</span> en la blockchain.
                                  </p>
                                </div>

                                {/* BTC amount */}
                                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl border border-gray-100">
                                  <span className="text-xs text-gray-400">Importe exacto a enviar</span>
                                  <div className="text-right">
                                    <p className="text-sm text-gray-900 font-mono">{(total / btcRate).toFixed(6)} BTC</p>
                                    <p className="text-[11px] text-gray-400">≈ ${total.toFixed(2)} USD · 1 BTC ≈ ${btcRate.toLocaleString()}</p>
                                  </div>
                                </div>

                                {/* Address */}
                                <div>
                                  <label className="block text-xs text-gray-400 mb-1.5">Dirección Bitcoin (Native SegWit · bc1q…)</label>
                                  <div className="flex gap-2">
                                    <div className="flex-1 flex items-center px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                                      <span className="text-xs text-gray-700 font-mono truncate select-all">{MOCK_BTC_ADDRESS}</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => copyToClipboard(MOCK_BTC_ADDRESS)}
                                      className={`flex-shrink-0 flex items-center gap-1.5 text-xs px-3 py-2.5 rounded-lg border transition-all ${copiedAddr
                                        ? "bg-orange-50 text-orange-600 border-orange-200"
                                        : "text-gray-500 border-gray-200 hover:border-gray-400 hover:bg-gray-50"
                                        }`}
                                    >
                                      {copiedAddr ? <Check className="w-3.5 h-3.5" strokeWidth={2.5} /> : <Copy className="w-3.5 h-3.5" strokeWidth={1.5} />}
                                      {copiedAddr ? "Copiado" : "Copiar"}
                                    </button>
                                  </div>
                                </div>

                                <div className="flex items-start gap-2">
                                  <AlertCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                                  <p className="text-xs text-gray-400">
                                    Envía únicamente <strong className="text-gray-600">Bitcoin (BTC)</strong> a esta dirección. No envíes BCH, BSV ni ninguna otra criptomoneda.
                                  </p>
                                </div>
                              </div>
                            )}

                          </div>
                        )}
                      </div>
                    )}

                  </div>

                  {/* Submit button — color adapts to active method */}
                  {(() => {
                    const activePm = selectedPm;
                    const activeType = activePm ? activePm.type : payMethod;
                    const btnColor = !step3Valid || isProcessing
                      ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                      : activeType === "paypal" ? "bg-[#179BD7] text-white hover:bg-[#1589be]"
                        : activeType === "usdt" ? "bg-[#26A17B] text-white hover:bg-[#1e8a69]"
                          : activeType === "btc" ? "bg-[#F7931A] text-white hover:bg-[#e07f0a]"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300";
                    const btnLabel = activePm
                      ? activePm.type === "paypal" ? `Pagar con PayPal · $${total.toFixed(2)}`
                        : activePm.type === "usdt" ? `Confirmar pago · ${total.toFixed(2)} USDT`
                          : activePm.type === "btc" ? `Confirmar pago · ${(total / btcRate).toFixed(6)} BTC`
                            : `Confirmar pedido · $${total.toFixed(2)}`
                      : payMethod === "paypal" ? `Pagar con PayPal · $${total.toFixed(2)}`
                        : payMethod === "usdt" ? `Confirmar pago · ${total.toFixed(2)} USDT`
                          : payMethod === "btc" ? `Confirmar pago · ${(total / btcRate).toFixed(6)} BTC`
                            : `Confirmar pedido · $${total.toFixed(2)}`;
                    return (
                      <button
                        onClick={handleSubmit}
                        disabled={isProcessing || !step3Valid}
                        className={`mt-4 w-full inline-flex items-center justify-center gap-2 text-sm rounded-xl px-5 py-3.5 transition-colors ${btnColor}`}
                      >
                        {isProcessing ? (
                          <>
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Procesando pago…
                          </>
                        ) : (
                          <>
                            <Lock className="w-4 h-4" strokeWidth={1.5} />
                            {btnLabel}
                          </>
                        )}
                      </button>
                    );
                  })()}
                </div>
              )}
            </Section>
          </div>

          {/* ── Right column: order summary ── */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm sticky top-24 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-sm text-gray-900">Resumen del pedido</h2>
                <p className="text-xs text-gray-400 mt-0.5">{items.length} {items.length === 1 ? "producto" : "productos"}</p>
              </div>

              {/* Items */}
              <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="relative flex-shrink-0">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-12 h-12 object-cover rounded-lg border border-gray-100"
                      />
                      <span className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 bg-gray-500 text-white text-[10px] rounded-full flex items-center justify-center leading-none px-1">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-900 line-clamp-2 leading-tight">{item.name}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{item.category}</p>
                      {/* Variant attributes selected */}
                      {(item as any).selectedAttrs && Object.keys((item as any).selectedAttrs).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {Object.entries((item as any).selectedAttrs as Record<string, string>).map(([k, v]) => (
                            <span key={k} className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-px rounded">
                              {k}: {v}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-900 flex-shrink-0">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>

              {/* Coupon */}
              <div className="px-5 py-3 border-t border-gray-50">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" strokeWidth={1.5} />
                    <input
                      value={couponCode}
                      onChange={(e) => { setCouponCode(e.target.value); setCouponResult(null); }}
                      placeholder="Código de descuento"
                      className="w-full text-xs text-gray-900 border border-gray-200 rounded-lg pl-8 pr-3 py-2 focus:outline-none focus:border-gray-400 placeholder-gray-300"
                    />
                  </div>
                  <button
                    onClick={applyCoupon}
                    disabled={couponLoading || !couponCode.trim()}
                    className="text-xs text-gray-700 border border-gray-200 rounded-lg px-3 py-2 hover:border-gray-400 hover:bg-gray-50 transition-colors flex-shrink-0 disabled:opacity-40"
                  >
                    {couponLoading ? "…" : "Aplicar"}
                  </button>
                </div>
                {couponResult?.valid && (
                  <p className="text-xs text-green-600 mt-1.5">
                    Descuento aplicado: -${couponDiscount.toFixed(2)}
                  </p>
                )}
              </div>

              {/* Loyalty points redemption */}
              {loyaltyBalance > 0 && (
                <div className="px-5 py-3 border-t border-gray-50">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-3.5 h-3.5 text-amber-400" strokeWidth={1.5} />
                    <span className="text-xs text-gray-600">Puntos de fidelidad</span>
                    <span className="ml-auto text-xs text-amber-600 tabular-nums">
                      {loyaltyBalance.toLocaleString()} pts
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min={0}
                      max={Math.min(loyaltyBalance, Math.floor((subtotal + shipping + tax - couponDiscount) * loyaltyRate))}
                      value={loyaltyPoints || ""}
                      onChange={(e) => {
                        const v = Math.max(0, Math.min(
                          Math.min(loyaltyBalance, Math.floor((subtotal + shipping + tax - couponDiscount) * loyaltyRate)),
                          parseInt(e.target.value) || 0,
                        ));
                        setLoyaltyPoints(v);
                      }}
                      placeholder="0"
                      className="w-full text-xs text-gray-900 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-gray-400 placeholder-gray-300 tabular-nums"
                    />
                    <button
                      onClick={() => setLoyaltyPoints(
                        Math.min(loyaltyBalance, Math.floor((subtotal + shipping + tax - couponDiscount) * loyaltyRate)),
                      )}
                      className="text-xs text-gray-700 border border-gray-200 rounded-lg px-3 py-2 hover:border-gray-400 hover:bg-gray-50 transition-colors flex-shrink-0"
                    >
                      Máx
                    </button>
                  </div>
                  {loyaltyPoints > 0 && (
                    <p className="text-xs text-amber-600 mt-1.5">
                      Descuento: -${loyaltyDiscount.toFixed(2)} ({loyaltyPoints} pts × {loyaltyRate} pts/$1)
                    </p>
                  )}
                </div>
              )}

              {/* Gift card */}
              <div className="px-5 py-3 border-t border-gray-50">
                <div className="flex items-center gap-2 mb-2">
                  <Gift className="w-3.5 h-3.5 text-violet-400" strokeWidth={1.5} />
                  <span className="text-xs text-gray-600">Tarjeta regalo</span>
                </div>
                <div className="flex gap-2">
                  <input
                    value={giftCardCode}
                    onChange={(e) => { setGiftCardCode(e.target.value.toUpperCase()); setGiftCardBalance(null); setGiftCardError(null); }}
                    placeholder="GC-XXXX-XXXX-XXXX"
                    className="w-full text-xs text-gray-900 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-gray-400 placeholder-gray-300 font-mono"
                  />
                  <button
                    onClick={applyGiftCard}
                    disabled={giftCardLoading || !giftCardCode.trim()}
                    className="text-xs text-gray-700 border border-gray-200 rounded-lg px-3 py-2 hover:border-gray-400 hover:bg-gray-50 transition-colors flex-shrink-0 disabled:opacity-40"
                  >
                    {giftCardLoading ? "…" : "Aplicar"}
                  </button>
                </div>
                {giftCardError && (
                  <p className="text-xs text-red-500 mt-1.5">{giftCardError}</p>
                )}
                {giftCardBalance !== null && giftCardBalance > 0 && (
                  <p className="text-xs text-violet-600 mt-1.5">
                    Saldo: ${giftCardBalance.toFixed(2)} · Descuento: -${giftCardDiscount.toFixed(2)}
                  </p>
                )}
              </div>

              {/* Totals */}
              <div className="px-5 py-4 border-t border-gray-100 space-y-2.5">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Envío{selectedShipping ? ` · ${selectedShipping.name}` : ""}</span>
                  <span className={shipping === 0 ? "text-green-600" : ""}>
                    {shipping === 0 ? "Gratis" : `$${shipping.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Impuestos{taxCalc ? "" : " (est.)"}{taxLoading ? " …" : ""}</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-xs text-green-600">
                    <span>Cupón ({couponCode})</span>
                    <span>-${couponDiscount.toFixed(2)}</span>
                  </div>
                )}
                {loyaltyDiscount > 0 && (
                  <div className="flex justify-between text-xs text-amber-600">
                    <span>Puntos ({loyaltyPoints} pts)</span>
                    <span>-${loyaltyDiscount.toFixed(2)}</span>
                  </div>
                )}
                {giftCardDiscount > 0 && (
                  <div className="flex justify-between text-xs text-violet-600">
                    <span>Tarjeta regalo</span>
                    <span>-${giftCardDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm text-gray-900 pt-2.5 border-t border-gray-100">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              {/* Delivery summary */}
              {deliverySummary() && (
                <div className="px-5 py-4 border-t border-gray-100 bg-gray-50">
                  <div className="flex items-start gap-2">
                    {selectedAddrId === "new" && newMode === "store" ? (
                      <Store className="w-3.5 h-3.5 text-violet-400 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                    ) : selectedAddrId === "new" && newMode === "pickup" ? (
                      <Package2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                    ) : (
                      <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                    )}
                    <div>
                      <p className="text-[10px] text-gray-400 mb-0.5 uppercase tracking-wider">
                        {selectedAddrId === "new" && newMode === "store" ? "Recogida en tienda"
                          : selectedAddrId === "new" && newMode === "pickup" ? "Punto de entrega"
                            : "Entrega en"}
                      </p>
                      <p className="text-xs text-gray-600">{deliverySummary()}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
