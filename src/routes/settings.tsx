import { createFileRoute } from "@tanstack/react-router";
import { PageContainer } from "@/components/AppLayout";
import { useState } from "react";
import {
  Palette, Brain, Globe, Bell, Shield, Database,
  ChevronRight, Check, Cpu, RefreshCw, AlertTriangle,
} from "lucide-react";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { NetElixirLogo } from "@/components/PlatformLogos";
import { MODEL_METRICS, formatMape } from "@/lib/model-metrics";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings · ForecastIQ" },
      { name: "description", content: "Configure defaults, currency, language, and active model version." },
    ],
  }),
  component: SettingsPage,
});

/* ── Reusable primitives ─────────────────────── */
function Section({ icon, title, description, children }: {
  icon: React.ReactNode; title: string; description?: string; children: React.ReactNode;
}) {
  return (
    <div className="panel flex h-full flex-col">
      {/* Section header */}
      <div className="hairline-b flex items-center gap-3 px-5 py-4 shrink-0">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg gradient-primary text-primary-foreground">
          {icon}
        </div>
        <div>
          <div className="text-[13px] font-semibold tracking-tight">{title}</div>
          {description && (
            <div className="mt-0.5 text-[11px] text-muted-foreground">{description}</div>
          )}
        </div>
      </div>
      <div className="divide-y divide-border flex-1">{children}</div>
    </div>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-6 px-5 py-3.5">
      <div className="min-w-0">
        <div className="text-[12.5px] font-medium text-foreground">{label}</div>
        {hint && <div className="mt-0.5 text-[11px] text-muted-foreground">{hint}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
        enabled ? "gradient-primary" : "bg-panel-2 border border-border"
      }`}
    >
      <span
        className={`h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
          enabled ? "translate-x-4" : "translate-x-1"
        }`}
      />
    </button>
  );
}

function Select({ value, onChange, options }: {
  value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="mono rounded-md border border-border bg-panel-2/60 px-2.5 py-1.5 text-[11.5px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary/60"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

function HorizonPills({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-1">
      {["30D", "60D", "90D"].map((h) => (
        <button
          key={h}
          onClick={() => onChange(h)}
          className={`mono rounded-md px-3 py-1.5 text-[11px] font-medium transition-colors ${
            value === h
              ? "gradient-primary text-primary-foreground"
              : "border border-border bg-panel-2/60 text-muted-foreground hover:text-foreground"
          }`}
        >
          {h}
        </button>
      ))}
    </div>
  );
}

/* ── Page ────────────────────────────────────── */
function SettingsPage() {
  const [currency, setCurrency]   = useState("INR");
  const [language, setLanguage]   = useState("en-IN");
  const [model, setModel]         = useState("bayesian-v421");
  const [horizon, setHorizon]     = useState("60D");
  const [notifications, setNotifications] = useState({
    forecastReady: true,
    anomalyAlerts: true,
    weeklyDigest:  false,
    budgetAlerts:  true,
  });
  const [privacy, setPrivacy] = useState({
    telemetry:   true,
    crashReport: true,
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <PageContainer
      title="Settings"
      description="Workspace preferences, forecast engine, and notification configuration."
      actions={
        <>
          <button className="mono rounded-md border border-border bg-panel-2/60 px-4 py-2 text-[11.5px] text-muted-foreground hover:text-foreground transition-colors">
            Reset to defaults
          </button>
          <button
            onClick={handleSave}
            className={`mono flex items-center gap-2 rounded-md px-4 py-2 text-[11.5px] font-medium transition-all ${
              saved
                ? "bg-success/20 text-success border border-success/30"
                : "gradient-primary text-primary-foreground shadow-sm hover:opacity-90"
            }`}
          >
            {saved ? (
              <><Check className="h-3.5 w-3.5" /> Saved!</>
            ) : (
              "Save changes"
            )}
          </button>
        </>
      }
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">

        {/* ── Left: main settings ─────────────────── */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Appearance */}
          <Section
            icon={<Palette className="h-4 w-4" />}
            title="Appearance"
            description="Theme, color accent, and display preferences"
          >
            <Row label="Color Theme" hint="Changes the entire interface color scheme instantly">
              <ThemeSwitcher />
            </Row>
            <Row label="Currency" hint="Applied across all metric cards, charts, and exports">
              <Select
                value={currency}
                onChange={setCurrency}
                options={[
                  { value: "INR", label: "INR (₹) — Indian Rupee" },
                  { value: "USD", label: "USD ($) — US Dollar" },
                  { value: "EUR", label: "EUR (€) — Euro" },
                  { value: "GBP", label: "GBP (£) — British Pound" },
                ]}
              />
            </Row>
            <Row label="Language & Region" hint="Affects number formatting and date display">
              <Select
                value={language}
                onChange={setLanguage}
                options={[
                  { value: "en-IN", label: "English (India)" },
                  { value: "en-US", label: "English (US)" },
                  { value: "en-GB", label: "English (UK)" },
                ]}
              />
            </Row>
          </Section>

          {/* Forecast engine */}
          <Section
            icon={<Brain className="h-4 w-4" />}
            title="Forecast Engine"
            description="Model version, default horizon, and inference settings"
          >
            <Row label="Default Forecast Horizon" hint="Applied when opening a new forecast session">
              <HorizonPills value={horizon} onChange={setHorizon} />
            </Row>
            <Row label="Active Model" hint="Bayesian hierarchical ensemble with MMM co-inference">
              <Select
                value={model}
                onChange={setModel}
                options={[
                  { value: "bayesian-v421", label: "Bayesian Hierarchical v4.2.1" },
                  { value: "lgbm-v380",     label: "Gradient Boosted (LGBM) v3.8.0" },
                  { value: "nss-v210beta",  label: "Neural State-Space v2.1.0-beta" },
                ]}
              />
            </Row>
            <Row label="Posterior Sampling" hint="Number of MCMC samples used per inference run">
              <Select
                value="2000"
                onChange={() => {}}
                options={[
                  { value: "500",  label: "500 samples (fast)" },
                  { value: "1000", label: "1,000 samples" },
                  { value: "2000", label: "2,000 samples (default)" },
                  { value: "4000", label: "4,000 samples (precise)" },
                ]}
              />
            </Row>
          </Section>

          {/* Notifications */}
          <Section
            icon={<Bell className="h-4 w-4" />}
            title="Notifications"
            description="Control which alerts and digests you receive"
          >
            {([
              { key: "forecastReady" as const, label: "Forecast ready",   hint: "Notify when a new forecast completes" },
              { key: "anomalyAlerts" as const, label: "Anomaly alerts",   hint: "Detect unexpected spend or ROAS shifts" },
              { key: "weeklyDigest" as const,  label: "Weekly digest",    hint: "Summary email every Monday morning" },
              { key: "budgetAlerts" as const,  label: "Budget threshold", hint: "Alert when spend exceeds 90% of cap" },
            ]).map((n) => (
              <Row key={n.key} label={n.label} hint={n.hint}>
                <Toggle
                  enabled={notifications[n.key]}
                  onChange={(v) => setNotifications((p) => ({ ...p, [n.key]: v }))}
                />
              </Row>
            ))}
          </Section>

          {/* Privacy */}
          <Section
            icon={<Shield className="h-4 w-4" />}
            title="Privacy & Data"
            description="Control usage data sent to NetElixir"
          >
            <Row label="Usage telemetry" hint="Helps us improve model accuracy and product quality">
              <Toggle enabled={privacy.telemetry} onChange={(v) => setPrivacy((p) => ({ ...p, telemetry: v }))} />
            </Row>
            <Row label="Crash reports" hint="Automatically send error logs for debugging">
              <Toggle enabled={privacy.crashReport} onChange={(v) => setPrivacy((p) => ({ ...p, crashReport: v }))} />
            </Row>
          </Section>
        </div>

        {/* ── Right: info sidebar ──────────────────── */}
        <div className="grid h-full grid-rows-[auto_auto_1fr] gap-4">

          {/* Platform identity card */}
          <div className="panel overflow-hidden">
            <div className="gradient-primary p-5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
                  <NetElixirLogo size={18} />
                </div>
                <div>
                  <div className="text-[14px] font-bold text-white">ForecastIQ</div>
                  <div className="text-[10px] text-white/70 uppercase tracking-widest">by NetElixir</div>
                </div>
              </div>
            </div>
            <div className="divide-y divide-border px-4">
              {[
                { label: "Version",      value: "4.2.1" },
                { label: "Model API",    value: "Bayesian HMC" },
                { label: "Data source",  value: "acme_retail_2024_06" },
                { label: "Environment",  value: "Production" },
              ].map((r) => (
                <div key={r.label} className="flex items-center justify-between py-2.5">
                  <span className="mono text-[10.5px] text-muted-foreground">{r.label}</span>
                  <span className="mono text-[11px] font-medium text-foreground">{r.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Model health card */}
          <div className="panel p-4">
            <div className="mono mb-3 flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              <Cpu className="h-3 w-3 text-primary" /> Model Health
            </div>
            <div className="space-y-2.5">
              {[
                { label: "Revenue MAPE", value: formatMape(MODEL_METRICS.revenue.mape), good: false },
                { label: "ROAS MAPE", value: formatMape(MODEL_METRICS.roas.mape), good: false },
                { label: "Revenue R²", value: MODEL_METRICS.revenue.r2.toFixed(2), good: true },
                { label: "Holdout rows", value: String(MODEL_METRICS.testRows), good: true },
                { label: "Last retrained", value: MODEL_METRICS.trainedAt.slice(0, 10), good: true },
              ].map((m) => (
                <div key={m.label} className="flex items-center justify-between">
                  <span className="text-[11.5px] text-muted-foreground">{m.label}</span>
                  <span className={`mono text-[11.5px] font-semibold ${m.good ? "text-success" : "text-warning"}`}>
                    {m.value}
                  </span>
                </div>
              ))}
            </div>
            <button className="mono mt-4 flex w-full items-center justify-center gap-1.5 rounded-md border border-border bg-panel-2/60 py-2 text-[11px] text-muted-foreground hover:text-foreground transition-colors">
              <RefreshCw className="h-3 w-3" /> Retrain model
            </button>
          </div>

          {/* Connected sources */}
          <div className="panel flex flex-1 flex-col p-4">
            <div className="mono mb-3 flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              <Database className="h-3 w-3 text-primary" /> Data Sources
            </div>
            <div className="space-y-2">
              {[
                { name: "Google Ads",    status: "connected",    rows: "42K rows" },
                { name: "Meta Ads",      status: "connected",    rows: "38K rows" },
                { name: "Microsoft Ads", status: "connected",    rows: "12K rows" },
                { name: "Shopify",       status: "connected",    rows: "1,238 orders" },
                { name: "GA4",           status: "warning",      rows: "Partial sync" },
              ].map((s) => (
                <div key={s.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`h-1.5 w-1.5 rounded-full ${
                      s.status === "connected" ? "bg-success" : "bg-warning animate-pulse"
                    }`} />
                    <span className="text-[12px] text-foreground">{s.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="mono text-[10px] text-muted-foreground">{s.rows}</span>
                    {s.status === "warning" && (
                      <AlertTriangle className="h-3 w-3 text-warning" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </PageContainer>
  );
}
