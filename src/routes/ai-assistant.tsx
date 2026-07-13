import { createFileRoute } from "@tanstack/react-router";
import { AIChatWindow } from "@/components/chat/AIChatWindow";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ForecastContextPanel } from "@/components/chat/ForecastContextPanel";

export const Route = createFileRoute("/ai-assistant")({
  head: () => ({
    meta: [
      { title: "AI Assistant · ForecastIQ" },
      {
        name: "description",
        content:
          "Explainable AI assistant for probabilistic revenue forecasting — budget, ROAS, risks, and recommendations in context.",
      },
      { property: "og:title", content: "AI Assistant · ForecastIQ" },
      {
        property: "og:description",
        content:
          "Conversational business reasoning grounded in your live forecast, budget, and campaign data.",
      },
    ],
  }),
  component: AIAssistantPage,
});

function AIAssistantPage() {
  return (
    <div className="flex h-[calc(100dvh-6.5rem)] min-h-0">
      <ChatSidebar />
      <section className="flex min-w-0 flex-1 flex-col bg-background">
        <ChatHeader />
        <div className="grid min-h-0 flex-1 grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="hairline-r flex min-h-0 min-w-0 flex-col">
            <AIChatWindow />
          </div>
          <div className="hidden min-h-0 xl:block">
            <ForecastContextPanel />
          </div>
        </div>
      </section>
    </div>
  );
}
