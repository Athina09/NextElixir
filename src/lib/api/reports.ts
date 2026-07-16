import { apiClient } from "@/lib/api/client";
import type { BudgetAllocation, Horizon } from "@/lib/forecast";

export type ReportType = "executive" | "forecast" | "campaign" | "budget";
export type ReportFormat = "pdf" | "csv" | "excel";

export async function downloadReport(
  reportType: ReportType,
  format: ReportFormat,
  horizon: Horizon,
  budget: BudgetAllocation,
): Promise<void> {
  const response = await apiClient.post(
    "/reports",
    { report_type: reportType, format, horizon, budget },
    { responseType: "blob" },
  );

  const extension = format === "excel" ? "xlsx" : format;
  const url = URL.createObjectURL(response.data as Blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${reportType}-report.${extension}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
