import { createFileRoute } from "@tanstack/react-router";
import { PageContainer } from "@/components/AppLayout";
import { formatINR, formatMultiple, formatPct } from "@/lib/format";
import { RotateCw, Trash2 } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/forecast-history")({
  head: () => ({
    meta: [
      { title: "Forecast History · ForecastIQ" },
      { name: "description", content: "Audit trail of previous forecast runs, budgets, and confidence." },
    ],
  }),
  component: ForecastHistoryPage,
});

interface Row {
  id: string;
  date: string;
  budget: number;
  revenue: number;
  roas: number;
  confidence: number;
  status: "completed" | "draft" | "failed";
}

const SEED: Row[] = [
  { id: "F-20260713-0912", date: "2026-07-13 09:12", budget: 3_500_000, revenue: 14_820_000, roas: 4.23, confidence: 0.89, status: "completed" },
  { id: "F-20260712-2001", date: "2026-07-12 20:01", budget: 3_200_000, revenue: 13_450_000, roas: 4.2, confidence: 0.86, status: "completed" },
  { id: "F-20260712-1130", date: "2026-07-12 11:30", budget: 3_000_000, revenue: 12_120_000, roas: 4.04, confidence: 0.83, status: "completed" },
  { id: "F-20260711-1745", date: "2026-07-11 17:45", budget: 4_000_000, revenue: 17_640_000, roas: 4.41, confidence: 0.79, status: "completed" },
  { id: "F-20260710-0902", date: "2026-07-10 09:02", budget: 2_800_000, revenue: 11_010_000, roas: 3.93, confidence: 0.71, status: "draft" },
  { id: "F-20260709-2214", date: "2026-07-09 22:14", budget: 5_000_000, revenue: 0, roas: 0, confidence: 0, status: "failed" },
];

function ForecastHistoryPage() {
  const [rows, setRows] = useState(SEED);
  return (
    <PageContainer
      title="Forecast History"
      description="Audit trail of every forecast execution against this dataset."
    >
      <div className="panel overflow-hidden">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="hairline-b text-left text-[10px] uppercase tracking-widest text-muted-foreground">
              <th className="px-4 py-2 font-medium">Run ID</th>
              <th className="px-2 py-2 font-medium">Date</th>
              <th className="px-2 py-2 text-right font-medium">Budget</th>
              <th className="px-2 py-2 text-right font-medium">Revenue P50</th>
              <th className="px-2 py-2 text-right font-medium">ROAS</th>
              <th className="px-2 py-2 text-right font-medium">Confidence</th>
              <th className="px-2 py-2 font-medium">Status</th>
              <th className="px-4 py-2 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="hairline-b hover:bg-panel-2/40">
                <td className="mono px-4 py-2.5 text-[11px]">{r.id}</td>
                <td className="mono px-2 py-2.5 text-muted-foreground">{r.date}</td>
                <td className="mono px-2 py-2.5 text-right">{formatINR(r.budget)}</td>
                <td className="mono px-2 py-2.5 text-right">
                  {r.revenue ? formatINR(r.revenue) : "—"}
                </td>
                <td className="mono px-2 py-2.5 text-right text-primary">
                  {r.roas ? formatMultiple(r.roas) : "—"}
                </td>
                <td className="mono px-2 py-2.5 text-right text-muted-foreground">
                  {r.confidence ? formatPct(r.confidence, 0) : "—"}
                </td>
                <td className="px-2 py-2.5">
                  <span
                    className={`mono rounded-sm px-1.5 py-0.5 text-[10px] uppercase tracking-widest ${
                      r.status === "completed"
                        ? "bg-success/10 text-success"
                        : r.status === "draft"
                          ? "bg-warning/10 text-warning"
                          : "bg-error/10 text-error"
                    }`}
                  >
                    {r.status}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <div className="flex justify-end gap-1">
                    <button className="hairline-b rounded-sm bg-panel-2 p-1 hover:text-foreground text-muted-foreground">
                      <RotateCw className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => setRows((rs) => rs.filter((x) => x.id !== r.id))}
                      className="hairline-b rounded-sm bg-panel-2 p-1 text-muted-foreground hover:text-error"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageContainer>
  );
}
