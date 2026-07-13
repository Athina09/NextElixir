import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageContainer } from "@/components/AppLayout";
import { predictForecast, type BudgetAllocation, type Horizon } from "@/lib/forecast";
import { formatINR, formatMultiple, formatPct } from "@/lib/format";
import { ArrowRight, Trophy } from "lucide-react";
import { useEffect } from "react";

export const Route = createFileRoute("/scenario-comparison")({
  head: () => ({
    meta: [
      { title: "Scenario Comparison · ForecastIQ" },
      { name: "description", content: "Compare two media budget scenarios side-by-side and identify the higher-EV plan." },
    ],
  }),
  component: ScenarioComparisonPage,
});

interface Scenario {
  budget: BudgetAllocation;
  horizon: Horizon;
}

const SCENARIO_A: Scenario = {
  budget: { google: 1_800_000, meta: 1_200_000, microsoft: 500_000 },
  horizon: 60,
};
const SCENARIO_B: Scenario = {
  budget: { google: 2_400_000, meta: 900_000, microsoft: 700_000 },
  horizon: 60,
};

function ScenarioEditor({
  label,
  scenario,
  onChange,
}: {
  label: string;
  scenario: Scenario;
  onChange: (s: Scenario) => void;
}) {
  return (
    <div className="panel p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-[10.5px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            {label}
          </div>
          <div className="mono text-[13px]">
            Total {formatINR(scenario.budget.google + scenario.budget.meta + scenario.budget.microsoft)}
          </div>
        </div>
      </div>
      {(["google", "meta", "microsoft"] as const).map((k) => (
        <div key={k} className="mb-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="capitalize text-muted-foreground">{k}</span>
            <span className="mono">{formatINR(scenario.budget[k])}</span>
          </div>
          <input
            type="range"
            min={0}
            max={5_000_000}
            step={50_000}
            value={scenario.budget[k]}
            onChange={(e) =>
              onChange({ ...scenario, budget: { ...scenario.budget, [k]: Number(e.target.value) } })
            }
            className="h-1 w-full appearance-none rounded-full bg-panel-2 accent-primary"
          />
        </div>
      ))}
    </div>
  );
}

function DiffRow({
  label,
  a,
  b,
  formatter,
  reverse,
}: {
  label: string;
  a: number;
  b: number;
  formatter: (n: number) => string;
  reverse?: boolean;
}) {
  const diff = b - a;
  const pct = a ? diff / a : 0;
  const positive = reverse ? diff < 0 : diff > 0;
  return (
    <tr className="hairline-b">
      <td className="px-4 py-2.5 text-[12px] text-muted-foreground">{label}</td>
      <td className="mono px-4 py-2.5 text-right text-[12px]">{formatter(a)}</td>
      <td className="mono px-4 py-2.5 text-right text-[12px]">{formatter(b)}</td>
      <td
        className={`mono px-4 py-2.5 text-right text-[12px] ${
          positive ? "text-primary" : "text-error"
        }`}
      >
        {diff > 0 ? "+" : ""}
        {formatter(diff)} · {formatPct(pct, 1)}
      </td>
    </tr>
  );
}

function ScenarioComparisonPage() {
  const [a, setA] = useState<Scenario>(SCENARIO_A);
  const [b, setB] = useState<Scenario>(SCENARIO_B);
  const [resA, setResA] = useState<any>(null);
  const [resB, setResB] = useState<any>(null);

  useEffect(() => {
    predictForecast(a.budget, a.horizon).then(setResA);
  }, [a]);
  useEffect(() => {
    predictForecast(b.budget, b.horizon).then(setResB);
  }, [b]);

  const winner = useMemo(() => {
    if (!resA || !resB) return null;
    return resB.revenue.p50 - resB.totalBudget > resA.revenue.p50 - resA.totalBudget ? "B" : "A";
  }, [resA, resB]);

  return (
    <PageContainer
      title="Scenario Comparison"
      description="Set two competing media budget plans and compare expected revenue, ROAS, and profit."
    >
      <div className="grid gap-3 lg:grid-cols-2">
        <ScenarioEditor label="Scenario A" scenario={a} onChange={setA} />
        <ScenarioEditor label="Scenario B" scenario={b} onChange={setB} />
      </div>

      <div className="panel mt-3 overflow-hidden">
        <div className="hairline-b flex items-center justify-between px-4 py-3">
          <div>
            <div className="text-[10.5px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Comparison
            </div>
            <div className="text-[13px] font-medium">Delta between scenarios (B − A)</div>
          </div>
          {winner ? (
            <div className="mono flex items-center gap-1.5 rounded-sm bg-primary/15 px-2 py-1 text-[11px] text-primary">
              <Trophy className="h-3 w-3" />
              Winner · Scenario {winner}
            </div>
          ) : null}
        </div>
        <table className="w-full text-[12px]">
          <thead>
            <tr className="hairline-b text-left text-[10px] uppercase tracking-widest text-muted-foreground">
              <th className="px-4 py-2 font-medium">Metric</th>
              <th className="px-4 py-2 text-right font-medium">Scenario A</th>
              <th className="px-4 py-2 text-right font-medium">Scenario B</th>
              <th className="px-4 py-2 text-right font-medium">
                <span className="inline-flex items-center gap-1">
                  Delta <ArrowRight className="h-3 w-3" />
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {resA && resB ? (
              <>
                <DiffRow
                  label="Total budget"
                  a={resA.totalBudget}
                  b={resB.totalBudget}
                  formatter={formatINR}
                  reverse
                />
                <DiffRow
                  label="Revenue (P50)"
                  a={resA.revenue.p50}
                  b={resB.revenue.p50}
                  formatter={formatINR}
                />
                <DiffRow
                  label="Revenue (P90)"
                  a={resA.revenue.p90}
                  b={resB.revenue.p90}
                  formatter={formatINR}
                />
                <DiffRow
                  label="ROAS (P50)"
                  a={resA.roas.p50}
                  b={resB.roas.p50}
                  formatter={formatMultiple}
                />
                <DiffRow
                  label="Profit (Rev − Spend)"
                  a={resA.revenue.p50 - resA.totalBudget}
                  b={resB.revenue.p50 - resB.totalBudget}
                  formatter={formatINR}
                />
                <DiffRow
                  label="Confidence"
                  a={resA.confidence}
                  b={resB.confidence}
                  formatter={(v) => formatPct(v, 0)}
                />
              </>
            ) : (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                  Computing scenarios…
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </PageContainer>
  );
}
