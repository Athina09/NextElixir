import { BookOpen } from "lucide-react";
import type { ChatCitation } from "@/services/chatService";

export function CitationCard({ citations }: { citations: ChatCitation[] }) {
  if (!citations?.length) return null;
  return (
    <div className="mt-2 rounded-sm border border-border bg-panel-2/40 p-2.5">
      <div className="mono mb-1.5 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        <BookOpen className="h-3 w-3" /> Sources
      </div>
      <ul className="space-y-1">
        {citations.map((c, i) => (
          <li key={i} className="flex items-start justify-between gap-3 text-[11.5px]">
            <span className="text-foreground">{c.label}</span>
            <span className="mono text-right text-muted-foreground">
              {c.source}
              {c.detail ? <span className="block text-[10px]">{c.detail}</span> : null}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
