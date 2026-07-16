import { apiClient } from "@/lib/api/client";

export type ValidationSeverity = "error" | "warning" | "info";

export interface ValidationIssue {
  severity: ValidationSeverity;
  code: string;
  message: string;
  affected_rows: number;
  sample_campaign_ids: string[];
}

export interface ValidationReport {
  total_rows: number;
  is_blocking: boolean;
  error_count: number;
  warning_count: number;
  issues: ValidationIssue[];
}

export interface Dataset {
  id: number;
  filename: string;
  channel: string | null;
  row_count: number;
  uploaded_at: string;
}

export interface DatasetUploadResponse {
  dataset: Dataset;
  validation: ValidationReport;
}

export async function fetchValidationReport(): Promise<ValidationReport> {
  const response = await apiClient.get<ValidationReport>("/validation");
  return response.data;
}

export async function fetchDatasets(): Promise<Dataset[]> {
  const response = await apiClient.get<Dataset[]>("/datasets");
  return response.data;
}

export async function uploadDataset(file: File): Promise<DatasetUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await apiClient.post<DatasetUploadResponse>("/datasets/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

export type DataQualityReportFormat = "pdf" | "csv" | "excel";

/** Downloads the validation panel + ingested-files list as a file — reuses the
 * same /reports rendering pipeline as the Reports page, scoped to the
 * current upload/validation state rather than a forecast. */
export async function downloadDataQualityReport(format: DataQualityReportFormat): Promise<void> {
  const response = await apiClient.get("/datasets/report", {
    params: { format },
    responseType: "blob",
  });

  const extension = format === "excel" ? "xlsx" : format;
  const url = URL.createObjectURL(response.data as Blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `data-quality-report.${extension}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
