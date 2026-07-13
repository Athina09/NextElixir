import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw, Sparkles, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { MessageTimestamp } from "./MessageTimestamp";
import { TypingIndicator } from "./TypingIndicator";
import { CitationCard } from "./CitationCard";
import { ForecastReasoningCard } from "./ForecastReasoningCard";
import { RiskExplanationCard } from "./RiskExplanationCard";
import { BudgetRecommendationCard } from "./BudgetRecommendationCard";
import type { ChatMessage as Msg } from "@/lib/chat-context";
import { useChat } from "@/hooks/useChat";

const KIND_LABEL: Record<string, string> = {
  assistant: "Assistant",
  "forecast-summary": "Forecast Summary",
  "budget-optimization": "Budget Optimization",
  recommendation: "Recommendation",
  risk: "Risk Alert",
  system: "System",
  user: "You",
};

export function ChatMessage({ message }: { message: Msg }) {
  const { retry } = useChat();
  const isUser = message.role === "user";
  const isSystem = message.role === "system";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className={cn("flex gap-3 px-4 py-3", isUser && "bg-panel/40")}
    >
      <div
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-sm border",
          isUser
            ? "border-border bg-panel-2 text-muted-foreground"
            : "border-primary/40 bg-primary/10 text-primary",
        )}
      >
        {isUser ? <User className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <span className="mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            {KIND_LABEL[message.kind] ?? "Assistant"}
          </span>
          {!isUser && message.kind !== "assistant" && message.kind !== "user" && (
            <span
              className={cn(
                "mono rounded-sm px-1.5 py-[1px] text-[9px] uppercase tracking-widest",
                message.kind === "risk"
                  ? "bg-warning/15 text-warning"
                  : message.kind === "budget-optimization"
                    ? "bg-primary/15 text-primary"
                    : "bg-panel-2 text-muted-foreground",
              )}
            >
              AI Generated
            </span>
          )}
          <MessageTimestamp at={message.createdAt} />
        </div>

        {message.status === "pending" ? (
          <TypingIndicator />
        ) : message.status === "error" ? (
          <div className="flex items-center justify-between rounded-sm border border-error/30 bg-error/5 p-2.5">
            <div className="flex items-center gap-2 text-[12px] text-error">
              <AlertTriangle className="h-3.5 w-3.5" />
              {message.text}
            </div>
            <button
              onClick={retry}
              className="mono flex items-center gap-1 rounded-sm bg-panel-2 px-2 py-1 text-[11px] hover:bg-panel-2/70"
            >
              <RefreshCw className="h-3 w-3" /> Retry
            </button>
          </div>
        ) : isSystem ? (
          <p className="mono text-[11.5px] uppercase tracking-widest text-muted-foreground">
            {message.text}
          </p>
        ) : (
          <>
            <MarkdownRenderer source={message.text} />
            {message.payload?.reasoning && (
              <ForecastReasoningCard
                title={message.payload.reasoning.title}
                drivers={message.payload.reasoning.drivers}
              />
            )}
            {message.payload?.risks && <RiskExplanationCard risks={message.payload.risks} />}
            {message.payload?.budget && <BudgetRecommendationCard rows={message.payload.budget} />}
            {message.payload?.citations && <CitationCard citations={message.payload.citations} />}
          </>
        )}
      </div>
    </motion.div>
  );
}
