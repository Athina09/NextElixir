import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import { useRouterState } from "@tanstack/react-router";
import { useChat } from "@/hooks/useChat";
import { AIChatWindow } from "./AIChatWindow";

export function FloatingAIButton() {
  const { drawerOpen, openDrawer, closeDrawer } = useChat();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // The AI Assistant page is itself the full chat experience — a floating
  // trigger there would just duplicate it.
  if (pathname.startsWith("/ai-assistant")) return null;

  return (
    <>
      {/* Floating trigger button — kept visually secondary (outline, not the
          solid gradient pill) so it doesn't compete with in-page "Ask AI to
          optimize" CTAs that use the primary gradient treatment. */}
      <button
        onClick={openDrawer}
        aria-label="Open AI assistant"
        className="mono fixed bottom-5 right-5 z-40 flex h-10 items-center gap-2 rounded-full border border-border bg-panel/95 pl-3 pr-4 text-[12px] font-medium text-foreground shadow-lg backdrop-blur transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        <Sparkles className="h-3.5 w-3.5 text-primary" strokeWidth={2.25} />
        Ask AI
      </button>

      {/* Compact popup widget — bottom-right corner */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            key="ai-popup"
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ type: "tween", duration: 0.15 }}
            className="fixed bottom-[72px] right-5 z-50 flex w-[320px] flex-col overflow-hidden rounded-xl border border-border bg-panel shadow-2xl"
            style={{ height: "440px" }}
            role="dialog"
            aria-label="ForecastIQ AI"
          >
            {/* Minimal header */}
            <div className="hairline-b flex h-11 shrink-0 items-center gap-2.5 px-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md gradient-primary text-primary-foreground">
                <Sparkles className="h-3 w-3" strokeWidth={2.5} />
              </div>
              <span className="flex-1 text-[13px] font-semibold tracking-tight">ForecastIQ AI</span>
              <span className="mono rounded-sm bg-primary/15 px-1.5 py-[1px] text-[9px] uppercase tracking-widest text-primary">
                AI
              </span>
              <button
                onClick={closeDrawer}
                aria-label="Close"
                className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-panel-2 hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
            </div>

            {/* Chat window — fills remaining space */}
            <div className="min-h-0 flex-1">
              <AIChatWindow dense />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
