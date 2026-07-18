# ForecastIQ Backend — AIgnition 3.0

> **NetElixir · AIgnition 3.0 Hackathon Submission**  
> Probabilistic ecommerce revenue forecasting from media budget inputs.

Two entry points:

| Script | Purpose |
|---|---|
| [`run.sh`](run.sh) | **Hackathon grading** — offline features → `predictions.csv` (no network / DB / LLM) |
| [`run.bat`](run.bat) / [`run_api.sh`](run_api.sh) | **Full FastAPI** — dashboard API, upload validation, reports, optional AI chat |

---

## Quick start (grading machine)

```bash
pip install -r requirements.txt
bash run.sh [DATA_DIR] [MODEL_PATH] [OUTPUT_PATH]
# defaults: ./data  ./pickle/model.pkl  ./output/predictions.csv
```

All three arguments are optional and positional. The script:

1. Reads every CSV in `DATA_DIR` (no hardcoded filenames — the grading machine may rename them)
2. Detects each platform by column signature (Google Ads / Meta Ads / Microsoft/Bing Ads)
3. Normalises into a unified schema and builds features
4. Loads `MODEL_PATH` (pre-trained LightGBM quantile models) — **never retrains**
5. Writes aggregate/channel/campaign-type/campaign forecasts for 30-, 60-, and 90-day horizons to `OUTPUT_PATH`

No network calls. No database. No interactive prompts. No absolute paths.

---

## Quick start (full FastAPI dashboard)

### macOS / Linux

```bash
bash run_api.sh
# API: http://localhost:8000  ·  Docs: http://localhost:8000/docs
```

### Windows

```bat
run.bat
```

`run_api.sh` / `run.bat` create `.venv` if needed, install deps, and default `DATABASE_URL` to an **absolute** SQLite path (`…/backend/forecastiq_dev.db`) so forecast-history / report metadata writes work regardless of cwd.

Optional AI chat / insights — copy env and set a key:

```bash
cp .env.example .env
# Prefer Groq; Gemini is the fallback when GROQ_API_KEY is empty
# GROQ_API_KEY=…   GROQ_MODEL=llama-3.1-8b-instant   # free-tier friendly
# GEMINI_API_KEY=… GEMINI_MODEL=gemini-2.0-flash-lite
```

| Env | Role |
|---|---|
| `GROQ_API_KEY` | Primary LLM for `/chat` and `/insights` |
| `GEMINI_API_KEY` | Fallback LLM if Groq is unset / unavailable |
| `DATABASE_URL` | SQLite (default) or Postgres |
| `CORS_ORIGINS` | Browser origins; in **development**, any `localhost` / `127.0.0.1` port is also allowed |

Without an LLM key, `/chat` and `/insights` return **HTTP 503**. Forecast, upload, validation, simulation, and report **numbers** still work.

**macOS note:** LightGBM needs OpenMP — `brew install libomp` if import fails.  
**Corporate proxy / custom CA:** if `~/mac-ca.pem` exists, `run_api.sh` sets `SSL_CERT_FILE` for Groq/Gemini HTTPS.

Docker / Postgres (optional):

```bash
# from repo root
docker compose up -d db
# DATABASE_URL=postgresql+psycopg2://forecastiq:forecastiq@localhost:5432/forecastiq
```

---

## Requirements

- Python 3.13 (dependencies pinned in `requirements.txt`)
- `bash` (Linux grading machine; Git Bash on Windows for `run.sh`)

---

## Model accuracy (committed pickle)

Held-out **time-based 80/20** backtest from `pickle/model.pkl`:

| Target | MAE | RMSE | MAPE | R² |
|---|---|---|---|---|
| **Revenue** | 1,404 | 7,756 | **28.4%** | **0.93** |
| **ROAS** | 1.30 | 7.57 | **32.9%** | 0.23 |

Also exposed at `GET /health` → `revenue_metrics` / `roas_metrics`.

> Displayed ROAS in forecasts is derived as `revenue_quantile / spend` so revenue and ROAS never contradict. The independently trained ROAS model is kept for health metrics only.

---

## Dataset (`data/`)

| File | Rows (approx.) | Notes |
|---|---|---|
| `google_ads_campaign_stats.csv` | ~19,272 | Cost in micros → currency; has conversions_value |
| `meta_ads_campaign_stats.csv` | ~3,417 | `conversion` used as revenue proxy (`is_revenue_estimated`) |
| `bing_campaign_stats.csv` | ~2,873 | Microsoft Ads |

Ingestion **globs all `*.csv`** and detects platform by column signature — no hardcoded filenames (grading-safe). Extra uploads (e.g. Samsung / Microsoft campaign exports) are accepted the same way via `POST /datasets/upload`.

---

## Reports

Reports share one content builder (`forecastiq/reports/content.py`) and render to PDF / Excel / CSV.

| Source | Endpoint | Contents (high level) |
|---|---|---|
| **Upload Data** page | `GET /datasets/report?format=excel\|pdf\|csv` | Data quality: summary KPIs, upload history, coverage by channel/type, daily activity sample, top campaigns, full validation issues + recommended actions |
| **Reports** page | `POST /reports` | `executive` / `forecast` / `campaign` / `budget` — scenario overview, KPI snapshot, forecast bands, channel & type tables, timeline/distribution samples, campaign ROAS leaders, methodology notes; AI narrative when an LLM key is set |

Excel exports auto-widen columns and wrap long messages so codes are not clipped.

---

## Repository layout

```
backend/
├── run.sh                    # grading entry point (offline predictions.csv)
├── run.bat / run_api.sh      # full FastAPI dashboard service
├── requirements.txt          # pinned deps (Python 3.13)
├── README.md                 # this file
├── .env.example              # Groq / Gemini / DB / CORS
├── Dockerfile                # FastAPI service container
├── train.py                  # offline retraining (never run at grading time)
├── data/
│   ├── google_ads_campaign_stats.csv
│   ├── meta_ads_campaign_stats.csv
│   └── bing_campaign_stats.csv
├── pickle/
│   └── model.pkl             # committed pre-trained artifact
├── output/
│   └── predictions.csv       # written by run.sh
├── scripts/
│   ├── generate_features.py  # run.sh step 1 (thin wrapper)
│   ├── predict.py            # run.sh step 2
│   └── validate_submission.py
└── src/
    ├── generate_features.py  # re-exported (guide example layout)
    ├── predict.py
    └── forecastiq/
        ├── core/             # config, logging
        ├── data/             # ingestion, schema, validation
        ├── features/         # feature engineering
        ├── models/           # pipeline, training, forecasting, anomaly, explainability, simulation
        ├── submission/       # output_schema.py — predictions.csv columns
        ├── llm/              # Groq + Gemini clients, insights, chat (not used in run.sh)
        ├── db/               # SQLAlchemy models (not used in run.sh)
        ├── schemas/          # Pydantic API schemas (not used in run.sh)
        ├── api/              # FastAPI routers (not used in run.sh)
        └── reports/          # PDF/Excel/CSV generation (not used in run.sh)
```

---

## API surface (FastAPI)

| Method | Route | Notes |
|---|---|---|
| `GET` | `/health` | Model loaded + backtest metrics |
| `POST` | `/forecast` | Probabilistic forecast (no LLM) |
| `POST` | `/simulate` | Budget simulation |
| `POST` | `/chat` | AI assistant (needs Groq or Gemini key) |
| `POST` | `/insights` | AI narrative (needs key) |
| `POST` | `/datasets/upload` | CSV ingest |
| `GET` | `/validation` | Data validation report (JSON) |
| `GET` | `/datasets/report` | Downloadable data-quality report |
| `GET/DELETE/POST` | `/forecast-runs…` | History (best-effort persist if SQLite is writable) |
| `POST` | `/reports` | Executive / forecast / campaign / budget export |

Interactive docs: `http://localhost:8000/docs`.

---

## Methodology

### Problem framing

The brief asks for **aggregate-period** probabilistic (P10/P50/P90) revenue and blended ROAS forecasts
for 30-, 60-, and 90-day horizons, driven by future media budget inputs (Google Ads + Meta Ads +
Microsoft/Bing Ads). Daily forecasts are *not* required — the dashboard's daily timeline is a derived
visualisation: the aggregate P10/P50/P90 is allocated across days using a **channel-weighted**
weekday seasonality curve from history (so changing the budget mix reshapes the curve). It is not a
second model and does not contradict the aggregate-period requirement.

### Model architecture

| Concern | Choice | Rationale |
|---|---|---|
| Target grain | One row per (campaign, period), trained on **30-, 60-, and 90-day buckets combined** | Matches the aggregate-period requirement; training on all three horizons (not just 30) keeps `period_length_days` in-distribution at inference instead of extrapolated — see Assumptions §4 |
| Model family | **LightGBM quantile regression** (τ = 0.1, 0.5, 0.9) | Three separate quantile-loss models give P10/P50/P90 directly without a separate conformal calibration step; robust with small N |
| Models trained | Revenue model + ROAS model, each with 3 quantiles (6 total) | Both are trained and evaluated independently. The **displayed** ROAS in `/forecast`, `/simulate`, and `predictions.csv` is derived as `revenue_quantile / spend` — guaranteeing revenue and ROAS never contradict. The independently trained ROAS model's own predictions are retained for evaluation/health metrics only. See `forecastiq/models/forecasting.py`. |
| Train/test split | **Time-based** (80% train, 20% test, ordered by `period_end`) | Prevents data leakage from future into past |
| Quantile crossing | Monotonicity enforced row-wise via `np.sort` on stacked quantiles | Independently trained quantile models can cross on small datasets; sort post-hoc is the standard fix |
| Anomaly detection | IsolationForest over spend/ROAS/CTR features | Unsupervised; no labelled anomaly data available |
| Explainability | SHAP values on the P50 revenue/ROAS model | Used for causal narrative in the AI assistant; not used for prediction |

### Features (no target leakage)

Only inputs knowable *before* a period happens are used:

| Group | Features |
|---|---|
| Budget | `spend`, `daily_budget`, `period_length_days` |
| Seasonality | `month`, `quarter`, `weekday`, `is_weekend` |
| Campaign identity | `campaign_id_code`, `channel_code`, `campaign_type_code` (label-encoded) |
| Trailing momentum | Rolling/lag means of revenue and ROAS over the immediately preceding period |

Same-period outcome columns (clicks, impressions, conversions, CTR, CPA) are deliberately excluded —
they are only known after the period happens and are themselves functions of revenue/spend.

### Budget simulation

`ForecastPipeline.simulate_budget()` substitutes a future budget vector into the trained model
and runs `forecast()` with no retraining. This is valid because `spend` is a feature the model
has never seen labelled with its own outcome for that hypothetical value — the model generalises
from training-time (spend → revenue) correlations.

### AI narration (Groq / Gemini)

LLMs are used **only** for causal narrative and anomaly explanation — they never predict a number.
Every prompt provides the ML pipeline's pre-computed numbers in a compact JSON context block and
instructs the model to cite only those numbers; structured JSON output is validated with Pydantic.

- **Primary:** Groq (`GROQ_API_KEY`, default model in `.env.example`)
- **Fallback:** Google Gemini (`GEMINI_API_KEY`) when Groq is not configured
- Context is kept compact so free-tier TPM limits are less likely to trip `/chat`

The `run.sh` path is entirely free of LLM calls. FastAPI `/insights` and `/chat` return HTTP 503 if
no key is set, and surface rate-limit errors when the provider throttles.

---

## Assumptions

1. **Revenue proxy for Meta Ads**: Meta's export has no `revenue` column. The `conversion` column
   (decimal, currency-scale values, not integer counts) is used as a revenue proxy. All affected rows
   are flagged `is_revenue_estimated = True` in the unified schema and shown as warnings in the
   validation / data-quality report. The model is trained on this proxy; predictions for Meta are
   therefore estimates of the proxy, not verbatim revenue.

2. **Campaign type for Meta Ads**: Meta's export has no campaign-type column. All Meta rows receive
   the fixed derived `campaign_type = "Social"` (channel-appropriate; not a guess at an internal
   taxonomy Meta doesn't expose).

3. **Google Ads cost micros**: Google's `cost_micros` column is divided by 1,000,000 to convert to
   the same currency unit as Meta and Bing.

4. **Aggregate-period grain**: the model is trained on **30-, 60-, and 90-day period aggregates
   combined into one training table** (`FeatureEngineer.build_training_table`), not just 30-day
   examples with 60/90 requested only at inference. Training only on 30-day periods made
   `period_length_days` (and scaled spend) out-of-distribution for tree-based quantile models —
   revenue flatlined instead of scaling with budget. Training on genuine 30/60/90-day examples fixed
   this. See
   `tests/ml_pipeline/test_pipeline.py::test_revenue_scales_with_spend_across_all_three_horizons`
   for the regression guard.

5. **Confidence score**: The confidence column in `predictions.csv` is derived from the P10–P90
   band width relative to P50 (narrower band = higher confidence). It is not a calibrated posterior
   probability.

6. **No daily model**: The daily timeline chart allocates the aggregate P50/P10/P90 across days using
   a fitted weekly-seasonal curve weighted by channel mix. This is a visualisation allocation, not a
   second predictive model.

---

## Limitations

1. **Small dataset per platform** (16–92 campaigns in the provided samples). LightGBM quantile
   regression generalises reasonably, but performance on out-of-distribution budget values
   (much larger or smaller than training range) is uncertain.

2. **Meta revenue proxy** (see Assumptions §1). If Meta exports a real revenue column under a
   different name in the held-out test data, the ingestion adapter will need updating — but this
   is an isolated one-function change in `data/ingestion.py`.

3. **Multi-horizon training still shares one model per target** (see Assumptions §4): 30/60/90-day
   examples are combined into a single training table rather than training three fully separate
   model sets. This fixed the out-of-distribution flatlining problem and is a reasonable v1
   trade-off.

4. **`predictions.csv` column format**: Confirm the official column format from the hackathon portal
   if it differs from `src/forecastiq/submission/output_schema.py` — update that one file and
   re-run `bash run.sh` to regenerate `output/predictions.csv`.

---

## Offline retraining

The committed `pickle/model.pkl` was trained on the data in `data/`. To retrain from scratch
(e.g. after adding new data files):

```bash
python train.py [DATA_DIR] [MODEL_PATH]
# defaults: ./data  ./pickle/model.pkl
```

This is an offline-only operation. `run.sh` never calls `train.py`.

---

## Running tests

```bash
cd backend
pip install -r requirements.txt
pytest tests/ -v
```

- **109 tests** collected on Python 3.13 (dev / CI). `run.sh` end-to-end tests (marked
  `@pytest.mark.slow`) spawn `bash run.sh` as a subprocess — they require `bash` on PATH.
  Run `pytest -m "not slow"` for a faster pass during iteration.
- No LLM API key is required to run the tests; LLM tests use an injected fake client.
  Tests force `groq_api_key=None` regardless of a real key in local `.env`
  (see `tests/api/conftest.py`).

---

## Submission checklist (automated: `scripts/validate_submission.py`)

| Check | Status |
|---|---|
| `run.sh` present and executable | ✅ |
| `requirements.txt` all pinned (`==`) | ✅ |
| `data/` has at least one CSV | ✅ |
| No hardcoded sample filenames in `src/` | ✅ |
| `pickle/model.pkl` exists and loads | ✅ |
| `run.sh` contains no absolute developer paths | ✅ |
| `run.sh` runs end-to-end and writes `predictions.csv` | ✅ (Linux/CI) |
| `predictions.csv` column format matches official spec | ⚠️ confirm against portal if announced |
