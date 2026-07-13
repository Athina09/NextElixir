// Deterministic PRNG so demo numbers are stable across renders.
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

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

const CAMPAIGN_TYPES = ["Search", "Shopping", "Performance Max", "Display", "Video"];

function normalPdf(x: number, mu: number, sigma: number) {
  const z = (x - mu) / sigma;
  return Math.exp(-0.5 * z * z) / (sigma * Math.sqrt(2 * Math.PI));
}

export function predictForecast(
  budget: BudgetAllocation,
  horizon: Horizon,
): Promise<ForecastResult> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const totalBudget = budget.google + budget.meta + budget.microsoft;
      const seed = Math.floor(totalBudget / 1000) + horizon;
      const rnd = mulberry32(seed);

      // Channel-level efficiency priors (ROAS baseline)
      const priors = {
        "Google Ads": { roas: 4.6, share: budget.google / Math.max(totalBudget, 1) },
        "Meta Ads": { roas: 3.4, share: budget.meta / Math.max(totalBudget, 1) },
        "Microsoft Ads": { roas: 3.9, share: budget.microsoft / Math.max(totalBudget, 1) },
      } as const;

      // Blended ROAS with mild diminishing returns
      const scaleFactor = Math.max(0.55, 1 - Math.log10(1 + totalBudget / 2_000_000) * 0.12);
      const blendedRoas =
        (priors["Google Ads"].roas * priors["Google Ads"].share +
          priors["Meta Ads"].roas * priors["Meta Ads"].share +
          priors["Microsoft Ads"].roas * priors["Microsoft Ads"].share) *
        scaleFactor;

      const expectedRevenue = totalBudget * blendedRoas;

      // Timeline (per-day expected revenue) with seasonality + noise
      const timeline: ForecastPoint[] = [];
      const start = new Date();
      for (let d = 0; d < horizon; d++) {
        const t = d / horizon;
        const weekly = 1 + 0.08 * Math.sin((d / 7) * Math.PI * 2);
        const seasonal = 1 + 0.15 * Math.sin(t * Math.PI * 1.2);
        const drift = 1 + 0.18 * t;
        const noise = 0.9 + rnd() * 0.2;
        const p50 = (expectedRevenue / horizon) * weekly * seasonal * drift * noise;
        const sigma = p50 * 0.18;
        const dt = new Date(start);
        dt.setDate(start.getDate() + d);
        timeline.push({
          day: d + 1,
          date: dt.toISOString().slice(0, 10),
          p10: Math.max(0, p50 - 1.28 * sigma),
          p25: Math.max(0, p50 - 0.67 * sigma),
          p50,
          p75: p50 + 0.67 * sigma,
          p90: p50 + 1.28 * sigma,
          roas: (p50 / (totalBudget / horizon)) || 0,
        });
      }

      const p50Total = timeline.reduce((s, p) => s + p.p50, 0);
      const p10Total = timeline.reduce((s, p) => s + p.p10, 0);
      const p90Total = timeline.reduce((s, p) => s + p.p90, 0);

      // Distribution around mean (bell)
      const mean = p50Total;
      const sigma = mean * 0.14;
      const distribution = Array.from({ length: 41 }, (_, i) => {
        const bucket = mean - sigma * 2.5 + (i / 40) * sigma * 5;
        return { bucket, density: normalPdf(bucket, mean, sigma) };
      });

      const channels: ChannelForecast[] = (Object.keys(priors) as Channel[]).map((name) => {
        const share = priors[name].share || 0;
        const spend = totalBudget * share;
        const revenue = spend * priors[name].roas * scaleFactor * (0.92 + rnd() * 0.16);
        const trend = Array.from({ length: 12 }, (_, i) => {
          const base = revenue / 12;
          return base * (0.85 + Math.sin(i / 2) * 0.12 + rnd() * 0.1);
        });
        return {
          name,
          spend,
          revenue,
          roas: revenue / Math.max(spend, 1),
          contribution: revenue / Math.max(expectedRevenue, 1),
          confidence: 0.72 + rnd() * 0.2,
          trend,
        };
      });

      const campaignTypes: CampaignTypeRow[] = CAMPAIGN_TYPES.map((type, i) => {
        const spend = (totalBudget / CAMPAIGN_TYPES.length) * (0.6 + rnd() * 0.9);
        const roasMul = [1.15, 1.05, 1.22, 0.85, 0.95][i];
        const revenue = spend * blendedRoas * roasMul * (0.9 + rnd() * 0.2);
        return {
          type,
          spend,
          revenue,
          roas: revenue / Math.max(spend, 1),
          ctr: 0.012 + rnd() * 0.04,
          conv: 0.008 + rnd() * 0.025,
        };
      });

      const campaigns: CampaignRow[] = Array.from({ length: 42 }, (_, i) => {
        const channel = (["Google Ads", "Meta Ads", "Microsoft Ads"] as const)[i % 3];
        const type = CAMPAIGN_TYPES[i % CAMPAIGN_TYPES.length];
        const spend = 10_000 + rnd() * 220_000;
        const roas = 1.4 + rnd() * 5.2;
        const revenue = spend * roas;
        return {
          id: `CMP-${(1000 + i).toString()}`,
          name: `${type} • ${channel.split(" ")[0]} #${i + 1}`,
          channel,
          type,
          spend,
          revenue,
          roas,
          ctr: 0.008 + rnd() * 0.05,
          conv: 0.005 + rnd() * 0.03,
          confidence: 0.55 + rnd() * 0.4,
        };
      });

      resolve({
        horizon,
        totalBudget,
        revenue: { p10: p10Total, p50: p50Total, p90: p90Total },
        roas: {
          p10: p10Total / Math.max(totalBudget, 1),
          p50: p50Total / Math.max(totalBudget, 1),
          p90: p90Total / Math.max(totalBudget, 1),
        },
        growth: 0.08 + rnd() * 0.24,
        confidence: 0.78 + rnd() * 0.15,
        timeline,
        distribution,
        channels,
        campaignTypes,
        campaigns,
        generatedAt: new Date().toISOString(),
      });
    }, 800);
  });
}

export function generateInsights(result: ForecastResult): Promise<Insights> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const top = [...result.channels].sort((a, b) => b.roas - a.roas)[0];
      const weak = [...result.channels].sort((a, b) => a.roas - b.roas)[0];
      const topType = [...result.campaignTypes].sort((a, b) => b.roas - a.roas)[0];

      resolve({
        summary: `Revenue is projected to reach ₹${(result.revenue.p50 / 100000).toFixed(1)}L over ${result.horizon} days at a blended ROAS of ${result.roas.p50.toFixed(2)}x. ${top.name} is the strongest performer this window; ${weak.name} shows weakening attribution efficiency and is dragging blended ROAS by an estimated ${((top.roas - weak.roas) * 100 / top.roas).toFixed(0)}%.`,
        drivers: [
          `${topType.type} campaigns leading with ${topType.roas.toFixed(2)}x ROAS`,
          `Seasonal demand uplift of ~15% modeled from historical curve`,
          `Budget concentration in ${top.name} (${(top.contribution * 100).toFixed(0)}%)`,
        ],
        positives: [
          `${top.name} confidence at ${(top.confidence * 100).toFixed(0)}%`,
          `Diminishing-returns curve still favorable at current spend level`,
          `Historical ${topType.type} conversion stability > 90 days`,
        ],
        negatives: [
          `${weak.name} ROAS below portfolio median`,
          `Display efficiency softening vs. prior quarter`,
          `Attribution overlap risk between Search and Shopping`,
        ],
        seasonality: `Model detects a +12–18% demand uplift centered mid-window with weekly cyclicality (7-day period, amplitude ±8%).`,
        allocation: `Rebalance ~8% of ${weak.name} spend toward ${top.name} to lift blended ROAS an estimated ${(0.15 + Math.random() * 0.2).toFixed(2)}x without breaching capacity thresholds.`,
        risks: [
          "Attribution model drift in Meta iOS traffic",
          "Limited historical data for Performance Max",
          "Concentration risk: single channel > 55% of spend",
        ],
        recommendations: [
          `Shift ₹${((result.totalBudget * 0.08) / 1000).toFixed(0)}K from ${weak.name} → ${top.name}`,
          `Cap Display spend at 12% of total until CTR recovers`,
          `Run a 14-day holdout test on ${topType.type} for incrementality`,
        ],
        flags: [
          "Campaign naming inconsistency (17 records)",
          "Limited historical data for 2 campaigns",
          "High spend concentration",
          "Seasonal volatility",
        ],
      });
    }, 1400);
  });
}

export const INITIAL_BUDGET: BudgetAllocation = {
  google: 1_800_000,
  meta: 1_200_000,
  microsoft: 500_000,
};
