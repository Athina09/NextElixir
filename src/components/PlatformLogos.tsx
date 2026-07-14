/**
 * PlatformLogos.tsx
 *
 * Inline SVG brand logos for every supported ad platform and integration.
 * All logos accept a `className` prop for Tailwind sizing and a `size` prop (px).
 * Use 16px for table cells, 18–20px for console rows, 24px for cards.
 *
 * Rules:
 *  - No external image requests — everything is inline SVG.
 *  - Do NOT stretch; keep viewBox aspect ratio.
 *  - Logos are full-color on dark backgrounds by default.
 */

interface LogoProps {
  className?: string;
  size?: number;
}

/* ─────────────────────────────────────────────
   Google Ads — official 4-color Google G mark
   ───────────────────────────────────────────── */
export function GoogleAdsLogo({ className, size = 16 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Google Ads"
    >
      {/* Yellow bottom arc */}
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
      {/* Red top-left arc */}
      <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
      {/* Green bottom arc */}
      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
      {/* Blue right arm + crossbar */}
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
    </svg>
  );
}

/* ─────────────────────────────────────────────
   Meta — infinity symbol in gradient blue
   ───────────────────────────────────────────── */
export function MetaLogo({ className, size = 16 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Meta"
    >
      <defs>
        <linearGradient id="meta-grad" x1="0" y1="0" x2="24" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0082FB" />
          <stop offset="100%" stopColor="#00C8FF" />
        </linearGradient>
      </defs>
      {/* Infinity / figure-8 path */}
      <path
        d="M12 12c0-2.5-1.6-4.5-3.5-4.5C6.4 7.5 5 9.3 5 11.5c0 1.4.7 2.8 1.8 3.6.8.6 1.7.9 2.7.9 1.2 0 2.3-.5 3.3-1.5.9 1 2 1.5 3.3 1.5 1 0 1.9-.3 2.7-.9C19.8 14.3 20.5 12.9 20.5 11.5c0-2.2-1.4-4-3.5-4C15.1 7.5 13.5 9.5 13 12z"
        fill="none"
        stroke="url(#meta-grad)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ─────────────────────────────────────────────
   Microsoft Ads — 4-square Windows logo
   ───────────────────────────────────────────── */
export function MicrosoftAdsLogo({ className, size = 16 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Microsoft Ads"
    >
      <rect x="3" y="3" width="8.5" height="8.5" rx="0.5" fill="#F25022" />
      <rect x="12.5" y="3" width="8.5" height="8.5" rx="0.5" fill="#7FBA00" />
      <rect x="3" y="12.5" width="8.5" height="8.5" rx="0.5" fill="#00A4EF" />
      <rect x="12.5" y="12.5" width="8.5" height="8.5" rx="0.5" fill="#FFB900" />
    </svg>
  );
}

/* ─────────────────────────────────────────────
   Amazon Ads — smile arrow on orange
   ───────────────────────────────────────────── */
export function AmazonAdsLogo({ className, size = 16 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Amazon Ads"
    >
      <rect width="24" height="24" rx="4" fill="#232F3E" />
      {/* Amazon arrow / smile */}
      <path
        d="M7 14.5c2.5 1.8 5.5 2.8 9 2.2"
        stroke="#FF9900"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M14.5 13.5l2 2.8-2.5.5"
        stroke="#FF9900"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <text
        x="12"
        y="12.5"
        textAnchor="middle"
        fontSize="7"
        fontWeight="bold"
        fill="white"
        fontFamily="Arial"
      >
        a
      </text>
    </svg>
  );
}

/* ─────────────────────────────────────────────
   TikTok — musical note mark
   ───────────────────────────────────────────── */
export function TikTokLogo({ className, size = 16 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="TikTok"
    >
      <rect width="24" height="24" rx="5" fill="#010101" />
      {/* Cyan shadow */}
      <path
        d="M15.5 5.5c.3 1.8 1.4 3 3 3.2v2.2c-1.1-.1-2-.4-2.8-1v4.5a4.8 4.8 0 1 1-4.8-4.8c.2 0 .3 0 .5.01v2.2a2.6 2.6 0 1 0 2.6 2.6V5.5h1.5z"
        fill="#69C9D0"
        opacity="0.6"
      />
      {/* Main shape */}
      <path
        d="M14.5 5c.3 1.8 1.4 3 3 3.2v2.2c-1.1-.1-2-.4-2.8-1v4.5a4.8 4.8 0 1 1-4.8-4.8c.2 0 .3 0 .5.01v2.2a2.6 2.6 0 1 0 2.6 2.6V5h1.5z"
        fill="white"
      />
    </svg>
  );
}

/* ─────────────────────────────────────────────
   LinkedIn Ads — "in" white on blue
   ───────────────────────────────────────────── */
export function LinkedInLogo({ className, size = 16 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="LinkedIn"
    >
      <rect width="24" height="24" rx="4" fill="#0A66C2" />
      <text
        x="12"
        y="16.5"
        textAnchor="middle"
        fontSize="10"
        fontWeight="bold"
        fill="white"
        fontFamily="Arial, sans-serif"
      >
        in
      </text>
    </svg>
  );
}

/* ─────────────────────────────────────────────
   Instagram — gradient camera
   ───────────────────────────────────────────── */
export function InstagramLogo({ className, size = 16 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Instagram"
    >
      <defs>
        <radialGradient id="ig-grad" cx="30%" cy="107%" r="150%">
          <stop offset="0%" stopColor="#fdf497" />
          <stop offset="5%" stopColor="#fdf497" />
          <stop offset="45%" stopColor="#fd5949" />
          <stop offset="60%" stopColor="#d6249f" />
          <stop offset="90%" stopColor="#285AEB" />
        </radialGradient>
      </defs>
      <rect width="24" height="24" rx="6" fill="url(#ig-grad)" />
      {/* Camera body */}
      <rect x="5" y="5" width="14" height="14" rx="3.5" stroke="white" strokeWidth="1.5" />
      {/* Lens */}
      <circle cx="12" cy="12" r="3.5" stroke="white" strokeWidth="1.5" />
      {/* Dot */}
      <circle cx="17" cy="7" r="1" fill="white" />
    </svg>
  );
}

/* ─────────────────────────────────────────────
   Facebook — white "f" on blue
   ───────────────────────────────────────────── */
export function FacebookLogo({ className, size = 16 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Facebook"
    >
      <rect width="24" height="24" rx="5" fill="#1877F2" />
      <path
        d="M13.5 8h2V5.5h-2C12.1 5.5 11 6.6 11 8v1.5H9V12h2v7h2.5V12H16l.5-2.5H13.5V8z"
        fill="white"
      />
    </svg>
  );
}

/* ─────────────────────────────────────────────
   Shopify — green shopping bag
   ───────────────────────────────────────────── */
export function ShopifyLogo({ className, size = 16 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Shopify"
    >
      <rect width="24" height="24" rx="5" fill="#96BF48" />
      {/* S shape simplified */}
      <path
        d="M15.5 6.5c-.1-.8-.8-1.3-1.5-1.4L13.7 7c.4.1.7.4.8.8l1 7.2H9l1-7.2c.1-.4.4-.7.8-.8L10.5 5c-.7.1-1.4.6-1.5 1.4L7.5 15.5l.5 2h8l.5-2-1-9z"
        fill="white"
      />
      {/* Handle */}
      <path
        d="M12 4.5c-.8 0-1.5.5-1.8 1.2l.8.4c.2-.5.6-.8 1-.8s.8.3 1 .8l.8-.4C13.5 5 12.8 4.5 12 4.5z"
        fill="white"
      />
    </svg>
  );
}

/* ─────────────────────────────────────────────
   WooCommerce — purple WC
   ───────────────────────────────────────────── */
export function WooCommerceLogo({ className, size = 16 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="WooCommerce"
    >
      <rect width="24" height="24" rx="5" fill="#7F54B3" />
      <text
        x="12"
        y="16"
        textAnchor="middle"
        fontSize="8"
        fontWeight="bold"
        fill="white"
        fontFamily="Arial, sans-serif"
      >
        WC
      </text>
    </svg>
  );
}

/* ─────────────────────────────────────────────
   Google Analytics — orange bar chart
   ───────────────────────────────────────────── */
export function GoogleAnalyticsLogo({ className, size = 16 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Google Analytics"
    >
      {/* Bars */}
      <rect x="4" y="14" width="4" height="6" rx="1" fill="#F9AB00" />
      <rect x="10" y="9" width="4" height="11" rx="1" fill="#E37400" />
      <rect x="16" y="4" width="4" height="16" rx="1" fill="#E37400" />
    </svg>
  );
}

/* ─────────────────────────────────────────────
   YouTube — red rectangle with play
   ───────────────────────────────────────────── */
export function YouTubeLogo({ className, size = 16 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="YouTube"
    >
      <rect width="24" height="24" rx="5" fill="#FF0000" />
      {/* Play triangle */}
      <polygon points="9,7.5 18,12 9,16.5" fill="white" />
    </svg>
  );
}

/* ─────────────────────────────────────────────
   Google Merchant Center — shopping bag G
   ───────────────────────────────────────────── */
export function GoogleMerchantLogo({ className, size = 16 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Google Merchant Center"
    >
      {/* Blue bag */}
      <path
        d="M6 9h12l-1.5 11H7.5L6 9z"
        fill="#4285F4"
      />
      {/* Handle */}
      <path
        d="M9 9V7a3 3 0 1 1 6 0v2"
        stroke="#34A853"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

/* ─────────────────────────────────────────────
   NetElixir — "NE" wordmark badge
   ───────────────────────────────────────────── */
export function NetElixirLogo({ className, size = 16 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="NetElixir"
    >
      <defs>
        <linearGradient id="ne-grad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
      </defs>
      <rect width="24" height="24" rx="6" fill="url(#ne-grad)" />
      <text
        x="12"
        y="16.5"
        textAnchor="middle"
        fontSize="9"
        fontWeight="800"
        fill="white"
        fontFamily="Arial, sans-serif"
        letterSpacing="-0.5"
      >
        NE
      </text>
    </svg>
  );
}

/* ─────────────────────────────────────────────
   ForecastIQ — Sparkles-based AI mark
   ───────────────────────────────────────────── */
export function ForecastIQLogo({ className, size = 16 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="ForecastIQ"
    >
      <defs>
        <linearGradient id="fiq-grad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#22D3EE" />
        </linearGradient>
      </defs>
      <rect width="24" height="24" rx="6" fill="url(#fiq-grad)" />
      {/* Star / sparkle */}
      <path
        d="M12 5l1.2 4.3L17.5 10l-4.3 1.2L12 15.5l-1.2-4.3L6.5 10l4.3-1.2L12 5z"
        fill="white"
        opacity="0.95"
      />
    </svg>
  );
}

/* ─────────────────────────────────────────────
   Utility: get logo component by channel name
   ───────────────────────────────────────────── */
export function ChannelLogo({
  channel,
  size = 16,
  className,
}: {
  channel: string;
  size?: number;
  className?: string;
}) {
  const props = { size, className };
  const lower = channel.toLowerCase();
  if (lower.includes("google ads") || lower === "google ads") return <GoogleAdsLogo {...props} />;
  if (lower.includes("meta")) return <MetaLogo {...props} />;
  if (lower.includes("microsoft")) return <MicrosoftAdsLogo {...props} />;
  if (lower.includes("amazon")) return <AmazonAdsLogo {...props} />;
  if (lower.includes("tiktok")) return <TikTokLogo {...props} />;
  if (lower.includes("linkedin")) return <LinkedInLogo {...props} />;
  if (lower.includes("instagram")) return <InstagramLogo {...props} />;
  if (lower.includes("facebook")) return <FacebookLogo {...props} />;
  if (lower.includes("shopify")) return <ShopifyLogo {...props} />;
  if (lower.includes("youtube")) return <YouTubeLogo {...props} />;
  if (lower.includes("analytics") || lower.includes("ga4")) return <GoogleAnalyticsLogo {...props} />;
  if (lower.includes("woo")) return <WooCommerceLogo {...props} />;
  if (lower.includes("merchant")) return <GoogleMerchantLogo {...props} />;
  // Generic dot fallback
  return (
    <span
      style={{ width: size, height: size }}
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-primary/20 ${className ?? ""}`}
    />
  );
}
