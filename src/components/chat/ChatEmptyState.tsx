import { Sparkles } from "lucide-react";

export function ChatEmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 py-10 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-primary/15 text-primary">
        <Sparkles className="h-5 w-5" />
      </div>
      <div className="mono mt-3 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        ForecastIQ · AI Assistant
      </div>
      <h3 className="mt-1 text-[15px] font-semibold text-foreground">
        Ask anything about your forecast
      </h3>
      <p className="mt-1 max-w-md text-[12.5px] text-muted-foreground">
        The assistant has access to the current budget, forecast horizon, channel mix, drill-down
        selection, and data-quality warnings. Responses include citations and reasoning.
      </p>
    </div>
  );
}
