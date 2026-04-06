import { Gift } from "lucide-react";
import type { CheckoutAction } from "../types";

interface GiftCardSectionProps {
    giftCardCode: string;
    giftCardLoading: boolean;
    giftCardError: string | null;
    giftCardBalance: number | null;
    giftCardDiscount: number;
    dispatch: React.Dispatch<CheckoutAction>;
    applyGiftCard: () => void;
}

export function GiftCardSection({
    giftCardCode, giftCardLoading, giftCardError, giftCardBalance,
    giftCardDiscount, dispatch, applyGiftCard,
}: GiftCardSectionProps) {
    return (
        <div className="px-5 py-3 border-t border-gray-50">
            <div className="flex items-center gap-2 mb-2">
                <Gift className="w-3.5 h-3.5 text-violet-400" strokeWidth={1.5} />
                <span className="text-xs text-gray-600">Tarjeta regalo</span>
            </div>
            <div className="flex gap-2">
                <input
                    value={giftCardCode}
                    onChange={(e) => {
                        dispatch({ type: "PATCH", payload: { giftCardCode: e.target.value.toUpperCase() } });
                        dispatch({ type: "RESET_GIFT_CARD" });
                    }}
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
    );
}
