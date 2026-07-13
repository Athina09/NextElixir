import { useEffect, useRef, useState } from "react";
import { Mic, Paperclip, Send } from "lucide-react";
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
      <div className="hairline-b flex items-end gap-2 rounded-sm bg-panel-2/60 p-2">
        <button
          type="button"
          disabled
          aria-label="Attach file"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm text-muted-foreground/40"
        >
          <Paperclip className="h-3.5 w-3.5" />
        </button>
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
          placeholder="Ask anything about your forecast..."
          rows={1}
          aria-label="Chat message"
          className="mono max-h-40 min-h-[28px] flex-1 resize-none bg-transparent px-1 py-1 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
        <button
          type="button"
          disabled
          aria-label="Voice input"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm text-muted-foreground/40"
        >
          <Mic className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={!value.trim() || loading}
          aria-label="Send message"
          className={cn(
            "mono flex h-7 shrink-0 items-center gap-1.5 rounded-sm px-2.5 text-[11px] font-medium transition-colors",
            !value.trim() || loading
              ? "bg-panel-2 text-muted-foreground"
              : "bg-primary text-primary-foreground hover:bg-primary/90",
          )}
        >
          <Send className="h-3 w-3" /> Send
        </button>
      </div>
      <div className="mono mt-1.5 flex items-center justify-between px-1 text-[10px] text-muted-foreground">
        <span>Enter to send · Shift+Enter for newline</span>
        <span>Ctrl+/ focus</span>
      </div>
    </div>
  );
}
