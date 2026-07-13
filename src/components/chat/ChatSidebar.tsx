import { Plus } from "lucide-react";
import { useChat } from "@/hooks/useChat";
import { ConversationHistory } from "./ConversationHistory";

export function ChatSidebar() {
  const { newConversation } = useChat();
  return (
    <aside className="hairline-r hidden w-[240px] shrink-0 flex-col bg-panel md:flex">
      <div className="hairline-b flex h-14 items-center justify-between px-3">
        <div className="mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Conversations
        </div>
        <button
          onClick={newConversation}
          className="mono flex items-center gap-1 rounded-sm bg-primary/15 px-2 py-1 text-[11px] text-primary hover:bg-primary/20"
        >
          <Plus className="h-3 w-3" /> New
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        <ConversationHistory />
      </div>
    </aside>
  );
}
