from fastapi.testclient import TestClient

from app.main import app
from app.services.classification_service import classify_material

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_add_material():
    payload = {
        "object_label": "plastic bottle",
        "waste_category": "recyclable",
        "confidence": 0.91,
        "estimated_weight": 0.45,
        "current_stage": "collection",
        "source": "demo"
    }
    response = client.post("/api/materials", json=payload)
    assert response.status_code == 200
    assert response.json()["object_label"] == "plastic bottle"


def test_get_materials():
    response = client.get("/api/materials")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_move_material_between_stages():
    material_response = client.post("/api/materials", json={
        "object_label": "apple",
        "waste_category": "biodegradable",
        "confidence": 0.82,
        "estimated_weight": 0.35,
        "current_stage": "collection",
        "source": "demo"
    })
    material_id = material_response.json()["id"]
    response = client.post("/api/twin/move", json={"material_id": material_id, "next_stage": "sorting"})
    assert response.status_code == 200
    assert response.json()["material"]["current_stage"] == "sorting"


def test_twin_summary():
    response = client.get("/api/twin/summary")
    assert response.status_code == 200
    assert "total_items" in response.json()


def test_ai_fallback_response():
    response = client.post("/api/ai/chat", json={"message": "How can I reduce waste?"})
    assert response.status_code == 200
    data = response.json()
    assert "response" in data
    assert data["source"] in {"fallback", "live_llm"}


def test_uncertain_or_unsupported_object_requires_review():
    assert classify_material("apple", 0.55) == "review"
    assert classify_material("bottle", 0.94) == "review"
    assert classify_material("apple", 0.9) == "biodegradable"
