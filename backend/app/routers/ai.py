from __future__ import annotations

import json
import os

from fastapi import APIRouter

from app.config import get_settings
from app.database import get_db_connection

router = APIRouter()
settings = get_settings()


def _fallback_recommendation(message: str, context: dict | None = None) -> dict:
    context = context or {}
    total_items = context.get("total_items", 0)
    waste_category = context.get("dominant_category", "recyclable")
    recovery_rate = context.get("recovery_rate", 0)
    recommendations = [
        f"Focus on {waste_category} recovery and sort items before disposal to improve collection efficiency.",
        "Encourage reusable packaging and repair programs to reduce waste at the source.",
        "Use clear labeling for hazardous items and separate batteries, chemicals, and electronics from standard waste streams.",
    ]
    return {
        "response": (
            "Predefined guidance: "
            + recommendations[0]
            + " "
            + (f"Your current recovery rate is {recovery_rate}% and {total_items} items are tracked." if total_items else "")
        ),
        "source": "fallback",
        "model": "rule-based",
        "suggestions": recommendations,
    }


@router.post("/ai/chat")
def ai_chat(payload: dict) -> dict:
    message = (payload.get("message") or "").strip()
    context = payload.get("context") or {}

    with get_db_connection() as conn:
        materials = conn.execute("SELECT * FROM materials WHERE status != 'deleted' ORDER BY detection_timestamp DESC").fetchall()
        total_items = len(materials)
        category_counts = {}
        for row in materials:
            category_counts[row["waste_category"]] = category_counts.get(row["waste_category"], 0) + 1
        dominant_category = max(category_counts.items(), key=lambda item: item[1], default=("recyclable", 0))[0]
        total_weight = sum(float(row["estimated_weight"]) for row in materials)
        recovery_rate = round((sum(1 for row in materials if row["current_stage"] == "recovery") / total_items) * 100, 2) if total_items else 0

    if settings.openai_api_key:
        try:
            from openai import OpenAI

            client = OpenAI(api_key=settings.openai_api_key)
            prompt = (
                f"You are an eco advisor. User asks: {message}. "
                f"Context: total items={total_items}, dominant category={dominant_category}, total weight={total_weight}, recovery rate={recovery_rate}."
            )
            completion = client.chat.completions.create(
                model=settings.openai_model,
                messages=[{"role": "user", "content": prompt}],
            )
            return {
                "response": completion.choices[0].message.content,
                "source": "live_llm",
                "model": settings.openai_model,
            }
        except Exception:
            return _fallback_recommendation(message, {"total_items": total_items, "dominant_category": dominant_category, "recovery_rate": recovery_rate})

    return _fallback_recommendation(message, {"total_items": total_items, "dominant_category": dominant_category, "recovery_rate": recovery_rate})
