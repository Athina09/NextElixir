import { Plus, Sparkles, X } from "lucide-react";
import { useChat } from "@/hooks/useChat";
import { NetElixirLogo } from "@/components/PlatformLogos";

export function ChatHeader({ onClose, compact = false }: { onClose?: () => void; compact?: boolean }) {
  const { newConversation } = useChat();
  return (
    <div className="hairline-b flex h-12 items-center gap-3 bg-panel px-4">
      {/* Avatar */}
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md gradient-primary text-primary-foreground">
        <Sparkles className="h-3 w-3" strokeWidth={2.5} />
      </div>

      {/* Title */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold tracking-tight text-foreground">
            ForecastIQ AI
          </span>
          <span className="mono rounded-sm bg-primary/15 px-1.5 py-[1px] text-[9px] uppercase tracking-widest text-primary">
            Groq
          </span>
        </div>
        {!compact && (
          <div className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
            <NetElixirLogo size={10} />
            <span className="mono uppercase tracking-[0.12em]">Powered by NetElixir</span>
          </div>
        )}
      </div>

      {/* New conversation */}
      <button
        onClick={newConversation}
        className="mono flex items-center gap-1.5 rounded-md border border-border bg-panel-2/60 px-2.5 py-1 text-[11px] text-muted-foreground hover:border-primary/40 hover:text-foreground"
      >
        <Plus className="h-3 w-3" /> New
      </button>
      {onClose && (
        <button
          onClick={onClose}
          aria-label="Close"
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-panel-2 hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
      )}
    </div>
  );
}
