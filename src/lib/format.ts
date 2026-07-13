export function formatINR(value: number, opts: { compact?: boolean; decimals?: number } = {}) {
  const { compact = true, decimals = 1 } = opts;
  if (!isFinite(value)) return "—";
  const abs = Math.abs(value);
  if (compact) {
    if (abs >= 1_00_00_000) return `₹${(value / 1_00_00_000).toFixed(decimals)}Cr`;
    if (abs >= 1_00_000) return `₹${(value / 1_00_000).toFixed(decimals)}L`;
    if (abs >= 1_000) return `₹${(value / 1_000).toFixed(decimals)}K`;
    return `₹${value.toFixed(0)}`;
  }
  return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: decimals })}`;
}

export function formatPct(value: number, decimals = 1) {
  return `${(value * 100).toFixed(decimals)}%`;
}

export function formatMultiple(value: number, decimals = 2) {
  return `${value.toFixed(decimals)}x`;
}

export function formatNumber(value: number) {
  return value.toLocaleString("en-IN");
}
