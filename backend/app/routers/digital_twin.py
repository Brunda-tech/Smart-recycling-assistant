from __future__ import annotations

import sqlite3
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, HTTPException

from app.database import get_db_connection

router = APIRouter()

STAGES = ["collection", "sorting", "processing", "recovery"]
DESTINATIONS = ["reuse", "recycling", "composting", "safe_disposal"]


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _encode_destination(material: dict[str, Any]) -> str | None:
    if material["waste_category"] == "hazardous":
        return "safe_disposal"
    if material["current_stage"] == "recovery":
        if material["waste_category"] == "biodegradable":
            return "composting"
        if material["waste_category"] == "reusable":
            return "reuse"
        return "recycling"
    return material["final_destination"]


@router.get("/twin/summary")
def twin_summary() -> dict[str, Any]:
    with get_db_connection() as conn:
        rows = conn.execute(
            "SELECT id, object_label, waste_category, estimated_weight, current_stage, final_destination, confidence, status FROM materials WHERE status != 'deleted' ORDER BY id DESC"
        ).fetchall()

        total_items = len(rows)
        total_weight = sum(float(r["estimated_weight"]) for r in rows)
        category_counts = {}
        for row in rows:
            category_counts[row["waste_category"]] = category_counts.get(row["waste_category"], 0) + 1

        recovery_count = sum(1 for r in rows if r["current_stage"] == "recovery")
        recovery_weight = sum(float(r["estimated_weight"]) for r in rows if r["current_stage"] == "recovery")
        total_valid_weight = total_weight if total_weight > 0 else 1
        recovery_rate = round((recovery_weight / total_valid_weight) * 100, 2) if total_valid_weight else 0

        return {
            "total_items": total_items,
            "total_weight": round(total_weight, 2),
            "category_counts": category_counts,
            "recovery_rate": recovery_rate,
            "recovery_count": recovery_count,
            "stages": {stage: sum(1 for r in rows if r["current_stage"] == stage) for stage in STAGES},
            "destinations": {dest: sum(1 for r in rows if (_encode_destination(dict(r)) == dest)) for dest in DESTINATIONS},
        }


@router.get("/twin/flow")
def twin_flow() -> dict[str, Any]:
    with get_db_connection() as conn:
        rows = conn.execute(
            "SELECT id, object_label, waste_category, estimated_weight, current_stage, final_destination FROM materials WHERE status != 'deleted'"
        ).fetchall()
        return {
            "flow": [
                {
                    "id": row["id"],
                    "label": row["object_label"],
                    "category": row["waste_category"],
                    "weight": float(row["estimated_weight"]),
                    "stage": row["current_stage"],
                    "destination": _encode_destination(dict(row)),
                }
                for row in rows
            ]
        }


@router.get("/twin/events")
def twin_events() -> dict[str, Any]:
    with get_db_connection() as conn:
        rows = conn.execute(
            "SELECT * FROM events ORDER BY created_at DESC LIMIT 20"
        ).fetchall()
        return {"events": [dict(row) for row in rows]}


@router.post("/twin/move")
def move_material(payload: dict[str, Any]) -> dict[str, Any]:
    material_id = int(payload.get("material_id"))
    next_stage = payload.get("next_stage")
    if next_stage not in STAGES:
        raise HTTPException(status_code=400, detail="Invalid stage transition")

    with get_db_connection() as conn:
        row = conn.execute("SELECT * FROM materials WHERE id = ?", (material_id,)).fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Material not found")
        current_stage = row["current_stage"]
        if next_stage == current_stage:
            raise HTTPException(status_code=400, detail="Material already at that stage")

        order = {"collection": 0, "sorting": 1, "processing": 2, "recovery": 3}
        if order.get(next_stage, -1) < order.get(current_stage, -1):
            raise HTTPException(status_code=400, detail="Invalid processing transition")

        if row["waste_category"] == "hazardous":
            next_stage = "recovery"
            final_destination = "safe_disposal"
        else:
            final_destination = _encode_destination({**dict(row), "current_stage": next_stage})

        conn.execute(
            "UPDATE materials SET current_stage = ?, final_destination = ?, last_updated = ? WHERE id = ?",
            (next_stage, final_destination, utc_now(), material_id),
        )
        conn.execute(
            "INSERT INTO events (material_id, event_type, from_stage, to_stage, message, created_at) VALUES (?, 'stage_move', ?, ?, ?, ?)",
            (material_id, current_stage, next_stage, f"Material {material_id} moved from {current_stage} to {next_stage}", utc_now()),
        )
        conn.commit()
        updated = conn.execute("SELECT * FROM materials WHERE id = ?", (material_id,)).fetchone()
        return {"success": True, "material": dict(updated)}
