import { useState, useRef } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageContainer } from "@/components/AppLayout";
import { UploadCloud, FileCheck2, AlertTriangle, CheckCircle2, X } from "lucide-react";

export const Route = createFileRoute("/upload")({
  head: () => ({
    meta: [
      { title: "Upload Data · ForecastIQ" },
      { name: "description", content: "Upload Google Ads, Meta, Microsoft, GA4, and Shopify data for forecasting." },
    ],
  }),
  component: UploadPage,
});

const SOURCES = ["Google Ads", "Meta Ads", "Microsoft Ads", "GA4", "Shopify"];

interface FileRow {
  name: string;
  source: string;
  rows: number;
  size: string;
  status: "validating" | "valid" | "warnings";
  warnings: number;
}

const SEED: FileRow[] = [
  { name: "google_ads_2024_2026.csv", source: "Google Ads", rows: 428_120, size: "38.4 MB", status: "valid", warnings: 0 },
  { name: "meta_campaigns_export.csv", source: "Meta Ads", rows: 214_800, size: "22.1 MB", status: "warnings", warnings: 11 },
  { name: "ga4_ecommerce_events.csv", source: "GA4", rows: 1_248_002, size: "104.9 MB", status: "valid", warnings: 0 },
];

const PREVIEW = [
  ["date", "campaign", "channel", "spend", "revenue", "roas"],
  ["2026-07-10", "PMax • Summer Apparel", "Google Ads", "42,000", "184,800", "4.40"],
  ["2026-07-10", "Retargeting • Reels", "Meta Ads", "18,500", "62,900", "3.40"],
  ["2026-07-10", "Bing Shopping • Core", "Microsoft Ads", "9,200", "39,100", "4.25"],
  ["2026-07-10", "Search Brand • Core", "Google Ads", "12,300", "72,300", "5.88"],
  ["2026-07-10", "Display Prospecting", "Google Ads", "22,100", "48,600", "2.20"],
];

function UploadPage() {
  const [files, setFiles] = useState(SEED);
  const [progress, setProgress] = useState<number | null>(null);
  const [drag, setDrag] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  function simulateUpload(name: string) {
    if (timer.current) clearInterval(timer.current);
    setProgress(0);
    timer.current = setInterval(() => {
      setProgress((p) => {
        if (p === null) return null;
        if (p >= 100) {
          if (timer.current) clearInterval(timer.current);
          setFiles((fs) => [
            {
              name,
              source: "Google Ads",
              rows: Math.floor(20_000 + Math.random() * 200_000),
              size: `${(2 + Math.random() * 40).toFixed(1)} MB`,
              status: Math.random() > 0.5 ? "valid" : "warnings",
              warnings: Math.random() > 0.5 ? 0 : Math.floor(Math.random() * 12),
            },
            ...fs,
          ]);
          return null;
        }
        return p + 6;
      });
    }, 90);
  }

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
            const f = e.dataTransfer.files?.[0];
            simulateUpload(f?.name || `manual_upload_${Date.now()}.csv`);
          }}
          className={`panel flex flex-col items-center justify-center border-dashed py-14 text-center transition ${
            drag ? "border-primary/70 bg-primary/5" : ""
          }`}
        >
          <UploadCloud className="h-8 w-8 text-primary" />
          <div className="mt-3 text-[13px] font-medium">Drop CSV export here</div>
          <div className="mt-1 max-w-md text-[11.5px] text-muted-foreground">
            Supports Google Ads, Meta Ads Manager, Microsoft Advertising, GA4 events, and Shopify orders. Max 500MB.
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-1.5">
            {SOURCES.map((s) => (
              <span
                key={s}
                className="mono hairline-b rounded-sm bg-panel-2/60 px-1.5 py-0.5 text-[10px] uppercase tracking-widest text-muted-foreground"
              >
                {s}
              </span>
            ))}
          </div>
          <button
            onClick={() => simulateUpload(`shopify_orders_${Date.now()}.csv`)}
            className="mono mt-5 rounded-md gradient-primary px-3 py-1.5 text-[12px] font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
          >
            Simulate upload
          </button>
          {progress !== null ? (
            <div className="mt-4 w-full max-w-md">
              <div className="mono mb-1 flex justify-between text-[10px] text-muted-foreground">
                <span>uploading…</span>
                <span>{progress}%</span>
              </div>
              <div className="h-1 w-full overflow-hidden rounded-full bg-panel-2">
                <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
              </div>
            </div>
          ) : null}
        </div>

        <div className="panel p-4">
          <div className="text-[10.5px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Data validation
          </div>
          <div className="mt-1 text-[13px] font-medium">Automated schema & integrity checks</div>
          <ul className="mono mt-3 space-y-1.5 text-[11.5px]">
            <li className="flex items-start gap-2 text-success">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5" />
              Schema matches Google Ads export v14
            </li>
            <li className="flex items-start gap-2 text-success">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5" />
              Date range coverage 100%
            </li>
            <li className="flex items-start gap-2 text-warning">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5" />
              11 rows missing UTM parameters
            </li>
            <li className="flex items-start gap-2 text-warning">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5" />
              4 duplicate campaign IDs
            </li>
            <li className="flex items-start gap-2 text-error">
              <X className="mt-0.5 h-3.5 w-3.5" />
              2 rows invalid date format
            </li>
          </ul>
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
              <th className="px-2 py-2 text-right font-medium">Size</th>
              <th className="px-4 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {files.map((f) => (
              <tr key={f.name + Math.random()} className="hairline-b">
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <FileCheck2 className="h-3.5 w-3.5 text-primary" />
                    <span className="mono text-[11.5px]">{f.name}</span>
                  </div>
                </td>
                <td className="px-2 py-2.5 text-muted-foreground">{f.source}</td>
                <td className="mono px-2 py-2.5 text-right">{f.rows.toLocaleString("en-IN")}</td>
                <td className="mono px-2 py-2.5 text-right text-muted-foreground">{f.size}</td>
                <td className="px-4 py-2.5">
                  <span
                    className={`mono rounded-sm px-1.5 py-0.5 text-[10px] uppercase tracking-widest ${
                      f.status === "valid" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                    }`}
                  >
                    {f.status === "valid" ? "valid" : `${f.warnings} warnings`}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="panel mt-3 overflow-hidden">
        <div className="hairline-b px-4 py-3 text-[13px] font-medium">Preview</div>
        <table className="w-full text-[11.5px]">
          <thead>
            <tr className="hairline-b bg-panel-2/30 text-left text-[10px] uppercase tracking-widest text-muted-foreground">
              {PREVIEW[0].map((h) => (
                <th key={h} className="px-3 py-2 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PREVIEW.slice(1).map((row, i) => (
              <tr key={i} className="hairline-b">
                {row.map((c, j) => (
                  <td key={j} className={`px-3 py-2 ${j > 2 ? "mono text-right" : ""}`}>
                    {c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageContainer>
  );
}
