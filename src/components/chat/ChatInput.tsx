import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { useChat } from "@/hooks/useChat";
import { cn } from "@/lib/utils";

export function ChatInput({ autoFocus = true }: { autoFocus?: boolean }) {
  const { send, loading } = useChat();
  const [value, setValue] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);

  // Ctrl+/ focuses input from anywhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "/") {
        e.preventDefault();
        ref.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const submit = async () => {
    const v = value.trim();
    if (!v || loading) return;
    setValue("");
    await send(v);
    ref.current?.focus();
  };

  return (
    <div className="hairline-t bg-panel/80 p-3">
      <div className="flex items-end gap-2 rounded-md border border-border bg-panel-2/60 px-3 py-2">
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="Ask about your forecast…"
          rows={1}
          aria-label="Chat message"
          className="mono max-h-32 min-h-[24px] flex-1 resize-none bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
        <button
          type="button"
          onClick={submit}
          disabled={!value.trim() || loading}
          aria-label="Send message"
          className={cn(
            "mono flex h-7 shrink-0 items-center gap-1 rounded-md px-2.5 text-[11px] font-medium transition-opacity",
            !value.trim() || loading
              ? "bg-panel-2 text-muted-foreground"
              : "gradient-primary text-primary-foreground shadow-sm hover:opacity-90",
          )}
        >
          <Send className="h-3 w-3" /> Send
        </button>
      </div>
    </div>
  );
}

