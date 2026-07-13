import { Plus, Sparkles, X } from "lucide-react";
import { useChat } from "@/hooks/useChat";

export function ChatHeader({ onClose, compact = false }: { onClose?: () => void; compact?: boolean }) {
  const { newConversation } = useChat();
  return (
    <div className="hairline-b flex h-14 items-center gap-3 bg-panel px-4">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm bg-primary/15 text-primary">
        <Sparkles className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1 leading-tight">
        <div className="flex items-center gap-2">
          <span className="truncate text-[13px] font-semibold tracking-tight text-foreground">
            Forecast Assistant
          </span>
          <span className="mono rounded-sm bg-primary/15 px-1.5 py-[1px] text-[9px] uppercase tracking-widest text-primary">
            AI Generated
          </span>
        </div>
        {!compact && (
          <div className="text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">
            AI-powered Business Reasoning
          </div>
        )}
      </div>
      <button
        onClick={newConversation}
        className="mono hairline-b flex items-center gap-1.5 rounded-sm bg-panel-2/60 px-2 py-1 text-[11px] text-muted-foreground hover:bg-panel-2 hover:text-foreground"
      >
        <Plus className="h-3 w-3" /> New
      </button>
      {onClose && (
        <button
          onClick={onClose}
          aria-label="Close assistant"
          className="flex h-7 w-7 items-center justify-center rounded-sm text-muted-foreground hover:bg-panel-2 hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
