import { Sparkles } from "lucide-react";

export function ChatEmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 py-10 text-center">
      <div className="relative flex h-11 w-11 items-center justify-center rounded-lg gradient-primary text-primary-foreground glow-primary">
        <Sparkles className="h-5 w-5" strokeWidth={2.25} />
        <span className="absolute -inset-1 -z-10 rounded-xl bg-primary/15 blur-md" aria-hidden />
      </div>
      <h3 className="mt-4 text-[15px] font-semibold tracking-tight text-foreground">
        Ask anything about your forecast
      </h3>
      <p className="mt-1.5 max-w-[280px] text-[12px] text-muted-foreground leading-relaxed">
        Answers are grounded in live P10/P50/P90 numbers, SHAP drivers, and anomalies — not free-form guesses.
      </p>
    </div>
  );
}
