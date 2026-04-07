import { useReducer, useEffect, useRef } from "react";
import type { CheckoutState, CheckoutAction } from "../types";
import type { UserProfile } from "../../../context/UserContext";

function checkoutReducer(state: CheckoutState, action: CheckoutAction): CheckoutState {
    switch (action.type) {
        case "PATCH":
            return { ...state, ...action.payload };
        case "SET_STEP":
            return { ...state, step: action.step };
        case "SET_CONTACT":
            return { ...state, contact: { ...state.contact, ...action.payload } };
        case "SET_MANUAL_ADDR":
            return { ...state, manualAddr: { ...state.manualAddr, ...action.payload } };
        case "SET_PAYMENT":
            return { ...state, payment: { ...state.payment, ...action.payload } };
        case "SYNC_PROFILE": {
            const { email, phone, firstName, lastName, defaultAddrId, defaultPmId } = action.payload;
            const fullName = `${firstName} ${lastName}`.trim();
            return {
                ...state,
                contact: {
                    email: state.contact.email || email,
                    phone: state.contact.phone || phone,
                },
                selectedAddrId: defaultAddrId && state.selectedAddrId === "new" ? defaultAddrId : state.selectedAddrId,
                selectedPmId: defaultPmId && state.selectedPmId === "new" ? defaultPmId : state.selectedPmId,
                manualAddr: { ...state.manualAddr, name: state.manualAddr.name || fullName },
                paypalEmail: state.paypalEmail || email,
                payment: { ...state.payment, cardName: state.payment.cardName || fullName.toUpperCase() },
            };
        }
        case "RESET_COUPON":
            return { ...state, couponResult: null };
        case "RESET_GIFT_CARD":
            return { ...state, giftCardError: null };
        case "TOGGLE_GIFT_CARD": {
            const exists = state.appliedGiftCards.some(c => c.code === action.code);
            return {
                ...state,
                appliedGiftCards: exists
                    ? state.appliedGiftCards.filter(c => c.code !== action.code)
                    : [...state.appliedGiftCards, { code: action.code, balance: action.balance }],
                giftCardError: null,
            };
        }
        case "REMOVE_GIFT_CARD":
            return {
                ...state,
                appliedGiftCards: state.appliedGiftCards.filter(c => c.code !== action.code),
                giftCardError: null,
            };
        default:
            return state;
    }
}

export function buildInitialState(user: UserProfile): CheckoutState {
    const defaultAddr = user.addresses.find((a) => a.isDefault) ?? user.addresses[0] ?? null;
    const defaultPm = user.paymentMethods.find((p) => p.isDefault) ?? user.paymentMethods[0] ?? null;

    return {
        step: 1,
        isProcessing: false,
        orderComplete: false,
        orderSnapshot: [],
        createdOrder: null,
        backendInvoice: null,
        orderError: null,
        totalsSnapshot: null,
        contact: { email: user.email, phone: user.phone },
        selectedAddrId: defaultAddr?.id ?? "new",
        newMode: "home",
        manualAddr: {
            name: `${user.firstName} ${user.lastName}`,
            street: "", city: "", state: "", zip: "", country: "United States",
        },
        selectedStoreId: null,
        selectedPickupId: null,
        selectedPmId: defaultPm?.id ?? "new",
        payMethod: "card",
        payment: {
            cardNumber: "",
            cardName: `${user.firstName} ${user.lastName}`.toUpperCase(),
            expiry: "", cvv: "",
        },
        paypalEmail: user.email,
        copiedAddr: false,
        savedCardCvv: "",
        pmDropdownOpen: false,
        shippingOptions: [],
        selectedShippingId: null,
        shippingLoading: false,
        taxCalc: null,
        taxLoading: false,
        couponCode: "",
        couponResult: null,
        couponLoading: false,
        loyaltyBalance: 0,
        loyaltyRate: 100,
        loyaltyPoints: 0,
        giftCardCode: "",
        appliedGiftCards: [],
        myGiftCards: [],
        myGiftCardsLoaded: false,
        giftCardLoading: false,
        giftCardError: null,
        btcRate: 68500,
    };
}

export function useCheckoutState(user: UserProfile) {
    const [state, dispatch] = useReducer(checkoutReducer, user, buildInitialState);

    /* ── Sync from user profile when it loads asynchronously ── */
    const profileSynced = useRef(false);
    useEffect(() => {
        if (profileSynced.current || !user.id) return;
        profileSynced.current = true;

        const defaultAddr = user.addresses.find((a) => a.isDefault) ?? user.addresses[0];
        const defaultPm = user.paymentMethods.find((p) => p.isDefault) ?? user.paymentMethods[0];

        dispatch({
            type: "SYNC_PROFILE",
            payload: {
                email: user.email,
                phone: user.phone,
                firstName: user.firstName,
                lastName: user.lastName,
                defaultAddrId: defaultAddr?.id,
                defaultPmId: defaultPm?.id,
            },
        });
    }, [user]);

    return [state, dispatch] as const;
}
