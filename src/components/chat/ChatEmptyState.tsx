import { Sparkles } from "lucide-react";

export function ChatEmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 py-10 text-center">
      <div className="flex h-9 w-9 items-center justify-center rounded-sm gradient-primary text-primary-foreground">
        <Sparkles className="h-4 w-4" strokeWidth={2.25} />
      </div>
      <h3 className="mt-3 text-[14px] font-semibold text-foreground">
        Ask anything about your forecast
      </h3>
      <p className="mt-1 max-w-[260px] text-[11.5px] text-muted-foreground leading-relaxed">
        Budget, ROAS, channels, campaign insights — just ask.
      </p>
    </div>
  );
}
