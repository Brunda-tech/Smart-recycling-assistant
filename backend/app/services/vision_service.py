from __future__ import annotations

from pathlib import Path

from app.config import get_settings

settings = get_settings()


def _load_model():
    try:
        from ultralytics import YOLO
    except ImportError as exc:
        return None, f"Ultralytics is not installed: {exc}"

    model_path = settings.model_path or "yolo11n.pt"
    try:
        return YOLO(model_path), None
    except (OSError, RuntimeError, ValueError) as exc:
        return None, f"Could not load YOLO weights '{model_path}': {exc}"


def process_image(image_path: str) -> dict:
    image_file = Path(image_path)
    if not image_file.exists():
        raise FileNotFoundError(f"Image not found: {image_path}")

    model, model_error = _load_model()
    if model is None:
        return {
            "source": "unavailable",
            "status": "model_unavailable",
            "message": f"{model_error}. Configure MODEL_PATH or enable a network connection to download yolo11n.pt. No simulated predictions were generated.",
            "objects": [],
            "annotated_image": str(image_file),
        }

    results = model(str(image_file), conf=0.4, verbose=False)
    detections: list[dict] = []
    for result in results:
        image_height, image_width = result.orig_shape
        for box in result.boxes:
            x1, y1, x2, y2 = [float(value) for value in box.xyxy[0].tolist()]
            label = result.names[int(box.cls[0])]
            confidence = float(box.conf[0])
            detections.append({
                "label": label,
                "confidence": confidence,
                "bbox": [round(x1, 2), round(y1, 2), round(x2, 2), round(y2, 2)],
                "bbox_normalized": [
                    round(x1 / image_width, 6),
                    round(y1 / image_height, 6),
                    round(x2 / image_width, 6),
                    round(y2 / image_height, 6),
                ],
                "source": "model",
            })
    return {
        "source": "model",
        "status": "processed" if detections else "no_detections",
        "objects": detections,
        "annotated_image": str(image_file),
    }
