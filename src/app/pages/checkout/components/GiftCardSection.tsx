import { useState, useRef, useEffect } from "react";
import { Gift, X, Check, CreditCard, ChevronDown } from "lucide-react";
import { useCurrency } from "../../../context/CurrencyContext";
import type { CheckoutAction, AppliedGiftCard, MyGiftCard } from "../types";
import { useLanguage } from "../../../context/LanguageContext";

interface GiftCardSectionProps {
    giftCardCode: string;
    giftCardLoading: boolean;
    giftCardError: string | null;
    appliedGiftCards: AppliedGiftCard[];
    myGiftCards: MyGiftCard[];
    myGiftCardsLoaded: boolean;
    giftCardDiscount: number;
    /** Per-card applied amounts (same order as appliedGiftCards) */
    appliedAmounts: { code: string; applied: number }[];
    remainingTotal: number;
    dispatch: React.Dispatch<CheckoutAction>;
    applyManualCard: () => void;
}

const INLINE_LIMIT = 3;

export function GiftCardSection({
    giftCardCode, giftCardLoading, giftCardError,
    appliedGiftCards, myGiftCards, myGiftCardsLoaded, giftCardDiscount,
    appliedAmounts, remainingTotal,
    dispatch, applyManualCard,
}: GiftCardSectionProps) {
    const { t } = useLanguage();
    const isApplied = (code: string) => appliedGiftCards.some(c => c.code === code);
    const { formatPrice, formatFromUsd } = useCurrency();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropRef = useRef<HTMLDivElement>(null);

    /* Close on outside click */
    useEffect(() => {
        if (!dropdownOpen) return;
        function handleClick(e: MouseEvent) {
            if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropdownOpen(false);
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [dropdownOpen]);

    const useDropdown = myGiftCards.length > INLINE_LIMIT;
    const selectedFromMy = myGiftCards.filter(c => isApplied(c.code));

    /* Shared card row renderer */
    function CardRow({ card }: { card: MyGiftCard }) {
        const selected = isApplied(card.code);
        const amt = appliedAmounts.find(a => a.code === card.code);
        return (
            <button
                key={card.code}
                type="button"
                onClick={() => {
                    dispatch({ type: "TOGGLE_GIFT_CARD", code: card.code, balance: card.balance });
                }}
                className={`flex items-center gap-2.5 w-full text-left px-3 py-2 rounded-lg border transition-all text-xs ${selected
                    ? "border-violet-300 bg-violet-50/60"
                    : "border-gray-100 hover:border-gray-300 bg-white"
                    }`}
            >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${selected ? "bg-violet-500 text-white" : "bg-gray-100 text-gray-400"
                    }`}>
                    {selected
                        ? <Check className="w-3 h-3" strokeWidth={2.5} />
                        : <CreditCard className="w-3 h-3" strokeWidth={1.5} />}
                </div>
                <div className="flex-1 min-w-0">
                    <span className="font-mono text-gray-600 text-[11px]">
                        ····{card.code.slice(-4)}
                    </span>
                </div>
                <div className="text-right flex-shrink-0">
                    <span className={`text-[11px] ${selected ? "text-violet-600 font-medium" : "text-gray-500"}`}>
                        {formatFromUsd(card.balance)}
                    </span>
                    {selected && amt && amt.applied > 0 && amt.applied < card.balance && (
                        <span className="block text-[10px] text-violet-400">
                            −{formatPrice(amt.applied)}
                        </span>
                    )}
                </div>
            </button>
        );
    }

    return (
        <div className="px-5 py-3 border-t border-gray-50">
            <div className="flex items-center gap-2 mb-2">
                <Gift className="w-3.5 h-3.5 text-violet-400" strokeWidth={1.5} />
                <span className="text-xs text-gray-600">{t("checkout.giftCards") || "Tarjetas regalo"}</span>
                {giftCardDiscount > 0 && (
                    <span className="text-[10px] text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded-full ml-auto">
                        −{formatPrice(giftCardDiscount)}
                    </span>
                )}
            </div>

            {/* ── User's active gift cards ── */}
            {myGiftCardsLoaded && myGiftCards.length > 0 && (
                <div className="mb-2.5 space-y-1.5">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">{t("checkout.giftCards.mine") || "Mis tarjetas"}</p>

                    {/* ── Inline mode (≤ 3 cards) ── */}
                    {!useDropdown && (
                        <div className="grid gap-1.5">
                            {myGiftCards.map(card => <CardRow key={card.code} card={card} />)}
                        </div>
                    )}

                    {/* ── Dropdown mode (> 3 cards) ── */}
                    {useDropdown && (
                        <div ref={dropRef} className="relative">
                            {/* Trigger */}
                            <button
                                type="button"
                                onClick={() => setDropdownOpen(o => !o)}
                                className="flex items-center justify-between w-full px-3 py-2 text-xs border border-gray-200 rounded-lg hover:border-gray-400 transition-colors bg-white"
                            >
                                <span className="text-gray-600">
                                    {selectedFromMy.length === 0
                                        ? "Seleccionar tarjetas…"
                                        : `${selectedFromMy.length} tarjeta${selectedFromMy.length > 1 ? "s" : ""} seleccionada${selectedFromMy.length > 1 ? "s" : ""}`}
                                </span>
                                <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} strokeWidth={1.5} />
                            </button>

                            {/* Dropdown panel */}
                            {dropdownOpen && (
                                <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto p-1.5 space-y-1">
                                    {myGiftCards.map(card => <CardRow key={card.code} card={card} />)}
                                </div>
                            )}

                            {/* Selected pills below dropdown */}
                            {selectedFromMy.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                    {selectedFromMy.map(card => {
                                        const amt = appliedAmounts.find(a => a.code === card.code);
                                        return (
                                            <span
                                                key={card.code}
                                                className="inline-flex items-center gap-1 text-[10px] text-violet-700 bg-violet-50 border border-violet-200 rounded-full px-2 py-0.5"
                                            >
                                                ····{card.code.slice(-4)} · {amt && amt.applied > 0 ? formatPrice(amt.applied) : formatFromUsd(card.balance)}
                                                <button
                                                    type="button"
                                                    onClick={() => dispatch({ type: "REMOVE_GIFT_CARD", code: card.code })}
                                                    className="hover:text-red-500 transition-colors"
                                                >
                                                    <X className="w-2.5 h-2.5" strokeWidth={2.5} />
                                                </button>
                                            </span>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* ── Manual code input ── */}
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
                    onClick={applyManualCard}
                    disabled={giftCardLoading || !giftCardCode.trim()}
                    className="text-xs text-gray-700 border border-gray-200 rounded-lg px-3 py-2 hover:border-gray-400 hover:bg-gray-50 transition-colors flex-shrink-0 disabled:opacity-40"
                >
                    {giftCardLoading ? "…" : "Aplicar"}
                </button>
            </div>

            {giftCardError && (
                <p className="text-xs text-red-500 mt-1.5">{giftCardError}</p>
            )}

            {/* ── Applied cards from manual entry (not in myGiftCards) ── */}
            {appliedGiftCards.filter(c => !myGiftCards.some(m => m.code === c.code)).length > 0 && (
                <div className="mt-2 space-y-1">
                    {appliedGiftCards
                        .filter(c => !myGiftCards.some(m => m.code === c.code))
                        .map(card => {
                            const amt = appliedAmounts.find(a => a.code === card.code);
                            return (
                                <div key={card.code} className="flex items-center gap-2 px-3 py-1.5 bg-violet-50/60 border border-violet-200 rounded-lg text-xs">
                                    <Gift className="w-3 h-3 text-violet-400 flex-shrink-0" strokeWidth={1.5} />
                                    <span className="font-mono text-violet-700 text-[11px]">····{card.code.slice(-4)}</span>
                                    <span className="text-violet-500 text-[11px]">{formatFromUsd(card.balance)}</span>
                                    {amt && amt.applied > 0 && amt.applied < card.balance && (
                                        <span className="text-[10px] text-violet-400">−{formatPrice(amt.applied)}</span>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => dispatch({ type: "REMOVE_GIFT_CARD", code: card.code })}
                                        className="ml-auto text-gray-400 hover:text-red-400 transition-colors"
                                    >
                                        <X className="w-3 h-3" strokeWidth={2} />
                                    </button>
                                </div>
                            );
                        })}
                </div>
            )}
        </div>
    );
}
