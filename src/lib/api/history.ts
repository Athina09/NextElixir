import { apiClient } from "@/lib/api/client";
import type { ForecastResult } from "@/lib/forecast";

export interface ForecastRunSummary {
  id: string;
  date: string;
  budget: number;
  revenue: number;
  roas: number;
  confidence: number;
  status: "completed" | "draft" | "failed";
}

export async function fetchForecastRuns(): Promise<ForecastRunSummary[]> {
  const response = await apiClient.get<ForecastRunSummary[]>("/forecast-runs");
  return response.data;
}

export async function deleteForecastRun(id: string): Promise<void> {
  const runId = id.replace(/^F-/, "");
  await apiClient.delete(`/forecast-runs/${runId}`);
}

export async function rerunForecastRun(id: string): Promise<ForecastResult> {
  const runId = id.replace(/^F-/, "");
  const response = await apiClient.post<ForecastResult>(`/forecast-runs/${runId}/rerun`);
  return response.data;
}
