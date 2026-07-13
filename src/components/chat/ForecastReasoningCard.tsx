import { Brain } from "lucide-react";

interface Props {
  title: string;
  drivers: { label: string; value: string; weight: number }[];
}

export function ForecastReasoningCard({ title, drivers }: Props) {
  return (
    <div className="panel mt-2 p-3">
      <div className="mono mb-2 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        <Brain className="h-3 w-3 text-primary" /> {title}
      </div>
      <div className="space-y-1.5">
        {drivers.map((d) => (
          <div key={d.label} className="grid grid-cols-[1fr_auto] items-center gap-2">
            <div className="min-w-0">
              <div className="truncate text-[12px] text-foreground">{d.label}</div>
              <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-panel">
                <div
                  className="h-full bg-primary/80"
                  style={{ width: `${Math.max(6, Math.min(100, d.weight * 100))}%` }}
                />
              </div>
            </div>
            <div className="mono text-right text-[11.5px] text-foreground">{d.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
