#!/usr/bin/env bash
set -euo pipefail

# ./run.sh <DATA_DIR> <MODEL_PATH> <OUTPUT_PATH>, all optional with defaults —
# per the Hackathon Submission Guide, Section 3.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DATA_DIR="${1:-$SCRIPT_DIR/data}"
MODEL_PATH="${2:-$SCRIPT_DIR/pickle/model.pkl}"
OUTPUT_PATH="${3:-$SCRIPT_DIR/output/predictions.csv}"

mkdir -p "$(dirname "$OUTPUT_PATH")"
FEATURES_PATH="$(dirname "$OUTPUT_PATH")/features.parquet"

echo "[run.sh] DATA_DIR=$DATA_DIR"
echo "[run.sh] MODEL_PATH=$MODEL_PATH"
echo "[run.sh] OUTPUT_PATH=$OUTPUT_PATH"

# 1. Ingest + normalize whatever CSVs are in DATA_DIR (no hardcoded filenames).
python "$SCRIPT_DIR/src/generate_features.py" \
  --data-dir "$DATA_DIR" \
  --out "$FEATURES_PATH"

# 2. Load the pickled model and produce predictions.
python "$SCRIPT_DIR/src/predict.py" \
  --features "$FEATURES_PATH" \
  --model "$MODEL_PATH" \
  --output "$OUTPUT_PATH"

echo "[run.sh] Done. Predictions written to $OUTPUT_PATH"
