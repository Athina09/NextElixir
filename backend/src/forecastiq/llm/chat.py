"""The grounded AI forecasting assistant. Same grounding context as insights
(see forecastiq/llm/context.py) — the model classifies intent itself instead
of the client-side keyword matching the mock (`chatService.ts`) used, then
fills only the structured fields that intent calls for."""

from __future__ import annotations

import json
from typing import Any

from forecastiq.llm.gemini_client import GeminiClient
from forecastiq.schemas.chat import AssistantPayloadSchema

INSTRUCTIONS = """You are ForecastIQ's AI forecasting assistant, embedded in a live \
dashboard. You never invent a number — only use what's in the JSON context below (the \
current forecast, budget, top drivers, anomalies, and validation state) or direct \
arithmetic on it. If you don't have enough context to answer precisely, say so rather \
than guessing.

Classify the user's question into exactly one `kind`:
- "forecast-summary" — explaining the current forecast: revenue, ROAS, confidence
- "risk" — anomalies, risk, data-quality concerns
- "budget-optimization" — reallocating budget across channels
- "recommendation" — general advice or next steps
- "assistant" — anything else

Fill ONLY the optional field(s) matching the chosen kind — `reasoning` for \
forecast-summary, `risks` for risk, `budget` for budget-optimization — and leave the \
others null. Always write `markdown` as a specific, well-formatted answer citing real \
figures from the context.
"""


def generate_chat_response(client: GeminiClient, user_message: str, context: dict[str, Any]) -> AssistantPayloadSchema:
    prompt = (
        f"{INSTRUCTIONS}\n\nContext (JSON):\n{json.dumps(context, default=str)}"
        f"\n\nUser question: {user_message}"
    )
    return client.generate(prompt, response_schema=AssistantPayloadSchema)
