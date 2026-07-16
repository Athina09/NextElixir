import { useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageContainer } from "@/components/AppLayout";
import { UploadCloud, FileCheck2, AlertTriangle, CheckCircle2, X, Info } from "lucide-react";
import { ChannelLogo } from "@/components/PlatformLogos";
import {
  fetchDatasets,
  fetchValidationReport,
  uploadDataset,
  type ValidationIssue,
} from "@/lib/api/datasets";

export const Route = createFileRoute("/upload")({
  head: () => ({
    meta: [
      { title: "Upload Data · ForecastIQ" },
      {
        name: "description",
        content: "Upload Google Ads, Meta, Microsoft, GA4, and Shopify data for forecasting.",
      },
    ],
  }),
  component: UploadPage,
});

const SOURCES = ["Google Ads", "Meta Ads", "Microsoft Ads", "GA4", "Shopify"];

function issueIcon(severity: ValidationIssue["severity"]) {
  if (severity === "error") return <X className="mt-0.5 h-3.5 w-3.5" />;
  if (severity === "warning") return <AlertTriangle className="mt-0.5 h-3.5 w-3.5" />;
  return <Info className="mt-0.5 h-3.5 w-3.5" />;
}

function issueColor(severity: ValidationIssue["severity"]) {
  if (severity === "error") return "text-error";
  if (severity === "warning") return "text-warning";
  return "text-muted-foreground";
}

function UploadPage() {
  const queryClient = useQueryClient();
  const [drag, setDrag] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const datasetsQuery = useQuery({ queryKey: ["datasets"], queryFn: fetchDatasets });
  const validationQuery = useQuery({ queryKey: ["validation"], queryFn: fetchValidationReport });

  const uploadMutation = useMutation({
    mutationFn: uploadDataset,
    onSuccess: () => {
      setUploadError(null);
      queryClient.invalidateQueries({ queryKey: ["datasets"] });
      queryClient.invalidateQueries({ queryKey: ["validation"] });
    },
    onError: (err: unknown) => {
      setUploadError(err instanceof Error ? err.message : "Upload failed.");
    },
  });

  function handleFile(file: File | undefined) {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setUploadError("Only .csv files are supported.");
      return;
    }
    uploadMutation.mutate(file);
  }

  const report = validationQuery.data;

  return (
    <PageContainer
      title="Upload Data"
      description="Ingest Google Ads, Meta, Microsoft, GA4, and Shopify data. Validation runs automatically."
    >
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            handleFile(e.dataTransfer.files?.[0]);
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`panel flex cursor-pointer flex-col items-center justify-center border-dashed py-14 text-center transition ${
            drag ? "border-primary/70 bg-primary/5" : ""
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <UploadCloud className="h-8 w-8 text-primary" />
          <div className="mt-3 text-[13px] font-medium">
            {uploadMutation.isPending ? "Uploading…" : "Drop CSV export here or click to browse"}
          </div>
          <div className="mt-1 max-w-md text-[11.5px] text-muted-foreground">
            Supports Google Ads, Meta Ads Manager, and Microsoft Advertising exports. Files are
            auto-detected by column schema — no need to rename anything.
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-1.5">
            {SOURCES.map((s) => (
              <span
                key={s}
                className="mono hairline-b flex items-center gap-1.5 rounded-sm bg-panel-2/60 px-1.5 py-0.5 text-[10px] uppercase tracking-widest text-muted-foreground"
              >
                <ChannelLogo channel={s} size={12} className="shrink-0" />
                {s}
              </span>
            ))}
          </div>
          {uploadError ? (
            <div className="mono mt-4 max-w-md text-[11px] text-error">{uploadError}</div>
          ) : null}
        </div>

        <div className="panel p-4">
          <div className="text-[10.5px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Data validation
          </div>
          <div className="mt-1 text-[13px] font-medium">Automated schema & integrity checks</div>
          {validationQuery.isLoading ? (
            <div className="mono mt-3 text-[11.5px] text-muted-foreground">Loading…</div>
          ) : validationQuery.isError ? (
            <div className="mono mt-3 text-[11.5px] text-error">
              Could not load validation report.
            </div>
          ) : (
            <>
              <div className="mono mt-3 text-[11px] text-muted-foreground">
                {report?.total_rows.toLocaleString("en-IN")} rows · {report?.error_count} error(s) ·{" "}
                {report?.warning_count} warning(s)
              </div>
              <ul className="mono mt-2 space-y-1.5 text-[11.5px]">
                {report?.issues.length === 0 ? (
                  <li className="flex items-start gap-2 text-success">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5" />
                    No data-quality issues found
                  </li>
                ) : (
                  report?.issues.map((issue) => (
                    <li
                      key={issue.code}
                      className={`flex items-start gap-2 ${issueColor(issue.severity)}`}
                    >
                      {issueIcon(issue.severity)}
                      <span>{issue.message}</span>
                    </li>
                  ))
                )}
              </ul>
            </>
          )}
        </div>
      </div>

      <div className="panel mt-3 overflow-hidden">
        <div className="hairline-b flex items-center justify-between px-4 py-3">
          <div className="text-[13px] font-medium">Ingested files</div>
        </div>
        <table className="w-full text-[12px]">
          <thead>
            <tr className="hairline-b text-left text-[10px] uppercase tracking-widest text-muted-foreground">
              <th className="px-4 py-2 font-medium">File</th>
              <th className="px-2 py-2 font-medium">Source</th>
              <th className="px-2 py-2 text-right font-medium">Rows</th>
              <th className="px-4 py-2 font-medium">Uploaded</th>
            </tr>
          </thead>
          <tbody>
            {datasetsQuery.data?.map((d) => (
              <tr key={d.id} className="hairline-b">
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <FileCheck2 className="h-3.5 w-3.5 text-primary" />
                    <span className="mono text-[11.5px]">{d.filename}</span>
                  </div>
                </td>
                <td className="px-2 py-2.5 text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    {d.channel ? (
                      <ChannelLogo channel={d.channel} size={14} className="shrink-0" />
                    ) : null}
                    <span>{d.channel ?? "Unknown"}</span>
                  </div>
                </td>
                <td className="mono px-2 py-2.5 text-right">
                  {d.row_count.toLocaleString("en-IN")}
                </td>
                <td className="mono px-4 py-2.5 text-muted-foreground">
                  {new Date(d.uploaded_at).toLocaleString("en-IN")}
                </td>
              </tr>
            ))}
            {datasetsQuery.data?.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-6 text-center text-[11.5px] text-muted-foreground"
                >
                  No uploads yet this session — data/ ships with the Google, Meta, and Bing sample
                  exports.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </PageContainer>
  );
}
