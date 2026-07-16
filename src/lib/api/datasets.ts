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
