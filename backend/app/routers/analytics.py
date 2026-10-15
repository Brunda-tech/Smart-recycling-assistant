from __future__ import annotations

import csv
import io
from datetime import date, datetime, timedelta, timezone

from fastapi import APIRouter, Response

from app.database import get_db_connection

router = APIRouter()


@router.get("/analytics")
def analytics() -> dict:
    with get_db_connection() as conn:
        rows = conn.execute(
            "SELECT * FROM materials WHERE status != 'deleted' ORDER BY detection_timestamp DESC"
        ).fetchall()

    category_counts = {}
    for row in rows:
        category_counts[row["waste_category"]] = category_counts.get(row["waste_category"], 0) + 1

    today = datetime.now(timezone.utc).date()
    date_range = [today - timedelta(days=offset) for offset in range(6, -1, -1)]
    schedule_by_date: dict[str, dict] = {
        day.isoformat(): {"date": day.isoformat(), **{category: 0 for category in category_counts}}
        for day in date_range
    }
    for row in rows:
        try:
            item_date = date.fromisoformat(row["detection_timestamp"][:10])
        except (TypeError, ValueError):
            continue
        day_record = schedule_by_date.get(item_date.isoformat())
        if day_record is not None:
            category = row["waste_category"]
            day_record[category] = day_record.get(category, 0) + 1
    schedule = list(schedule_by_date.values())
    total_weight = sum(float(row["estimated_weight"] or 0) for row in rows)
    recovered_weight = sum(
        float(row["estimated_weight"] or 0) for row in rows if row["current_stage"] == "recovery"
    )

    return {
        "category_counts": category_counts,
        "daily_collection": schedule,
        "stage_distribution": {
            "collection": sum(1 for row in rows if row["current_stage"] == "collection"),
            "sorting": sum(1 for row in rows if row["current_stage"] == "sorting"),
            "processing": sum(1 for row in rows if row["current_stage"] == "processing"),
            "recovery": sum(1 for row in rows if row["current_stage"] == "recovery"),
        },
        "recovery_rate": round((recovered_weight / total_weight) * 100, 2) if total_weight else 0,
        "items": [dict(row) for row in rows],
    }


@router.get("/export")
def export_csv() -> Response:
    with get_db_connection() as conn:
        rows = conn.execute("SELECT * FROM materials WHERE status != 'deleted' ORDER BY detection_timestamp DESC").fetchall()

    output = io.StringIO()
    writer = csv.DictWriter(
        output,
        fieldnames=[
            "id", "object_label", "waste_category", "confidence", "estimated_weight", "current_stage",
            "final_destination", "detection_timestamp", "last_updated", "source", "status", "notes"
        ],
    )
    writer.writeheader()
    for row in rows:
        writer.writerow(dict(row))
    response = Response(content=output.getvalue(), media_type="text/csv")
    response.headers["Content-Disposition"] = "attachment; filename=smart_recycling_export.csv"
    return response
