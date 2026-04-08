/** Currency rate type matching backend CurrencyRateDtoOut */
export interface CurrencyRate {
    id: string;
    currencyCode: string;
    currencyName: string;
    currencySymbol: string;
    countryName: string;
    countryCode: string;
    flagEmoji: string;
    timezone: string;
    language: string;
    rate: number;
    active: boolean;
    lastSyncedAt: string;
    createdAt: string;
    updatedAt: string;
}

export interface SyncResult {
    ratesUpdated: number;
    syncedAt: string;
}

export interface ConvertResult {
    originalAmount: number;
    fromCurrency: string;
    toCurrency: string;
    convertedAmount: number;
    exchangeRate: number;
}

/** Map country code → default currency code */
export const COUNTRY_CURRENCY_MAP: Record<string, string> = {
    US: "USD", CA: "CAD", MX: "MXN", GT: "GTQ", HN: "HNL", SV: "SVC",
    NI: "NIO", CR: "CRC", PA: "PAB", CU: "CUP", DO: "DOP", CO: "COP",
    VE: "VES", EC: "USD", PE: "PEN", BO: "BOB", PY: "PYG", UY: "UYU",
    AR: "ARS", CL: "CLP", BR: "BRL", PT: "EUR", ES: "EUR", FR: "EUR",
    DE: "EUR", IT: "EUR", NL: "EUR", GB: "GBP", CH: "CHF", NO: "NOK",
    SE: "SEK", DK: "DKK", PL: "PLN", CZ: "CZK", RO: "RON", JP: "JPY",
    CN: "CNY", KR: "KRW", IN: "INR", AU: "AUD", NZ: "NZD", HT: "HTG",
    RU: "RUB", TR: "TRY", ZA: "ZAR", NG: "NGN", EG: "EGP", KE: "KES",
    AE: "AED", SA: "SAR", IL: "ILS", TH: "THB", SG: "SGD", MY: "MYR",
    ID: "IDR", PH: "PHP", VN: "VND", TW: "TWD", HK: "HKD",
};
