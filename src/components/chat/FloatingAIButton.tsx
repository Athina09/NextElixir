import { AnimatePresence, motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useChat } from "@/hooks/useChat";
import { AIChatWindow } from "./AIChatWindow";
import { ChatHeader } from "./ChatHeader";
import { ForecastContextPanel } from "./ForecastContextPanel";

export function FloatingAIButton() {
  const { drawerOpen, openDrawer, closeDrawer } = useChat();

  return (
    <>
      <button
        onClick={openDrawer}
        aria-label="Open AI assistant"
        className="mono fixed bottom-5 right-5 z-40 flex h-11 items-center gap-2 rounded-full border border-primary/40 bg-primary/15 pl-3 pr-4 text-[12px] font-medium text-primary shadow-lg backdrop-blur transition-colors hover:bg-primary/25"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Sparkles className="h-3.5 w-3.5" />
        </span>
        Ask AI
      </button>

      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            key="ai-drawer"
            className="fixed inset-0 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/60" onClick={closeDrawer} />
            <motion.aside
              initial={{ x: 60, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 60, opacity: 0 }}
              transition={{ type: "tween", duration: 0.18 }}
              className="hairline-r absolute inset-y-0 right-0 flex w-full max-w-[420px] flex-col bg-background md:w-[420px]"
              role="dialog"
              aria-label="Forecast Assistant"
            >
              <ChatHeader onClose={closeDrawer} compact />
              <div className="flex min-h-0 flex-1 flex-col">
                <div className="hairline-b max-h-[38%] shrink-0 overflow-y-auto">
                  <ForecastContextPanel />
                </div>
                <div className="min-h-0 flex-1">
                  <AIChatWindow dense />
                </div>
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
