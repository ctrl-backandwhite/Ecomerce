import { Tag } from "lucide-react";
import { useCurrency } from "../../../context/CurrencyContext";
import type { CheckoutAction, CheckoutState } from "../types";
import { useLanguage } from "../../../context/LanguageContext";

interface CouponInputProps {
    couponCode: string;
    couponLoading: boolean;
    couponResult: CheckoutState["couponResult"];
    couponDiscount: number;
    dispatch: React.Dispatch<CheckoutAction>;
    applyCoupon: () => void;
}

export function CouponInput({
    couponCode, couponLoading, couponResult, couponDiscount, dispatch, applyCoupon,
}: CouponInputProps) {
    const { t } = useLanguage();
    const { formatPrice } = useCurrency();
    return (
        <div className="px-5 py-3 border-t border-gray-50">
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" strokeWidth={1.5} />
                    <input
                        value={couponCode}
                        onChange={(e) => { dispatch({ type: "PATCH", payload: { couponCode: e.target.value } }); dispatch({ type: "RESET_COUPON" }); }}
                        placeholder={t("checkout.coupon.placeholder") || "Código de descuento"}
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
                    Descuento aplicado: -{formatPrice(couponDiscount)}
                </p>
            )}
        </div>
    );
}
