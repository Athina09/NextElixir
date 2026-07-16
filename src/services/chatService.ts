// AI forecasting assistant — backed by the real /chat endpoint (Gemini,
// grounded in the current forecast/SHAP/anomaly context; see
// backend/src/forecastiq/api/routers/chat.py). No response is generated
// client-side anymore.

import { apiClient } from "@/lib/api/client";
import type { ForecastResult, Insights, BudgetAllocation, Horizon } from "@/lib/forecast";

export type MessageKind =
  | "user"
  | "assistant"
  | "system"
  | "risk"
  | "recommendation"
  | "forecast-summary"
  | "budget-optimization";

export interface ChatCitation {
  label: string;
  source: string;
  detail?: string;
}

export interface AssistantPayload {
  kind: MessageKind;
  markdown: string;
  citations?: ChatCitation[];
  reasoning?: { title: string; drivers: { label: string; value: string; weight: number }[] };
  risks?: { label: string; severity: "low" | "medium" | "high"; note: string }[];
  budget?: {
    channel: string;
    current: number;
    proposed: number;
    delta: number;
    rationale: string;
  }[];
  /** The backend chat session this reply belongs to — carry it on the next
   * call (via `ForecastContext.sessionId`) so follow-up turns land in the
   * same server-side conversation history. */
  sessionId?: number;
}

export interface ForecastContext {
  budget: BudgetAllocation;
  forecast: ForecastResult | null;
  insights: Insights | null;
  horizon: number;
  level: string;
  channel: string;
  sessionId?: number | null;
}

interface ChatApiResponse {
  session_id: number;
  payload: Omit<AssistantPayload, "sessionId">;
}

export async function generateResponse(
  prompt: string,
  ctx: ForecastContext,
): Promise<AssistantPayload> {
  const response = await apiClient.post<ChatApiResponse>("/chat", {
    message: prompt,
    session_id: ctx.sessionId ?? null,
    horizon: ctx.horizon as Horizon,
    budget: ctx.budget,
  });
  return { ...response.data.payload, sessionId: response.data.session_id };
}

export const SUGGESTED_QUESTIONS = [
  "Explain this forecast",
  "Optimize my budget",
  "Why is ROAS decreasing?",
  "What are the biggest risks?",
  "Show campaign insights",
  "Find anomalies",
  "Increase revenue",
  "Improve confidence",
  "Generate executive summary",
  "Best performing channel",
  "Worst performing campaign",
  "Seasonality impact",
];
