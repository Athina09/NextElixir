#!/usr/bin/env bash
# ForecastIQ — full FastAPI backend (macOS / Linux)
# Grading / offline inference stays in ./run.sh
# Usage: bash run_api.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

PORT="${PORT:-8000}"
# Prefer absolute SQLite path so history writes work regardless of launch cwd.
DEFAULT_DB="sqlite:///${SCRIPT_DIR}/forecastiq_dev.db"
export DATABASE_URL="${DATABASE_URL:-$DEFAULT_DB}"
export ENVIRONMENT="${ENVIRONMENT:-development}"
export LOG_LEVEL="${LOG_LEVEL:-INFO}"
export CORS_ORIGINS="${CORS_ORIGINS:-[\"http://localhost:3000\", \"http://localhost:5173\", \"http://localhost:8080\"]}"
export PYTHONPATH="$SCRIPT_DIR/src"

# Corporate / macOS custom CA (needed for Gemini/Groq HTTPS behind some proxies)
if [[ -z "${SSL_CERT_FILE:-}" && -f "$HOME/mac-ca.pem" ]]; then
  export SSL_CERT_FILE="$HOME/mac-ca.pem"
fi
if [[ -z "${REQUESTS_CA_BUNDLE:-}" && -n "${SSL_CERT_FILE:-}" ]]; then
  export REQUESTS_CA_BUNDLE="$SSL_CERT_FILE"
fi

if [[ ! -d .venv ]]; then
  echo "[run_api.sh] Creating virtualenv..."
  python3.13 -m venv .venv 2>/dev/null || python3 -m venv .venv
fi
# shellcheck disable=SC1091
source .venv/bin/activate

python -m pip install -q --upgrade pip
python -m pip install -q -r requirements.txt

if [[ ! -f .env && -f .env.example ]]; then
  cp .env.example .env
  echo "[run_api.sh] Created .env from .env.example — set GROQ_API_KEY for chat"
fi

# Do not `source .env` here — JSON values like CORS_ORIGINS break bash.
# pydantic-settings loads .env when the FastAPI app starts.

echo "[run_api.sh] DATABASE_URL=$DATABASE_URL"
echo "[run_api.sh] Starting FastAPI on http://localhost:$PORT"
echo "[run_api.sh] Docs: http://localhost:$PORT/docs"
if [[ -z "${GROQ_API_KEY:-}" ]]; then
  echo "[run_api.sh] WARNING: GROQ_API_KEY not set in environment — if also empty in .env, /chat returns 503"
else
  echo "[run_api.sh] GROQ_API_KEY is set — AI chat/insights enabled"
fi

exec python -m uvicorn forecastiq.api.main:app --host 0.0.0.0 --port "$PORT" --reload
