import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { paymentRepository } from "../../repositories/PaymentRepository";
import { orderRepository } from "../../repositories/OrderRepository";
import { loyaltyRepository } from "../../repositories/LoyaltyRepository";
import { adminGiftCardRepository as giftCardRepository } from "../../repositories/AdminGiftCardRepository";
import { profileRepository } from "../../repositories/ProfileRepository";
import { useCart } from "../../context/CartContext";
import { useUser } from "../../context/UserContext";
import { logger } from "../../lib/logger";

interface PendingCtx {
    paymentId: string;
    paypalOrderId: string;
    orderId: string;
    loyaltyPoints: number;
    gcAmounts: { code: string; applied: number }[];
    saveNewPaymentMethod: boolean;
    paypalEmail?: string;
    selectedPmId: string;
}

export function PayPalReturn() {
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const { clearCart } = useCart();
    const { user, reloadUserData: refreshUser } = useUser();
    const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
    const [message, setMessage] = useState("Capturando pago con PayPal…");
    const finalized = useRef(false);

    useEffect(() => {
        if (finalized.current) return;
        finalized.current = true;

        (async () => {
            const tokenFromUrl = params.get("token");
            const raw = sessionStorage.getItem("nx036_paypal_pending");
            if (!raw) {
                setStatus("error");
                setMessage("No se encontró una sesión de pago pendiente. Vuelve al checkout.");
                return;
            }

            let ctx: PendingCtx;
            try { ctx = JSON.parse(raw) as PendingCtx; } catch {
                setStatus("error");
                setMessage("La sesión de pago no es válida.");
                return;
            }

            const paypalOrderId = tokenFromUrl ?? ctx.paypalOrderId;

            try {
                await paymentRepository.capturePayPal(paypalOrderId);

                // Persist the PayPal method if the buyer ticked "save for future"
                if (ctx.saveNewPaymentMethod && ctx.selectedPmId === "new" && ctx.paypalEmail) {
                    try {
                        const email = ctx.paypalEmail.trim().toLowerCase();
                        const dup = user.paymentMethods.some(
                            (pm) => pm.type === "paypal"
                                && (pm.paypalEmail ?? "").trim().toLowerCase() === email,
                        );
                        if (!dup) {
                            await profileRepository.createPaymentMethod({
                                type: "PAYPAL",
                                label: `PayPal · ${ctx.paypalEmail}`,
                                paypalEmail: ctx.paypalEmail,
                                isDefault: user.paymentMethods.length === 0,
                            });
                            await refreshUser();
                        }
                    } catch (saveErr) { logger.warn("[PayPalReturn] saveMethod failed", saveErr); }
                }

                // Confirm the order (DRAFT → PENDING), redeem loyalty + gift cards
                await orderRepository.confirmOrder(ctx.orderId);

                if (ctx.loyaltyPoints > 0) {
                    try {
                        await loyaltyRepository.redeemPoints(ctx.loyaltyPoints,
                            `Canjeo en pedido ${ctx.orderId}`, ctx.orderId);
                    } catch (err) { logger.warn("[PayPalReturn] loyalty redeem failed", err); }
                }
                for (const gc of ctx.gcAmounts ?? []) {
                    if (gc.applied > 0) {
                        try {
                            await giftCardRepository.redeem({
                                code: gc.code, amount: gc.applied, orderId: ctx.orderId,
                            });
                        } catch (err) { logger.warn("[PayPalReturn] gift card redeem failed", err); }
                    }
                }

                clearCart();
                sessionStorage.removeItem("nx036_paypal_pending");
                setStatus("success");
                setMessage("Pago confirmado. Redirigiendo a tu pedido…");
                toast.success("¡Pago con PayPal confirmado!");
                setTimeout(() => navigate(`/account`, { replace: true }), 1500);
            } catch (err) {
                const msg = err instanceof Error ? err.message : "No se pudo capturar el pago";
                logger.error("[PayPalReturn] capture/confirm failed", err);
                setStatus("error");
                setMessage(msg);
                toast.error(msg);
                // Don't cancel the order automatically — the buyer may retry
                // or the backend webhook may still complete it later.
                sessionStorage.removeItem("nx036_paypal_pending");
            }
        })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="min-h-[60vh] flex items-center justify-center p-6">
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-8 max-w-md w-full text-center space-y-4">
                {status === "processing" && (
                    <>
                        <Loader2 className="w-10 h-10 text-gray-400 mx-auto animate-spin" strokeWidth={1.5} />
                        <h1 className="text-lg text-gray-900">Finalizando tu pago</h1>
                    </>
                )}
                {status === "success" && (
                    <>
                        <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" strokeWidth={1.5} />
                        <h1 className="text-lg text-gray-900">¡Pago confirmado!</h1>
                    </>
                )}
                {status === "error" && (
                    <>
                        <XCircle className="w-10 h-10 text-red-500 mx-auto" strokeWidth={1.5} />
                        <h1 className="text-lg text-gray-900">No se pudo completar el pago</h1>
                    </>
                )}
                <p className="text-sm text-gray-500">{message}</p>
                {status === "error" && (
                    <button
                        onClick={() => navigate("/checkout")}
                        className="mt-4 inline-flex items-center justify-center gap-2 text-sm bg-gray-200 text-gray-700 rounded-xl px-5 py-2.5 hover:bg-gray-300 transition-colors"
                    >
                        Volver al checkout
                    </button>
                )}
            </div>
        </div>
    );
}
