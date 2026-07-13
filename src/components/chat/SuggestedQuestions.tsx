import { SUGGESTED_QUESTIONS } from "@/services/chatService";
import { useChat } from "@/hooks/useChat";
import { motion } from "framer-motion";

export function SuggestedQuestions({ compact = false }: { compact?: boolean }) {
  const { send, loading } = useChat();
  const items = compact ? SUGGESTED_QUESTIONS.slice(0, 6) : SUGGESTED_QUESTIONS;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((q, i) => (
        <motion.button
          key={q}
          type="button"
          disabled={loading}
          onClick={() => send(q)}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.02 }}
          className="mono hairline-b rounded-sm bg-panel-2/60 px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-panel-2 hover:text-foreground disabled:opacity-50"
        >
          {q}
        </motion.button>
      ))}
    </div>
  );
}
