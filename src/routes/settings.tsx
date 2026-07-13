import { createFileRoute } from "@tanstack/react-router";
import { PageContainer } from "@/components/AppLayout";
import { useState } from "react";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings · ForecastIQ" },
      { name: "description", content: "Configure defaults, currency, language, and active model version." },
    ],
  }),
  component: SettingsPage,
});

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="hairline-b grid grid-cols-1 gap-2 py-4 md:grid-cols-[240px_minmax(0,1fr)]">
      <div>
        <div className="text-[12.5px] font-medium">{label}</div>
        {hint ? <div className="mt-0.5 text-[11px] text-muted-foreground">{hint}</div> : null}
      </div>
      <div>{children}</div>
    </div>
  );
}

function SettingsPage() {
  const [theme, setTheme] = useState("Dark · Terminal");
  const [currency, setCurrency] = useState("INR (₹)");
  const [language, setLanguage] = useState("English (India)");
  const [model, setModel] = useState("Bayesian Hierarchical v4.2.1");
  const [horizon, setHorizon] = useState("60D");

  return (
    <PageContainer
      title="Settings"
      description="Workspace defaults and forecast engine configuration."
    >
      <div className="panel px-4">
        <Field label="Theme" hint="Interface color scheme.">
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className="mono hairline-b w-full max-w-xs rounded-sm bg-panel-2 px-2 py-1.5 text-[12px]"
          >
            <option>Dark · Terminal</option>
            <option>Dark · Muted</option>
          </select>
        </Field>
        <Field label="Forecast horizon default" hint="Default projection window on new forecasts.">
          <div className="inline-flex hairline-b rounded-sm bg-panel-2/60 p-0.5">
            {["30D", "60D", "90D"].map((h) => (
              <button
                key={h}
                onClick={() => setHorizon(h)}
                className={`mono px-3 py-1 text-[11px] ${
                  horizon === h
                    ? "rounded-sm bg-primary/20 text-primary"
                    : "text-muted-foreground"
                }`}
              >
                {h}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Currency" hint="Applied across every metric card and export.">
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="mono hairline-b w-full max-w-xs rounded-sm bg-panel-2 px-2 py-1.5 text-[12px]"
          >
            <option>INR (₹)</option>
            <option>USD ($)</option>
            <option>EUR (€)</option>
          </select>
        </Field>
        <Field label="Language">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="mono hairline-b w-full max-w-xs rounded-sm bg-panel-2 px-2 py-1.5 text-[12px]"
          >
            <option>English (India)</option>
            <option>English (US)</option>
          </select>
        </Field>
        <Field
          label="Active model version"
          hint="Bayesian hierarchical ensemble with attribution + MMM co-inference."
        >
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="mono hairline-b w-full max-w-md rounded-sm bg-panel-2 px-2 py-1.5 text-[12px]"
          >
            <option>Bayesian Hierarchical v4.2.1</option>
            <option>Gradient Boosted (LGBM) v3.8.0</option>
            <option>Neural State-Space v2.1.0-beta</option>
          </select>
        </Field>
        <div className="flex justify-end gap-2 py-4">
          <button className="mono hairline-b rounded-sm bg-panel-2 px-3 py-1.5 text-[11px] text-muted-foreground">
            Cancel
          </button>
          <button className="mono rounded-md gradient-primary px-3 py-1.5 text-[11px] font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90">
            Save changes
          </button>
        </div>
      </div>
    </PageContainer>
  );
}
