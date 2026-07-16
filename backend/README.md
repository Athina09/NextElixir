# ForecastIQ Backend — AIgnition 3.0

> **NetElixir · AIgnition 3.0 Hackathon Submission**
> Probabilistic ecommerce revenue forecasting from media budget inputs.

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

## Requirements

- Python 3.13 (all dependencies pinned in `requirements.txt`)
- `bash` (standard on the Linux grading machine)

---

## Repository layout

```
backend/
├── run.sh                    # grading entry point
├── requirements.txt          # pinned deps (Python 3.13)
├── README.md                 # this file
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
        ├── llm/              # Gemini client, insights, chat (not used in run.sh)
        ├── db/               # SQLAlchemy models (not used in run.sh)
        ├── schemas/          # Pydantic API schemas (not used in run.sh)
        ├── api/              # FastAPI routers (not used in run.sh)
        └── reports/          # PDF/Excel/CSV generation (not used in run.sh)
```

---

## Methodology

### Problem framing

The brief asks for **aggregate-period** probabilistic (P10/P50/P90) revenue and blended ROAS forecasts
for 30-, 60-, and 90-day horizons, driven by future media budget inputs (Google Ads + Meta Ads +
Microsoft/Bing Ads). Daily forecasts are *not* required — the dashboard's daily timeline is a derived
visualisation (the aggregate P10/P50/P90 budget is allocated across days using a fitted
weekly-seasonal curve; it is not a second model and does not contradict the aggregate-period
requirement).

### Model architecture

| Concern | Choice | Rationale |
|---|---|---|
| Target grain | One row per (campaign, period), trained on **30-, 60-, and 90-day buckets combined** | Matches the aggregate-period requirement; training on all three horizons (not just 30) keeps `period_length_days` in-distribution at inference instead of extrapolated — see Assumptions §4 |
| Model family | **LightGBM quantile regression** (τ = 0.1, 0.5, 0.9) | Three separate quantile-loss models give P10/P50/P90 directly without a separate conformal calibration step; robust with small N |
| Models trained | Revenue model + ROAS model, each with 3 quantiles (6 total) | Both are trained and evaluated independently (the brief requires forecasting ROAS as its own quantity). The **displayed** ROAS in `/forecast`, `/simulate`, and `predictions.csv` is derived as `revenue_quantile / spend` — guaranteeing revenue and ROAS never contradict each other in the UI. The independently-trained ROAS model's own predictions are retained (`roas_model_p50`) for evaluation/health metrics only, not for display. See `forecastiq/models/forecasting.py`. |
| Train/test split | **Time-based** (80% train, 20% test, ordered by `period_end`) | Prevents data leakage from future into past; mirrors real deployment where the model sees only historical data |
| Quantile crossing | Monotonicity enforced row-wise via `np.sort` on stacked quantiles | Independently-trained quantile models can cross on small datasets; sort post-hoc is the standard fix |
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
they are only known after the period happens and are themselves functions of revenue/spend. Including
them would leak the target into its own features and make budget simulation invalid (the model would
have to invent values for these for a hypothetical future budget, introducing a second prediction
problem inside the first).

### Budget simulation

`ForecastPipeline.simulate_budget()` substitutes a future budget vector into the trained model
and runs `forecast()` with no retraining. This is valid because `spend` is a feature the model
has never seen labelled with its own outcome for that hypothetical value — the model generalises
from training-time (spend → revenue) correlations.

### AI narration (Gemini)

Gemini is used **only** for causal narrative and anomaly explanation — it never predicts a number.
Every prompt explicitly provides the ML pipeline's pre-computed numbers in a JSON context block
and instructs the model to cite only those numbers. The `run.sh` path is entirely free of Gemini
calls; the FastAPI `/insights` and `/chat` endpoints surface a clear HTTP 503 if
`GEMINI_API_KEY` is not set.

---

## Assumptions

1. **Revenue proxy for Meta Ads**: Meta's export has no `revenue` column. The `conversion` column
   (decimal, currency-scale values, not integer counts) is used as a revenue proxy. All affected rows
   are flagged `is_revenue_estimated = True` in the unified schema and shown as warnings in the
   validation report. The model is trained on this proxy; predictions for Meta are therefore estimates
   of the proxy, not verbatim revenue. This is noted in `ValidationReport.warnings`.

2. **Campaign type for Meta Ads**: Meta's export has no campaign-type column. All Meta rows receive
   the fixed derived `campaign_type = "Social"` (channel-appropriate; not a guess at an internal
   taxonomy Meta doesn't expose).

3. **Google Ads cost micros**: Google's `cost_micros` column is divided by 1,000,000 to convert to
   the same currency unit as Meta and Bing.

4. **Aggregate-period grain**: the model is trained on **30-, 60-, and 90-day period aggregates
   combined into one training table** (`FeatureEngineer.build_training_table`), not just 30-day
   examples with 60/90 requested only at inference. Earlier in development this pipeline trained
   on 30-day periods only and derived 60/90-day forecasts by scaling the feature vector — that
   made `period_length_days` (and the correspondingly scaled spend) out-of-distribution for the
   tree-based quantile models, which don't extrapolate well: revenue flatlined instead of scaling
   with a proportionally larger budget (verified during development — 90-day revenue at 3x the
   30-day spend came out only ~8% higher, collapsing blended ROAS from ~8.7x to ~3.1x). Training on
   genuine 30/60/90-day examples fixed this (same test: 90-day revenue at 3x spend now comes out
   ~3.3x higher, ROAS stays ~8x across all three horizons). See
   `tests/ml_pipeline/test_pipeline.py::test_revenue_scales_with_spend_across_all_three_horizons`
   for the regression guard.

5. **Confidence score**: The confidence column in `predictions.csv` is derived from the P10–P90
   band width relative to P50 (narrower band = higher confidence). It is not a calibrated posterior
   probability.

6. **No daily model**: The daily timeline chart in the dashboard allocates the aggregate P50/P10/P90
   across days using a fitted weekly-seasonal curve. This is clearly documented as a visualisation
   allocation, not a second predictive model.

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
   trade-off, but three horizon-specific model sets would likely fit each window's dynamics more
   precisely given more time/data.

4. **`predictions.csv` column format**: Neither the AIgnition Project Brief nor the Hackathon
   Submission Guide states the exact column names/order that were announced at the launch event.
   The schema in `src/forecastiq/submission/output_schema.py` is a well-justified default
   (aggregate/channel/campaign-type/campaign P10/P50/P90 revenue + ROAS for all three horizons).
   **ACTION REQUIRED before July 19**: confirm the official column format from the hackathon portal,
   email, or Slack — if it differs, update `output_schema.py` (one file, ~30 lines) and re-run
   `bash run.sh` to regenerate `output/predictions.csv`.

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

## Running the FastAPI dashboard service

```bash
# 1. Start Postgres + backend (from repo root)
docker-compose up

# 2. Copy and edit environment config
cp .env.example .env
# Set GEMINI_API_KEY= to your key for AI insights/chat

# 3. Start frontend dev server (separate terminal, from repo root)
npm run dev
```

API is available at `http://localhost:8000`. Interactive docs at `http://localhost:8000/docs`.

---

## Running tests

```bash
cd backend
pip install -r requirements.txt
pytest tests/ -v
```

- **101/101 tests pass** on the dev machine (Python 3.13, Windows, with Git Bash available) and in
  CI (Ubuntu). `run.sh` end-to-end tests (marked `@pytest.mark.slow`) actually spawn `bash run.sh`
  as a subprocess and check the real output file — they require `bash` on PATH, standard on Linux
  and Git Bash on Windows. Run `pytest -m "not slow"` for a faster ~30s pass during iteration.
- No Gemini API key is required to run the tests; LLM tests use an injected fake SDK client — see
  `tests/integration/test_gemini_client.py` and `tests/api/test_insights.py` /
  `tests/api/test_chat.py`. Tests always run with `gemini_api_key=None` explicitly set, regardless
  of a real key in the developer's local `.env` (see `tests/api/conftest.py`).

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
| `predictions.csv` column format matches official spec | ⚠️ **confirm before July 19** |
