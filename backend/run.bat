@echo off
setlocal EnableExtensions EnableDelayedExpansion

REM ForecastIQ — full FastAPI backend (Windows)
REM Usage: run.bat
REM Optional env: GROQ_API_KEY, DATABASE_URL, PORT

cd /d "%~dp0"

if not defined PORT set "PORT=8000"
if not defined DATABASE_URL set "DATABASE_URL=sqlite:///%~dp0forecastiq_dev.db"
if not defined ENVIRONMENT set "ENVIRONMENT=development"
if not defined LOG_LEVEL set "LOG_LEVEL=INFO"
if not defined CORS_ORIGINS set "CORS_ORIGINS=[\"http://localhost:3000\", \"http://localhost:5173\", \"http://localhost:8080\"]"

if not exist ".venv\Scripts\python.exe" (
  echo [run.bat] Creating virtualenv...
  py -3.13 -m venv .venv 2>nul
  if errorlevel 1 python -m venv .venv
)

call ".venv\Scripts\activate.bat"

echo [run.bat] Installing / syncing dependencies...
python -m pip install --upgrade pip >nul
python -m pip install -r requirements.txt

if not exist ".env" (
  if exist ".env.example" (
    echo [run.bat] Creating .env from .env.example
    copy /Y ".env.example" ".env" >nul
  )
)

set "PYTHONPATH=%CD%\src"
echo [run.bat] DATABASE_URL=%DATABASE_URL%
echo [run.bat] Starting FastAPI on http://localhost:%PORT%
echo [run.bat] Docs: http://localhost:%PORT%/docs
if "%GROQ_API_KEY%"=="" (
  echo [run.bat] WARNING: GROQ_API_KEY not set — /chat and /insights will return 503
) else (
  echo [run.bat] GROQ_API_KEY is set — AI chat/insights enabled
)

python -m uvicorn forecastiq.api.main:app --host 0.0.0.0 --port %PORT% --reload
endlocal
