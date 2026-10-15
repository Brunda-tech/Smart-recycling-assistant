from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Optional


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


class MaterialRecord:
    def __init__(
        self,
        object_label: str,
        waste_category: str,
        confidence: float,
        estimated_weight: float,
        current_stage: str,
        final_destination: Optional[str] = None,
        detection_timestamp: Optional[str] = None,
        last_updated: Optional[str] = None,
        source: str = "manual",
        status: str = "active",
        notes: Optional[str] = None,
        material_id: Optional[int] = None,
    ) -> None:
        self.id = material_id
        self.object_label = object_label
        self.waste_category = waste_category
        self.confidence = confidence
        self.estimated_weight = estimated_weight
        self.current_stage = current_stage
        self.final_destination = final_destination
        self.detection_timestamp = detection_timestamp or utc_now()
        self.last_updated = last_updated or utc_now()
        self.source = source
        self.status = status
        self.notes = notes

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "object_label": self.object_label,
            "waste_category": self.waste_category,
            "confidence": self.confidence,
            "estimated_weight": self.estimated_weight,
            "current_stage": self.current_stage,
            "final_destination": self.final_destination,
            "detection_timestamp": self.detection_timestamp,
            "last_updated": self.last_updated,
            "source": self.source,
            "status": self.status,
            "notes": self.notes,
        }
