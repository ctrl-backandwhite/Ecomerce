import { CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router";
import { InvoiceDocument } from "../../../components/InvoiceDocument";
import { ContinueShoppingLink } from "../../../components/ContinueShoppingLink";
import { useUser } from "../../../context/UserContext";
import type { CheckoutState } from "../types";
import { storeLocations, pickupPoints } from "../types";
import type { PaymentMethod } from "../../../context/UserContext";
import { extractAmount } from "../../../utils/extractAmount";
import { useLanguage } from "../../../context/LanguageContext";

interface OrderConfirmationProps {
    state: CheckoutState;
}

export function OrderConfirmation({ state }: OrderConfirmationProps) {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const { user } = useUser();
    const {
        createdOrder, backendInvoice, orderSnapshot, totalsSnapshot,
        contact, selectedAddrId, newMode, manualAddr, selectedStoreId,
        selectedPickupId, selectedPmId, payMethod, payment, paypalEmail,
    } = state;

    /* Derived helpers (same logic as original) */
    const selectedAddr = selectedAddrId !== "new"
        ? user.addresses.find((a) => a.id === selectedAddrId) : null;
    const selectedStore = storeLocations.find((s) => s.id === selectedStoreId);
    const selectedPickup = pickupPoints.find((p) => p.id === selectedPickupId);
    const selectedPm: PaymentMethod | undefined = selectedPmId !== "new"
        ? user.paymentMethods.find((p) => p.id === selectedPmId) : undefined;

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

    const orderId = createdOrder?.orderNumber ?? createdOrder?.id ?? "N/A";
    const today = new Date().toISOString().slice(0, 10);
    const due = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

    const subtotal = totalsSnapshot?.subtotal ?? 0;
    const shipping = totalsSnapshot?.shipping ?? 0;
    const tax = totalsSnapshot?.tax ?? 0;
    const total = totalsSnapshot?.total ?? 0;

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
                unitPrice: extractAmount(l.unitPrice),
                total: extractAmount(l.total),
            })),
            subtotal: backendInvoice.subtotal,
            shipping: backendInvoice.shipping,
            tax: backendInvoice.tax,
            total: backendInvoice.total,
            discountAmount: backendInvoice.discountAmount ?? 0,
            giftCardAmount: backendInvoice.giftCardAmount ?? 0,
            loyaltyDiscount: backendInvoice.loyaltyDiscount ?? 0,
            paymentMethod: backendInvoice.paymentMethod,
            currencyCode: backendInvoice.currencyCode ?? createdOrder?.currencyCode,
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
            subtotal,
            shipping,
            tax,
            total,
            paymentMethod: paymentSummaryLabel() || undefined,
            currencyCode: createdOrder?.currencyCode,
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
                            <p className="text-xs text-gray-400 mt-0.5">{t("checkout.confirmation.emailHint") || "Recibirás un correo de confirmación en breve"} · <span className="font-mono">{createdOrder?.orderNumber ?? orderId}</span></p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => navigate("/account?tab=orders")}
                            className="h-8 px-4 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Mis pedidos
                        </button>
                        <ContinueShoppingLink variant="secondary" className="h-8 px-4 text-xs rounded-lg" />
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
