import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageContainer } from "@/components/AppLayout";
import { formatINR, formatMultiple, formatPct } from "@/lib/format";
import { RotateCw, Trash2 } from "lucide-react";
import { deleteForecastRun, fetchForecastRuns, rerunForecastRun } from "@/lib/api/history";

export const Route = createFileRoute("/forecast-history")({
  head: () => ({
    meta: [
      { title: "Forecast History · ForecastIQ" },
      {
        name: "description",
        content: "Audit trail of previous forecast runs, budgets, and confidence.",
      },
    ],
  }),
  component: ForecastHistoryPage,
});

function ForecastHistoryPage() {
  const queryClient = useQueryClient();
  const runsQuery = useQuery({ queryKey: ["forecast-runs"], queryFn: fetchForecastRuns });

  const deleteMutation = useMutation({
    mutationFn: deleteForecastRun,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["forecast-runs"] }),
  });

  const rerunMutation = useMutation({
    mutationFn: rerunForecastRun,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["forecast-runs"] }),
  });

  const rows = runsQuery.data ?? [];

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
            {runsQuery.isLoading ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-6 text-center text-[11.5px] text-muted-foreground"
                >
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-6 text-center text-[11.5px] text-muted-foreground"
                >
                  No forecast runs yet — generate one from the Dashboard or Budget Simulator.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="hairline-b hover:bg-panel-2/40">
                  <td className="mono px-4 py-2.5 text-[11px]">{r.id}</td>
                  <td className="mono px-2 py-2.5 text-muted-foreground">
                    {new Date(r.date).toLocaleString("en-IN")}
                  </td>
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
                      <button
                        onClick={() => rerunMutation.mutate(r.id)}
                        disabled={rerunMutation.isPending}
                        className="hairline-b rounded-sm bg-panel-2 p-1 text-muted-foreground hover:text-foreground disabled:opacity-50"
                      >
                        <RotateCw className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => deleteMutation.mutate(r.id)}
                        disabled={deleteMutation.isPending}
                        className="hairline-b rounded-sm bg-panel-2 p-1 text-muted-foreground hover:text-error disabled:opacity-50"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </PageContainer>
  );
}
