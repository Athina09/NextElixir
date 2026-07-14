/**
 * ConversationHistory — simplified.
 * Tighter, cleaner conversation list items with no message count badge.
 */
import { MessageSquare } from "lucide-react";
import { useChat } from "@/hooks/useChat";
import type { Conversation } from "@/lib/chat-context";
import { cn } from "@/lib/utils";

const BUCKET_LABEL = { today: "Today", yesterday: "Yesterday", week: "This week" } as const;

export function ConversationHistory() {
  const { conversations, activeId, selectConversation } = useChat();
  const buckets: Record<Conversation["bucket"], Conversation[]> = {
    today: [],
    yesterday: [],
    week: [],
  };
  conversations.forEach((c) => buckets[c.bucket].push(c));

  return (
    <div className="flex flex-col gap-2 py-1">
      {(Object.keys(buckets) as (keyof typeof buckets)[]).map((k) =>
        buckets[k].length ? (
          <div key={k}>
            <div className="mono px-2 pb-1 text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
              {BUCKET_LABEL[k]}
            </div>
            <ul className="space-y-0.5">
              {buckets[k].map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => selectConversation(c.id)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[11.5px] transition-colors",
                      c.id === activeId
                        ? "bg-primary/10 text-foreground"
                        : "text-muted-foreground hover:bg-panel-2 hover:text-foreground",
                    )}
                  >
                    <MessageSquare className="h-3 w-3 shrink-0 text-primary/60" />
                    <span className="min-w-0 flex-1 truncate">{c.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null,
      )}
    </div>
  );
}
