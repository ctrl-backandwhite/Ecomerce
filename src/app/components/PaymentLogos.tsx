/* ── Shared payment brand SVG logos ──────────────────────── */

export function VisaLogo({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-label="Visa">
      <circle cx="12" cy="12" r="12" fill="#1A1F71" />
      <text x="12" y="16" textAnchor="middle" fontFamily="Arial" fontWeight="800" fontSize="11" fontStyle="italic" fill="white" letterSpacing="-0.5">VISA</text>
    </svg>
  );
}

export function MastercardLogo({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-label="Mastercard">
      <circle cx="9" cy="12" r="7" fill="#EB001B" />
      <circle cx="15" cy="12" r="7" fill="#F79E1B" />
      <path d="M12 6.1a7 7 0 0 1 0 11.8A7 7 0 0 1 12 6.1z" fill="#FF5F00" />
    </svg>
  );
}

export function PayPalLogo({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-label="PayPal">
      <circle cx="12" cy="12" r="12" fill="#253B80" />
      <text x="12" y="16" textAnchor="middle" fontFamily="Arial" fontWeight="800" fontSize="11" fill="white">PP</text>
    </svg>
  );
}

export function USDTLogo({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-label="USDT">
      <circle cx="12" cy="12" r="12" fill="#26A17B" />
      <text x="12" y="16.5" textAnchor="middle" fontFamily="Arial" fontWeight="800" fontSize="13" fill="white">₮</text>
    </svg>
  );
}

export function BTCLogo({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-label="Bitcoin">
      <circle cx="12" cy="12" r="12" fill="#F7931A" />
      <text x="12" y="16.5" textAnchor="middle" fontFamily="Arial" fontWeight="900" fontSize="14" fill="white">₿</text>
    </svg>
  );
}
