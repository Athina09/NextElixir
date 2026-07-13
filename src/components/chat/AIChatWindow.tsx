import { useEffect, useRef } from "react";
import { useChat } from "@/hooks/useChat";
import { ChatMessage } from "./ChatMessage";
import { ChatEmptyState } from "./ChatEmptyState";
import { SuggestedQuestions } from "./SuggestedQuestions";
import { ChatInput } from "./ChatInput";

export function AIChatWindow({ dense = false }: { dense?: boolean }) {
  const { active } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [active.messages.length, active.id]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
        {active.messages.length === 0 ? (
          <ChatEmptyState />
        ) : (
          <div className="divide-y divide-border">
            {active.messages.map((m) => (
              <ChatMessage key={m.id} message={m} />
            ))}
          </div>
        )}
      </div>
      <div className="hairline-t bg-panel/60 px-3 py-2">
        <div className="mono mb-1.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          Suggested questions
        </div>
        <SuggestedQuestions compact={dense} />
      </div>
      <ChatInput />
    </div>
  );
}
