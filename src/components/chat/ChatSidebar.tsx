/**
 * Simplified ChatSidebar — slimmer, cleaner conversation list.
 * Keeps functionality, removes visual noise.
 */
import { Plus } from "lucide-react";
import { useChat } from "@/hooks/useChat";
import { ConversationHistory } from "./ConversationHistory";

export function ChatSidebar() {
  const { newConversation } = useChat();
  return (
    <aside className="hairline-r hidden w-[200px] shrink-0 flex-col bg-panel md:flex">
      <div className="hairline-b flex h-12 items-center justify-between px-3">
        <span className="mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          History
        </span>
        <button
          onClick={newConversation}
          title="New conversation"
          className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-panel-2 hover:text-foreground"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-1.5">
        <ConversationHistory />
      </div>
    </aside>
  );
}
