SUPPORTED_CLASSES = {
    "apple": "biodegradable",
    "banana": "biodegradable",
    "orange": "biodegradable",
    "broccoli": "biodegradable",
    "carrot": "biodegradable",
}


def classify_material(label: str, confidence: float) -> str:
    normalized = label.lower().strip()
    if confidence < 0.6:
        return "review"
    if normalized in SUPPORTED_CLASSES:
        return SUPPORTED_CLASSES[normalized]
    return "review"
