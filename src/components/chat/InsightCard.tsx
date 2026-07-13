import { Lightbulb } from "lucide-react";
import type { ReactNode } from "react";

export function InsightCard({
  title,
  children,
  accent = "primary",
}: {
  title: string;
  children: ReactNode;
  accent?: "primary" | "warning";
}) {
  const tone = accent === "warning" ? "text-warning border-warning/30" : "text-primary border-primary/30";
  return (
    <div className={`mt-2 rounded-sm border bg-panel-2/40 p-3 ${tone.split(" ")[1]}`}>
      <div className={`mono mb-1.5 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] ${tone.split(" ")[0]}`}>
        <Lightbulb className="h-3 w-3" /> {title}
      </div>
      <div className="text-[12.5px] text-foreground/90">{children}</div>
    </div>
  );
}
