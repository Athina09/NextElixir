import { motion } from "framer-motion";
import { Terminal, Sparkles } from "lucide-react";
import { useForecast } from "@/lib/forecast-context";

function Block({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mono mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-primary">
        <span>&gt;</span> {title}
      </div>
      <div className="mono text-[12px] leading-[1.7] text-foreground/90">
        {children}
      </div>
    </div>
  );
}

/**
 * Analyst-report style AI insights.
 * Borderless. Left accent rule. Terminal typography. Reads like a memo.
 */
export function AnalystReport() {
  const { insights, insightsLoading } = useForecast();
  return (
    <section className="border-l-2 border-primary/70 pl-5">
      <div className="hairline-b flex items-center justify-between pb-3">
        <div>
          <div className="mono flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            <Terminal className="h-3 w-3 text-primary" />
            AI Forecast Analysis
          </div>
          <div className="mt-1 text-[15px] font-semibold tracking-tight">
            Analyst reasoning · explainable model output
          </div>
        </div>
        <div
          className={`mono flex items-center gap-1.5 text-[10px] uppercase tracking-widest ${
            insightsLoading ? "text-warning" : "text-primary"
          }`}
        >
          <Sparkles className="h-3 w-3" />
          {insightsLoading ? "reasoning…" : "ready"}
        </div>
      </div>

      <div className="pt-5">
        {insightsLoading || !insights ? (
          <div className="mono space-y-1.5 text-[12px] text-muted-foreground">
            <div>› sampling posterior distribution…</div>
            <div>› scoring drivers via SHAP…</div>
            <div>› compiling analyst narrative…</div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            <Block title="Business summary">{insights.summary}</Block>

            <div className="grid gap-6 md:grid-cols-2">
              <Block title="Positive drivers">
                <ul className="space-y-1.5">
                  {insights.positives.map((p) => (
                    <li key={p} className="flex gap-2">
                      <span className="text-primary">+</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </Block>
              <Block title="Risk factors">
                <ul className="space-y-1.5">
                  {insights.negatives.map((p) => (
                    <li key={p} className="flex gap-2">
                      <span className="text-error">−</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </Block>
            </div>

            <Block title="Recommendations">
              <ul className="space-y-1.5">
                {insights.recommendations.map((r) => (
                  <li key={r} className="flex gap-2">
                    <span className="text-primary">→</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </Block>

            <div className="grid gap-6 md:grid-cols-2">
              <Block title="Seasonality">{insights.seasonality}</Block>
              <Block title="Allocation">{insights.allocation}</Block>
            </div>

            {insights.flags.length ? (
              <Block title="Risk flags">
                <ul className="grid gap-1.5 md:grid-cols-2">
                  {insights.flags.map((r) => (
                    <li key={r} className="flex gap-2 text-warning">
                      <span>!</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </Block>
            ) : null}
          </motion.div>
        )}
      </div>
    </section>
  );
}
