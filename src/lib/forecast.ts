import { apiClient, withRetry } from "@/lib/api/client";

export type Horizon = 30 | 60 | 90;
export type Level = "aggregate" | "channel" | "campaignType" | "campaign";
export type Channel = "Google Ads" | "Meta Ads" | "Microsoft Ads";

export interface BudgetAllocation {
  google: number;
  meta: number;
  microsoft: number;
}

export interface ForecastPoint {
  day: number;
  date: string;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  roas: number;
}

export interface ChannelForecast {
  name: Channel;
  spend: number;
  revenue: number;
  roas: number;
  contribution: number; // 0-1
  confidence: number; // 0-1
  trend: number[]; // sparkline
}

export interface CampaignTypeRow {
  type: string;
  spend: number;
  revenue: number;
  roas: number;
  ctr: number;
  conv: number;
}

export interface CampaignRow {
  id: string;
  name: string;
  channel: Channel;
  type: string;
  spend: number;
  revenue: number;
  roas: number;
  ctr: number;
  conv: number;
  confidence: number;
}

export interface ForecastResult {
  horizon: Horizon;
  totalBudget: number;
  revenue: { p10: number; p50: number; p90: number };
  roas: { p10: number; p50: number; p90: number };
  growth: number;
  confidence: number;
  timeline: ForecastPoint[];
  distribution: { bucket: number; density: number }[];
  channels: ChannelForecast[];
  campaignTypes: CampaignTypeRow[];
  campaigns: CampaignRow[];
  generatedAt: string;
}

export interface Insights {
  summary: string;
  drivers: string[];
  positives: string[];
  negatives: string[];
  seasonality: string;
  allocation: string;
  risks: string[];
  recommendations: string[];
  flags: string[];
}

/** Backend contract: POST /forecast { horizon, budget } -> ForecastResult
 * (see backend/src/forecastiq/api/routers/forecast.py and
 * backend/src/forecastiq/schemas/forecast.py — field names match this
 * interface exactly, so no mapping layer is needed here). */
export async function predictForecast(
  budget: BudgetAllocation,
  horizon: Horizon,
): Promise<ForecastResult> {
  return withRetry(async () => {
    const response = await apiClient.post<ForecastResult>("/forecast", { horizon, budget });
    return response.data;
  });
}

/** Backend contract: POST /insights { horizon, budget } -> Insights
 * (see backend/src/forecastiq/api/routers/insights.py). The AI never predicts
 * — it explains a forecast the backend recomputes server-side from the same
 * budget/horizon carried on `result` (never a client-supplied forecast blob).
 * Throws if GROQ_API_KEY isn't configured server-side (503); callers should
 * treat that as "insights unavailable", not retry it away. */
export async function generateInsights(result: ForecastResult): Promise<Insights> {
  const spendFor = (name: Channel) => result.channels.find((c) => c.name === name)?.spend ?? 0;
  const budget: BudgetAllocation = {
    google: spendFor("Google Ads"),
    meta: spendFor("Meta Ads"),
    microsoft: spendFor("Microsoft Ads"),
  };
  const response = await apiClient.post<Insights>("/insights", { horizon: result.horizon, budget });
  return response.data;
}

// Matches the real dataset's actual scale (recent 30-day run-rate spend per
// channel in backend/data/) — not an arbitrary illustrative number. The
// trained models are tree-based quantile regressors and do not extrapolate
// well far outside the spend levels they were trained on (this dataset's
// campaigns run in the thousands-to-low-hundred-thousands per month, not
// millions); a budget far above this will still return a forecast, but ROAS
// quality degrades the further the input strays from the training range.
export const INITIAL_BUDGET: BudgetAllocation = {
  google: 70_000,
  meta: 7_500,
  microsoft: 4_000,
};
