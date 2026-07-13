import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AppLayout } from "@/components/AppLayout";
import { ForecastProvider } from "@/lib/forecast-context";
import { ChatProvider } from "@/lib/chat-context";
import { FloatingAIButton } from "@/components/chat/FloatingAIButton";

function NotFoundComponent() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <div className="mono text-[10px] uppercase tracking-widest text-muted-foreground">
          ForecastIQ · error
        </div>
        <h1 className="mono mt-2 text-6xl font-semibold text-foreground">404</h1>
        <h2 className="mt-3 text-lg font-semibold">Route not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The workspace you're looking for doesn't exist in this session.
        </p>
        <Link
          to="/"
          className="mono mt-5 inline-flex items-center rounded-sm bg-primary px-3 py-1.5 text-[12px] font-medium text-primary-foreground hover:bg-primary/90"
        >
          → Return to dashboard
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <div className="mono text-[10px] uppercase tracking-widest text-error">
          ForecastIQ · runtime error
        </div>
        <h1 className="mt-2 text-xl font-semibold">Forecast engine failure</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The current view could not be rendered. Retry the request or return to the dashboard.
        </p>
        <div className="mt-5 flex justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="mono rounded-sm bg-primary px-3 py-1.5 text-[12px] text-primary-foreground hover:bg-primary/90"
          >
            → Retry
          </button>
          <a
            href="/"
            className="mono rounded-sm border border-border bg-panel-2 px-3 py-1.5 text-[12px] hover:bg-panel-2/70"
          >
            → Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "ForecastIQ · Probabilistic Ecommerce Revenue Forecasting" },
      {
        name: "description",
        content:
          "ForecastIQ is an AI-powered probabilistic ecommerce revenue forecasting platform for digital marketing agencies. Simulate budgets, forecast ROAS, and explain risk before ad spend is committed.",
      },
      { name: "author", content: "NetElixir · AIgnition 3.0" },
      { property: "og:title", content: "ForecastIQ · Probabilistic Revenue Forecasting" },
      {
        property: "og:description",
        content:
          "Forecast ecommerce revenue and ROAS with probabilistic AI. Built for marketing analysts.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <ForecastProvider>
        <ChatProvider>
          <AppLayout>
            <Outlet />
          </AppLayout>
          <FloatingAIButton />
        </ChatProvider>
      </ForecastProvider>
    </QueryClientProvider>
  );
}
