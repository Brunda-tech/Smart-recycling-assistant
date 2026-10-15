import sqlite3
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, HTTPException, Query

from app.database import get_db_connection
from app.schemas import MaterialCreate, MaterialUpdate, MaterialOut

router = APIRouter()


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


@router.get("/materials", response_model=list[MaterialOut])
def list_materials(category: str | None = Query(default=None)) -> list[dict[str, Any]]:
    with get_db_connection() as conn:
        query = "SELECT * FROM materials WHERE status != 'deleted'"
        params: list[Any] = []
        if category:
            query += " AND waste_category = ?"
            params.append(category)
        query += " ORDER BY detection_timestamp DESC"
        rows = conn.execute(query, params).fetchall()
        return [dict(row) for row in rows]


@router.post("/materials", response_model=MaterialOut)
def create_material(payload: MaterialCreate) -> dict[str, Any]:
    now = utc_now()
    with get_db_connection() as conn:
        cursor = conn.execute(
            """
            INSERT INTO materials (
                object_label, waste_category, confidence, estimated_weight, current_stage, final_destination,
                detection_timestamp, last_updated, source, status, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                payload.object_label,
                payload.waste_category,
                payload.confidence,
                payload.estimated_weight,
                payload.current_stage,
                payload.final_destination,
                now,
                now,
                payload.source,
                'active',
                payload.notes,
            ),
        )
        conn.commit()
        material_id = cursor.lastrowid
        row = conn.execute("SELECT * FROM materials WHERE id = ?", (material_id,)).fetchone()
        if row is None:
            raise HTTPException(status_code=500, detail="Failed to create material record")
        return dict(row)


@router.patch("/materials/{material_id}", response_model=MaterialOut)
def update_material(material_id: int, payload: MaterialUpdate) -> dict[str, Any]:
    with get_db_connection() as conn:
        existing = conn.execute("SELECT * FROM materials WHERE id = ?", (material_id,)).fetchone()
        if existing is None:
            raise HTTPException(status_code=404, detail="Material not found")

        fields: list[str] = []
        values: list[Any] = []
        for field_name in ["current_stage", "final_destination", "waste_category", "status", "notes"]:
            value = getattr(payload, field_name)
            if value is not None:
                fields.append(f"{field_name} = ?")
                values.append(value)
        if not fields:
            raise HTTPException(status_code=400, detail="No fields provided for update")
        fields.append("last_updated = ?")
        values.extend([utc_now()])
        values.append(material_id)
        conn.execute(f"UPDATE materials SET {', '.join(fields)} WHERE id = ?", tuple(values))
        conn.commit()
        row = conn.execute("SELECT * FROM materials WHERE id = ?", (material_id,)).fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Material not found after update")
        return dict(row)
