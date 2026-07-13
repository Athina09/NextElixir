import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Risk {
  label: string;
  severity: "low" | "medium" | "high";
  note: string;
}

const tone: Record<Risk["severity"], string> = {
  low: "text-muted-foreground border-border",
  medium: "text-warning border-warning/40",
  high: "text-error border-error/40",
};

export function RiskExplanationCard({ risks }: { risks: Risk[] }) {
  return (
    <div className="mt-2 rounded-sm border border-warning/30 bg-warning/5 p-3">
      <div className="mono mb-2 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-warning">
        <AlertTriangle className="h-3 w-3" /> Risk flags
      </div>
      <ul className="space-y-2">
        {risks.map((r) => (
          <li key={r.label} className={cn("rounded-sm border-l-2 pl-2.5", tone[r.severity])}>
            <div className="flex items-center justify-between gap-2 text-[12px]">
              <span className="font-medium text-foreground">{r.label}</span>
              <span className="mono text-[10px] uppercase tracking-widest">{r.severity}</span>
            </div>
            <p className="mt-0.5 text-[11.5px] text-muted-foreground">{r.note}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
