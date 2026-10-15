from typing import Optional

from pydantic import BaseModel, Field, ConfigDict


class DetectionItem(BaseModel):
    label: str
    confidence: float = 0.0
    x1: float = 0
    y1: float = 0
    x2: float = 0
    y2: float = 0


class DetectionRequest(BaseModel):
    model_config = ConfigDict(extra='forbid')
    image_name: str | None = None


class MaterialCreate(BaseModel):
    object_label: str = Field(..., min_length=1)
    waste_category: str = Field(..., min_length=1)
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    estimated_weight: float = Field(default=0.0, ge=0.0)
    current_stage: str = Field(default="collection")
    final_destination: Optional[str] = None
    source: str = "manual"
    notes: Optional[str] = None


class MaterialUpdate(BaseModel):
    current_stage: Optional[str] = None
    final_destination: Optional[str] = None
    waste_category: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class TwinMoveRequest(BaseModel):
    material_id: int
    next_stage: str


class ChatRequest(BaseModel):
    message: str
    context: dict | None = None


class MaterialOut(BaseModel):
    id: int
    object_label: str
    waste_category: str
    confidence: float
    estimated_weight: float
    current_stage: str
    final_destination: Optional[str]
    detection_timestamp: str
    last_updated: str
    source: str
    status: str
    notes: Optional[str]
