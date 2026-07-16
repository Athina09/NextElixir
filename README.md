# ForecastIQ — Revenue Compass Frontend

> **ForecastIQ** is an AI-powered probabilistic ecommerce revenue forecasting platform built for digital marketing agencies (NetElixir · AIgnition 3.0). It lets analysts simulate media budgets, forecast ROAS with Bayesian confidence intervals, drill into campaign-level performance, and get conversational AI explanations — all before a single rupee of ad spend is committed.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | TanStack Start (React 19, SSR) |
| Routing | TanStack Router (file-based) |
| Data Fetching | TanStack Query |
| Styling | Tailwind CSS v4 |
| UI Primitives | Radix UI (shadcn/ui wrappers) |
| Charts | Recharts |
| Animations | Framer Motion |
| Icons | Lucide React |
| Forms | React Hook Form + Zod |
| Build | Vite 8 + Nitro (Cloudflare Workers target) |
| Fonts | Inter · JetBrains Mono (Google Fonts) |

---

## Getting Started

```bash
# Install dependencies
npm install   # or: bun install

# Start development server
npm run dev

# Build for production
npm run build

# Lint / format
npm run lint
npm run format
```

---

## Application Routes (Pages)

All routes are defined under `src/routes/` using TanStack Router file-based routing.

| Path | File | Title | Description |
|---|---|---|---|
| `/` | `index.tsx` | Dashboard | Main forecast dashboard — KPI strip, forecast hero chart, budget console, AI analyst report, and channel performance table. |
| `/forecasts` | `forecasts.tsx` | Forecasts | Deep-dive probabilistic revenue projections with P10/P50/P90 bands, ROAS distribution, and drill-down tabs (Aggregate → Channel → Campaign Type → Campaign). |
| `/budget-simulator` | `budget-simulator.tsx` | Budget Simulator | Interactive sliders to adjust Google Ads / Meta Ads / Microsoft Ads budgets and forecast horizon; KPIs, chart, and AI insights update in real time. |
| `/scenario-comparison` | `scenario-comparison.tsx` | Scenario Comparison | Side-by-side comparison of two budget scenarios (A vs B) to identify the higher expected-value plan. |
| `/campaign-analytics` | `campaign-analytics.tsx` | Campaign Analytics | Stacked view of Channel Performance, Campaign Type, and Campaign-level efficiency and confidence tables. |
| `/forecast-history` | `forecast-history.tsx` | Forecast History | Audit trail of every forecast run — Run ID, date, budget, Revenue P50, ROAS, confidence, and status (completed / draft / failed). Supports re-run and delete actions. |
| `/reports` | `reports.tsx` | Reports | Generate and download Executive, Forecast, Campaign, and Budget Allocation reports (PDF / CSV / PPT). Includes AI-generated insights panel. |
| `/ai-assistant` | `ai-assistant.tsx` | AI Assistant | Full-screen conversational AI interface with chat window, conversation history, suggested questions, and a live forecast context panel (budget, horizon, KPIs). |
| `/upload` | `upload.tsx` | Upload Data | Drag-and-drop file upload for Google Ads, Meta Ads, Microsoft Ads, GA4, and Shopify CSV exports; includes row-count validation and warning flags. |
| `/settings` | `settings.tsx` | Settings | Configure UI theme, currency, language, AI model version, notification preferences, data connections, and security options. |

### Root Layout

`__root.tsx` wraps every page with:
- `QueryClientProvider` — TanStack Query
- `ThemeProvider` — light / dark / system theming
- `ForecastProvider` — global forecast state (budget, horizon, results, insights)
- `ChatProvider` — AI chat session state
- `AppLayout` — sidebar + topbar shell
- `FloatingAIButton` — persistent floating shortcut to the AI assistant

---

## Component Inventory

### Layout Components (`src/components/`)

| Component | Purpose |
|---|---|
| `AppLayout.tsx` | Root shell — composes `Sidebar`, `Topbar`, `DataStatusBar`, and a `<main>` content area. Also exports `PageContainer` — a reusable page wrapper with title, description, and optional action buttons. |
| `Sidebar.tsx` | Collapsible left navigation sidebar with nav links, active-state highlighting, and mobile overlay support. |
| `Topbar.tsx` | Top app bar — sidebar toggle, breadcrumb/title, theme switcher, and profile area. |
| `DataStatusBar.tsx` | Thin status bar below the topbar showing live data freshness, last-updated timestamp, and sync status. |
| `ThemeSwitcher.tsx` | Toggle between light, dark, and system themes; reads/writes `ThemeProvider` context. |
| `PlatformLogos.tsx` | SVG logo library — `NetElixirLogo`, `ChannelLogo` (Google Ads, Meta Ads, Microsoft Ads, GA4, Shopify), and all other brand marks used throughout the app. |

### Dashboard Components (`src/components/dashboard/`)

| Component | Purpose |
|---|---|
| `ForecastHero.tsx` | Large hero chart panel on the dashboard — renders the primary probabilistic forecast line chart with P10/P50/P90 bands. |
| `MetricStrip.tsx` | Horizontal KPI strip of equal-width stat cells (Revenue P50, ROAS, Growth, Confidence, Campaigns, Model MAPE). |
| `BudgetConsole.tsx` | Compact budget allocation panel on the dashboard — shows per-channel spend and live projected revenue. |
| `AnalystReport.tsx` | AI-generated executive analyst narrative card — streams key takeaways, risks, and recommendations from the forecast context. |

### Chart / Data Components (`src/components/`)

| Component | Purpose |
|---|---|
| `ForecastChart.tsx` | Recharts line chart with probabilistic bands (P10 / P50 / P90) for revenue or ROAS over the selected horizon. Used on Forecasts and Budget Simulator pages. |
| `ForecastDistributionChart.tsx` | Bar / area chart visualizing the revenue probability distribution (posterior density). |
| `BudgetAllocationPie.tsx` | Recharts pie/donut chart showing the share of spend across Google Ads, Meta Ads, and Microsoft Ads. |
| `BudgetSimulator.tsx` | Standalone budget simulator widget (slider-based, used as an embeddable sub-component). |
| `MetricCard.tsx` | Generic KPI card primitive — label, value, delta badge, and optional trend icon. |
| `InsightsPanel.tsx` | AI-generated insights panel — summary narrative, positives, watch flags, and recommendations. Used on the Reports page. |
| `DrillDownTabs.tsx` | Tab bar to switch the Forecasts page drill-down level: Aggregate / Channel / Campaign Type / Campaign. |
| `ChannelPerformanceTable.tsx` | Table showing spend, revenue, ROAS, growth, and confidence per channel (Google Ads, Meta Ads, Microsoft Ads). |
| `CampaignTypeTable.tsx` | Table grouping performance metrics by campaign type (Search, Shopping, PMax, Display, Video, etc.). |
| `CampaignPerformanceTable.tsx` | Granular table of individual campaign metrics — spend, revenue, ROAS, contribution %, and confidence interval. |

### AI Chat Components (`src/components/chat/`)

| Component | Purpose |
|---|---|
| `AIChatWindow.tsx` | Main chat container — renders the message list, typing indicator, and input bar. |
| `ChatHeader.tsx` | Chat page header — model badge, session title, clear-conversation button. |
| `ChatInput.tsx` | Textarea input with send button and keyboard shortcut (Cmd/Ctrl + Enter). |
| `ChatMessage.tsx` | Renders a single chat turn — supports `user`, `assistant`, `risk`, `recommendation`, `forecast-summary`, and `budget-optimization` message kinds. |
| `ChatSidebar.tsx` | Conversation history sidebar listing past chat sessions. |
| `ConversationHistory.tsx` | Scrollable list of past messages within the current session. |
| `ForecastContextPanel.tsx` | Right-side panel on the AI Assistant page — shows live forecast KPIs, current budget allocation, and horizon as grounding context for the AI. |
| `FloatingAIButton.tsx` | Persistent floating action button rendered globally — opens the AI Assistant page from any route. |
| `SuggestedQuestions.tsx` | Chip row of pre-written prompt suggestions (e.g. "Explain this forecast", "Optimize my budget"). |
| `ChatEmptyState.tsx` | Empty state shown when a chat session has no messages yet. |
| `TypingIndicator.tsx` | Animated three-dot indicator shown while the AI is generating a response. |
| `MarkdownRenderer.tsx` | Renders AI response markdown — headings, bold, tables, lists, and code blocks with syntax highlighting. |
| `MessageTimestamp.tsx` | Formatted relative timestamp displayed under each chat message. |
| `CitationCard.tsx` | Inline citation chip — shows model version, dataset name, and detail text sourced from the AI response. |
| `InsightCard.tsx` | Compact card for a single AI-extracted insight bullet. |
| `BudgetRecommendationCard.tsx` | Structured card for `budget-optimization` messages — channel, current spend, proposed spend, delta %, and rationale. |
| `ForecastReasoningCard.tsx` | Inline reasoning breakdown card — shows top forecast drivers with weighted progress bars. |
| `RiskExplanationCard.tsx` | Risk card for `risk`-kind messages — label, severity badge (low / medium / high), and explanatory note. |

### UI Primitives (`src/components/ui/`)

Shadcn/ui component library wrappers over Radix UI primitives. All are stateless, fully accessible, and theme-aware:

`accordion` · `alert-dialog` · `alert` · `aspect-ratio` · `avatar` · `badge` · `breadcrumb` · `button` · `calendar` · `card` · `carousel` · `chart` · `checkbox` · `collapsible` · `command` · `context-menu` · `dialog` · `drawer` · `dropdown-menu` · `form` · `hover-card` · `input-otp` · `input` · `label` · `menubar` · `navigation-menu` · `pagination` · `popover` · `progress` · `radio-group` · `resizable` · `scroll-area` · `select` · `separator` · `sheet` · `sidebar` · `skeleton` · `slider` · `sonner` · `switch` · `table` · `tabs` · `textarea` · `toggle-group` · `toggle` · `tooltip`

---

## Services

### `src/services/chatService.ts`

Mock AI service that generates deterministic business explanations from the live forecast context. **No external API call is made** — all responses are computed client-side and returned after a simulated 1.2–1.8 s delay.

#### `generateResponse(prompt, ctx): Promise<AssistantPayload>`

Routes the user's free-text prompt to a canned response generator based on intent detection:

| Detected Intent | Trigger keywords | Response type |
|---|---|---|
| `forecast-summary` | explain, summary, why, revenue, roas, confidence | P10/P50/P90 table + reasoning drivers |
| `risk` | risk, anomaly, warning, danger | Risk card list (low / medium / high severity) |
| `budget-optimization` | optimize, reallocate, rebalance, shift budget | Budget delta table per channel + rationale |
| `recommendation` | recommend, suggest, advice, should I | Ordered action list |
| `assistant` | _(fallback)_ | Generic canned insight + prompt for specificity |

#### `AssistantPayload` shape

```ts
{
  kind: MessageKind;
  markdown: string;
  citations?: ChatCitation[];
  reasoning?: { title: string; drivers: { label: string; value: string; weight: number }[] };
  risks?: { label: string; severity: "low" | "medium" | "high"; note: string }[];
  budget?: { channel: string; current: number; proposed: number; delta: number; rationale: string }[];
}
```

#### `SUGGESTED_QUESTIONS`

Exported array of 12 pre-written prompt chips shown in `SuggestedQuestions.tsx`:

```
"Explain this forecast"     "Optimize my budget"        "Why is ROAS decreasing?"
"What are the biggest risks?" "Show campaign insights"  "Find anomalies"
"Increase revenue"          "Improve confidence"        "Generate executive summary"
"Best performing channel"   "Worst performing campaign" "Seasonality impact"
```

---

## Hooks

| Hook | File | Purpose |
|---|---|---|
| `useChat` | `src/hooks/useChat.ts` | Re-exports chat context for use in components. |
| `useIsMobile` | `src/hooks/use-mobile.tsx` | Returns `true` when viewport width < 768 px; used for responsive sidebar toggling. |

---

## Global State (Context Providers)

| Provider | File | State it owns |
|---|---|---|
| `ForecastProvider` | `src/lib/forecast-context` | `budget` (per-channel), `horizon` (30/60/90 days), `forecast` (P10/P50/P90 revenue + ROAS + confidence + campaigns), `insights`, `loading`, `insightsLoading`. Exposes a `dispatch` reducer and a `refresh()` helper to re-run the model. |
| `ChatProvider` | `src/lib/chat-context` | Conversation messages, loading state, send-message action. |
| `ThemeProvider` | `src/lib/theme-context` | Active theme (`light` / `dark` / `system`), persisted to `localStorage`. |

---

## Data Sources (Upload page)

The `/upload` page accepts CSV exports from the following platforms:

| Platform | Typical filename |
|---|---|
| Google Ads | `google_ads_*.csv` |
| Meta Ads | `meta_campaigns_export.csv` |
| Microsoft Ads | `bing_ads_*.csv` |
| GA4 | `ga4_ecommerce_events.csv` |
| Shopify | `shopify_orders_*.csv` |

Expected CSV columns: `date`, `campaign`, `channel`, `spend`, `revenue`, `roas`.

---

## Project Structure

```
revenue-compass/
├── src/
│   ├── routes/                     # File-based pages (TanStack Router)
│   │   ├── __root.tsx              # Root layout + global providers
│   │   ├── index.tsx               # /  — Dashboard
│   │   ├── forecasts.tsx           # /forecasts
│   │   ├── budget-simulator.tsx    # /budget-simulator
│   │   ├── scenario-comparison.tsx # /scenario-comparison
│   │   ├── campaign-analytics.tsx  # /campaign-analytics
│   │   ├── forecast-history.tsx    # /forecast-history
│   │   ├── reports.tsx             # /reports
│   │   ├── ai-assistant.tsx        # /ai-assistant
│   │   ├── upload.tsx              # /upload
│   │   └── settings.tsx            # /settings
│   ├── components/
│   │   ├── dashboard/              # Dashboard-specific components
│   │   ├── chat/                   # AI chat UI components
│   │   ├── ui/                     # Shadcn/ui primitives (46 components)
│   │   └── *.tsx                   # Shared chart + table components
│   ├── services/
│   │   └── chatService.ts          # Mock AI response generator
│   ├── hooks/                      # Custom React hooks
│   ├── lib/                        # Contexts, forecast engine, formatters
│   ├── styles.css                  # Global Tailwind + design token overrides
│   ├── router.tsx                  # Router configuration
│   ├── routeTree.gen.ts            # Auto-generated route tree
│   └── server.ts                   # Cloudflare Workers server entry
├── public/                         # Static assets
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## Design System Notes

- **Color tokens** — Semantic CSS variables (`--primary`, `--muted-foreground`, `--success`, `--warning`, `--error`, `--border`, `--panel-2`) defined in `styles.css`.
- **Typography** — `Inter` for UI text; `JetBrains Mono` (via `.mono` utility class) for all numeric / code / label contexts.
- **Gradients** — `.gradient-primary` utility applied to CTAs, active states, and accent elements.
- **Dark mode** — Default theme; `<html class="dark">` set in the root shell.
- **Animations** — Framer Motion `motion.div` for content reveals; CSS `animate-pulse` for loading states.
