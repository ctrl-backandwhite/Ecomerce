/* ── Shared payment brand SVG logos ──────────────────────── */

export function VisaLogo({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 22" className={className} aria-label="Visa">
      <text x="0" y="17" fontFamily="Arial" fontWeight="800" fontSize="21" fontStyle="italic" fill="#1A1F71" letterSpacing="-1">VISA</text>
    </svg>
  );
}

export function MastercardLogo({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 38 24" className={className} aria-label="Mastercard">
      <circle cx="13" cy="12" r="11" fill="#EB001B" />
      <circle cx="25" cy="12" r="11" fill="#F79E1B" />
      <path d="M19 3.2a11 11 0 0 1 0 17.6A11 11 0 0 1 19 3.2z" fill="#FF5F00" />
    </svg>
  );
}

export function PayPalLogo({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 76 22" className={className} aria-label="PayPal">
      <text x="0" y="16" fontFamily="Arial" fontWeight="800" fontSize="16" fill="#253B80">Pay</text>
      <text x="27" y="16" fontFamily="Arial" fontWeight="800" fontSize="16" fill="#179BD7">Pal</text>
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
