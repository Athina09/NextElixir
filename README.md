# ForecastIQ — NetElixir · AIgnition 3.0

> AI-powered **probabilistic ecommerce revenue forecasting** for digital marketing agencies. Simulate media budgets, forecast ROAS with P10/P50/P90 bands, drill into campaign performance, and get Groq-grounded AI explanations — before committing ad spend.

![ForecastIQ dashboard — KPIs, P10/P50/P90 revenue forecast, and budget scenario planner](docs/screenshots/01-dashboard.jpg)

![Campaign analytics](docs/screenshots/02-campaign-analytics.jpg)

![AI assistant](docs/screenshots/03-ai-assistant.jpg)

![Forecast history](docs/screenshots/04-forecast-history.jpg)

---

## Quick links

| Path | Purpose |
|---|---|
| [`backend/run.sh`](backend/run.sh) | **Hackathon grading entry** — offline features → `predictions.csv` (no network/DB) |
| [`backend/run.bat`](backend/run.bat) / [`backend/run_api.sh`](backend/run_api.sh) | **Full FastAPI backend** (dashboard API + optional Groq chat) |
| Frontend | TanStack Start / Vite UI (`npm run dev`) |

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | TanStack Start (React 19), TanStack Router/Query, Tailwind CSS v4, Radix/shadcn, Recharts, Framer Motion |
| Backend API | FastAPI · SQLAlchemy · SQLite or Postgres |
| ML | LightGBM quantile regression (τ = 0.1 / 0.5 / 0.9) · SHAP · IsolationForest |
| LLM (narration only) | Groq `llama-3.3-70b-versatile` — never predicts numbers |
| Build | Vite 8 · Python 3.13 |

---

## Model accuracy (committed pickle)

Held-out **time-based 80/20** backtest from `backend/pickle/model.pkl` (trained `2026-07-16`, train **1432** / test **359** rows):

| Target | MAE | RMSE | MAPE | R² |
|---|---|---|---|---|
| **Revenue** | 1,404 | 7,756 | **28.4%** | **0.93** |
| **ROAS** | 1.30 | 7.57 | **32.9%** | 0.23 |

Also exposed live at `GET /health` → `revenue_metrics` / `roas_metrics`.

> Displayed ROAS in forecasts is derived as `revenue_quantile / spend` so revenue and ROAS never contradict. The independently trained ROAS model is kept for health metrics only.

---

## Dataset (`backend/data/`)

| File | Rows (approx.) | Notes |
|---|---|---|
| `google_ads_campaign_stats.csv` | ~19,272 | Cost in micros → currency; has conversions_value |
| `meta_ads_campaign_stats.csv` | ~3,417 | `conversion` used as revenue proxy (`is_revenue_estimated`) |
| `bing_campaign_stats.csv` | ~2,873 | Microsoft Ads |

Ingestion **globs all `*.csv`** and detects platform by column signature — no hardcoded filenames (grading-safe).

---

## Chat LLM status

| Piece | Status |
|---|---|
| Frontend `src/services/chatService.ts` | Real `POST /chat` (not mock) |
| Backend `forecastiq/llm/` | Groq client + structured JSON responses |
| Needs | `GROQ_API_KEY` in `.env` ([console.groq.com/keys](https://console.groq.com/keys)) |
| Without key | `/chat` and `/insights` return **HTTP 503**; `/forecast` and `run.sh` still work |

---

## Project structure (vs AIgnition requirements)

```
NextElixir/
├── backend/
│   ├── run.sh                 ✅ grading entry (features + predict)
│   ├── run.bat / run_api.sh   ✅ full FastAPI service
│   ├── requirements.txt       ✅ pinned (==)
│   ├── train.py               offline retrain only
│   ├── data/*.csv             ✅ sample CSVs
│   ├── pickle/model.pkl       ✅ committed artifact
│   ├── scripts/validate_submission.py
│   └── src/forecastiq/        core · data · features · models · llm · api · …
├── src/                       TanStack Start frontend
├── docker-compose.yml         Postgres + backend
├── .env.example
└── README.md
```

Submission checklist (`python scripts/validate_submission.py` from `backend/`):

| Check | Status |
|---|---|
| `run.sh` present & executable | ✅ |
| Pinned `requirements.txt` | ✅ |
| `data/` has CSVs | ✅ |
| No hardcoded sample filenames in `src/` | ✅ |
| `pickle/model.pkl` loads | ✅ |
| No absolute paths in `run.sh` | ✅ |
| E2E `run.sh` → `predictions.csv` | ✅ (Linux / Git Bash) |

---

## Getting started

### 1. Offline grading path (no API key)

```bash
cd backend
pip install -r requirements.txt
bash run.sh
# → output/predictions.csv
```

### 2. Full backend (Windows)

```bat
cd backend
run.bat
```

### 3. Full backend (macOS / Linux)

```bash
cd backend
bash run_api.sh
# API: http://localhost:8000  ·  Docs: http://localhost:8000/docs
```

Set chat:

```bash
cp .env.example .env   # repo root and/or backend/
# edit: GROQ_API_KEY=...
```

Default local DB is SQLite (`sqlite:///./forecastiq_dev.db`). For Postgres:

```bash
docker compose up -d db
# DATABASE_URL=postgresql+psycopg2://forecastiq:forecastiq@localhost:5432/forecastiq
```

### 4. Frontend

```bash
npm install
cp .env.example .env   # VITE_API_URL=http://localhost:8000
npm run dev
```

---

## Application routes

| Path | Description |
|---|---|
| `/` | Dashboard — KPIs, forecast hero, budget console, AI report |
| `/forecasts` | P10/P50/P90 drill-down (aggregate → campaign) |
| `/budget-simulator` | Live budget sliders → forecast refresh |
| `/scenario-comparison` | Scenario A vs B |
| `/campaign-analytics` | Channel / type / campaign tables |
| `/forecast-history` | Past forecast runs |
| `/reports` | Executive / forecast / campaign exports |
| `/ai-assistant` | Groq chat grounded in forecast context |
| `/upload` | CSV upload (Google / Meta / Bing / GA4 / Shopify) |
| `/settings` | Theme, model health, preferences |

---

## API surface (FastAPI)

| Method | Route | Notes |
|---|---|---|
| `GET` | `/health` | Model loaded + **backtest metrics** |
| `POST` | `/forecast` | Probabilistic forecast (no LLM) |
| `POST` | `/chat` | Groq assistant (needs key) |
| `POST` | `/insights` | Groq narrative (needs key) |
| `POST` | `/datasets/upload` | CSV ingest |
| `GET` | `/validation` | Data validation report |
| `GET/DELETE/POST` | `/forecast-runs…` | History |
| `POST` | `/reports` | Report generation |

---

## Design notes

- Midnight Blue fintech theme (`src/styles.css`) with subtle grid + blue/cyan washes
- Brand: **ForecastIQ** · Powered by NetElixir
- Model card in sidebar reflects real LightGBM quantile stack (not placeholder copy)

---

## Offline retrain

```bash
cd backend
python train.py [DATA_DIR] [MODEL_PATH]
# defaults: ./data  ./pickle/model.pkl
```

`run.sh` / API inference **never** retrains.
