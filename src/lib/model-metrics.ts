/**
 * Held-out backtest metrics from the committed LightGBM artifact
 * (`backend/pickle/model.pkl`, trained 2026-07-16).
 * Keep in sync with `/health` once the API is running.
 */
export const MODEL_METRICS = {
  version: "1.0.0",
  trainedAt: "2026-07-16T01:44:02.662996+00:00",
  trainRows: 1432,
  testRows: 359,
  revenue: {
    mae: 1404.03,
    rmse: 7755.88,
    mape: 28.44,
    r2: 0.93,
  },
  roas: {
    mae: 1.3,
    rmse: 7.57,
    mape: 32.87,
    r2: 0.231,
  },
} as const;

export function formatMape(mape: number, digits = 1): string {
  return `${mape.toFixed(digits)}%`;
}
