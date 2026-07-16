FROM python:3.13-slim

WORKDIR /app

# curl is required for docker-compose's healthcheck (curl -f http://localhost:8000/health).
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY src/ ./src
COPY pickle/ ./pickle
COPY data/ ./data

RUN useradd --create-home --shell /usr/sbin/nologin appuser \
    && mkdir -p /app/logs /app/output \
    && chown -R appuser:appuser /app
USER appuser

ENV PYTHONPATH=/app/src
EXPOSE 8000

CMD ["uvicorn", "forecastiq.api.main:app", "--host", "0.0.0.0", "--port", "8000"]
