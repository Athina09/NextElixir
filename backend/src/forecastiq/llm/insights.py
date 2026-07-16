"""AI-generated executive insights. The LLM only explains a forecast the ML
pipeline already computed — it never predicts a number itself."""

from __future__ import annotations

import json
from typing import Any

from forecastiq.llm.groq_client import GroqClient
from forecastiq.schemas.insights import InsightsSchema

INSTRUCTIONS = """You are ForecastIQ's AI analyst, explaining a probabilistic ecommerce \
revenue forecast to a digital marketing agency. You never predict or invent a number — \
you only explain the forecast you are given.

Rules:
- Every number you mention MUST come from the JSON context below, verbatim or as a direct \
arithmetic combination of numbers already in it (e.g. a percentage of a given total).
- Never state a figure that cannot be traced back to the context.
- Name channels and campaign types using their actual names in the context, never a \
generic placeholder.
- summary: 2-4 sentences, the executive takeaway.
- drivers: 3-5 short bullets citing the top revenue/ROAS drivers given.
- positives / negatives: what's working / what's at risk, grounded in the channel and \
anomaly data given.
- seasonality: one sentence on any seasonal pattern implied by the growth figure given.
- allocation: one concrete budget-reallocation suggestion between two named channels.
- risks: short bullets grounded in the anomalies and validation flags given.
- recommendations: 2-3 concrete next actions.
- flags: data-quality flags, straight from the validation flags given.
"""


def generate_insights(client: GroqClient, context: dict[str, Any]) -> InsightsSchema:
    prompt = f"{INSTRUCTIONS}\n\nContext (JSON):\n{json.dumps(context, default=str)}"
    return client.generate(prompt, response_schema=InsightsSchema)
