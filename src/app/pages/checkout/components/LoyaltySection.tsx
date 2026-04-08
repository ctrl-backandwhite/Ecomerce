import { Star } from "lucide-react";
import { useCurrency } from "../../../context/CurrencyContext";
import type { CheckoutAction } from "../types";

interface LoyaltySectionProps {
    loyaltyBalance: number;
    loyaltyPoints: number;
    loyaltyRate: number;
    loyaltyDiscount: number;
    maxRedeemable: number;
    dispatch: React.Dispatch<CheckoutAction>;
}

export function LoyaltySection({
    loyaltyBalance, loyaltyPoints, loyaltyRate, loyaltyDiscount,
    maxRedeemable, dispatch,
}: LoyaltySectionProps) {
    if (loyaltyBalance <= 0) return null;
    const { formatPrice } = useCurrency();

    return (
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
                    max={maxRedeemable}
                    value={loyaltyPoints || ""}
                    onChange={(e) => {
                        const v = Math.max(0, Math.min(maxRedeemable, parseInt(e.target.value) || 0));
                        dispatch({ type: "PATCH", payload: { loyaltyPoints: v } });
                    }}
                    placeholder="0"
                    className="w-full text-xs text-gray-900 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-gray-400 placeholder-gray-300 tabular-nums"
                />
                <button
                    onClick={() => dispatch({ type: "PATCH", payload: { loyaltyPoints: maxRedeemable } })}
                    className="text-xs text-gray-700 border border-gray-200 rounded-lg px-3 py-2 hover:border-gray-400 hover:bg-gray-50 transition-colors flex-shrink-0"
                >
                    Máx
                </button>
            </div>
            {loyaltyPoints > 0 && (
                <p className="text-xs text-amber-600 mt-1.5">
                    Descuento: -{formatPrice(loyaltyDiscount)} ({loyaltyPoints} pts × {loyaltyRate} pts/$1)
                </p>
            )}
        </div>
    );
}
