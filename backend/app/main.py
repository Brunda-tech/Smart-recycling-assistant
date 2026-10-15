from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.database import init_db
from app.routers import analytics, ai, detection, digital_twin, materials

settings = get_settings()
init_db()

app = FastAPI(title=settings.app_name, version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(detection.router, prefix="/api")
app.include_router(materials.router, prefix="/api")
app.include_router(digital_twin.router, prefix="/api")
app.include_router(ai.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")


@app.on_event("startup")
def startup_event() -> None:
    init_db()


@app.post("/api/demo/load")
def load_demo_data() -> dict:
    from app.database import get_db_connection

    demo_items = [
        ("plastic bottle", "recyclable", 0.94, 0.45, "collection", "recycling", "demo"),
        ("battery", "hazardous", 0.89, 0.25, "sorting", "safe_disposal", "demo"),
        ("apple", "biodegradable", 0.82, 0.38, "processing", "composting", "demo"),
        ("shirt", "reusable", 0.87, 0.7, "recovery", "reuse", "demo"),
    ]

    with get_db_connection() as conn:
        conn.execute("DELETE FROM events")
        conn.execute("DELETE FROM materials")
        for label, category, confidence, weight, stage, destination, source in demo_items:
            timestamp = __import__('datetime').datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')
            conn.execute(
                "INSERT INTO materials (object_label, waste_category, confidence, estimated_weight, current_stage, final_destination, detection_timestamp, last_updated, source, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', 'demo data loaded')",
                (label, category, confidence, weight, stage, destination, timestamp, timestamp, source),
            )
        conn.execute(
            "INSERT INTO events (material_id, event_type, from_stage, to_stage, message, created_at) VALUES (?, 'stage_move', 'collection', 'sorting', 'Plastic bottle moved to sorting', ?)",
            (1, timestamp),
        )
        conn.execute(
            "INSERT INTO events (material_id, event_type, from_stage, to_stage, message, created_at) VALUES (?, 'stage_move', 'sorting', 'recovery', 'Battery routed to safe disposal', ?)",
            (2, timestamp),
        )
        conn.commit()
    return {"status": "demo_loaded", "items": len(demo_items)}


@app.post("/api/demo/reset")
def reset_demo_data() -> dict:
    from app.database import get_db_connection
    with get_db_connection() as conn:
        conn.execute("DELETE FROM events")
        conn.execute("DELETE FROM materials")
        conn.commit()
    return {"status": "demo_reset"}


@app.get("/api/health")
def health_check() -> dict:
    return {"status": "ok", "app": settings.app_name, "environment": settings.app_env}
