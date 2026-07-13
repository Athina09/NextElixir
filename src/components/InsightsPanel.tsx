import { motion } from "framer-motion";
import { Sparkles, Terminal } from "lucide-react";
import { useForecast } from "@/lib/forecast-context";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mono mb-1 text-[10px] uppercase tracking-[0.16em] text-primary">
        &gt; {title}
      </div>
      <div className="text-[12.5px] leading-relaxed text-foreground">{children}</div>
    </div>
  );
}

export function InsightsPanel() {
  const { insights, insightsLoading } = useForecast();
  return (
    <div className="panel flex h-full flex-col border-l-2 border-l-primary/70">
      <div className="hairline-b flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <Terminal className="h-3.5 w-3.5 text-primary" />
          <div>
            <div className="text-[10.5px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              AI-generated insights
            </div>
            <div className="mono mt-0.5 text-[12px]">explainable-ai/insights.v2</div>
          </div>
        </div>
        <div
          className={`mono flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[10px] ${
            insightsLoading ? "bg-warning/10 text-warning" : "bg-primary/10 text-primary"
          }`}
        >
          <Sparkles className="h-3 w-3" />
          {insightsLoading ? "reasoning…" : "ready"}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {insightsLoading || !insights ? (
          <div className="mono space-y-2 text-[12px] text-muted-foreground">
            <div>› loading temporal features…</div>
            <div>› sampling posterior distribution…</div>
            <div>› scoring drivers via SHAP…</div>
            <div>› compiling narrative…</div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="space-y-4"
          >
            <Section title="Business summary">{insights.summary}</Section>
            <div className="grid gap-4 md:grid-cols-2">
              <Section title="Positive signals">
                <ul className="space-y-1">
                  {insights.positives.map((p) => (
                    <li key={p} className="flex gap-2">
                      <span className="mono text-primary">+</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </Section>
              <Section title="Negative signals">
                <ul className="space-y-1">
                  {insights.negatives.map((p) => (
                    <li key={p} className="flex gap-2">
                      <span className="mono text-error">−</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </Section>
            </div>
            <Section title="Forecast drivers">
              <ul className="space-y-1">
                {insights.drivers.map((d) => (
                  <li key={d} className="flex gap-2">
                    <span className="mono text-muted-foreground">·</span>
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </Section>
            <Section title="Seasonality">{insights.seasonality}</Section>
            <Section title="Budget allocation">{insights.allocation}</Section>
            <Section title="Recommendations">
              <ul className="space-y-1">
                {insights.recommendations.map((r) => (
                  <li key={r} className="flex gap-2">
                    <span className="mono text-primary">→</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </Section>
            <Section title="Risk flags">
              <ul className="grid gap-1 md:grid-cols-2">
                {insights.flags.map((r) => (
                  <li key={r} className="flex gap-2 text-warning">
                    <span className="mono">!</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </Section>
          </motion.div>
        )}
      </div>
    </div>
  );
}
