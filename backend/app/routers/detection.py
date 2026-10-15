from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.config import get_settings
from app.services.classification_service import classify_material
from app.services.vision_service import process_image

router = APIRouter()
settings = get_settings()


@router.post("/detect")
async def detect_waste(file: UploadFile = File(...)) -> dict:
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded")

    ext = Path(file.filename).suffix.lower()
    if ext not in {".jpg", ".jpeg", ".png"}:
        raise HTTPException(status_code=400, detail="Unsupported image type. Use JPG, JPEG, or PNG only.")

    contents = await file.read()
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Uploaded file exceeds 10MB limit.")

    saved_dir = settings.uploads_folder
    saved_dir.mkdir(parents=True, exist_ok=True)
    safe_name = Path(file.filename).name
    upload_path = saved_dir / safe_name
    upload_path.write_bytes(contents)

    try:
        result = process_image(str(upload_path))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Detection failed: {exc}") from exc

    detected_objects = []
    for item in result["objects"]:
        category = classify_material(item["label"], item["confidence"])
        detected_objects.append({
            "label": item["label"],
            "confidence": round(item["confidence"], 3),
            "category": category,
            "bbox": item["bbox"],
            "bbox_normalized": item.get("bbox_normalized"),
            "source": result.get("source", "demo"),
        })

    return {
        "image_path": str(upload_path),
        "source": result.get("source", "demo"),
        "objects": detected_objects,
        "annotated_image": result.get("annotated_image"),
        "status": result.get("status", "demo"),
        "message": result.get("message"),
    }
