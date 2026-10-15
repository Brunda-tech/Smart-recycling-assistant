import sqlite3
from contextlib import contextmanager
from pathlib import Path

from app.config import PROJECT_ROOT, get_settings


settings = get_settings()
DB_PATH = Path(settings.database_path)
if not DB_PATH.is_absolute():
    DB_PATH = (PROJECT_ROOT / DB_PATH).resolve()


def init_db() -> None:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("PRAGMA foreign_keys = ON")
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS materials (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                object_label TEXT NOT NULL,
                waste_category TEXT NOT NULL,
                confidence REAL DEFAULT 0.0,
                estimated_weight REAL DEFAULT 0.0,
                current_stage TEXT NOT NULL,
                final_destination TEXT,
                detection_timestamp TEXT NOT NULL,
                last_updated TEXT NOT NULL,
                source TEXT DEFAULT 'manual',
                status TEXT DEFAULT 'active',
                notes TEXT
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                material_id INTEGER NOT NULL,
                event_type TEXT NOT NULL,
                from_stage TEXT,
                to_stage TEXT,
                message TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY(material_id) REFERENCES materials(id)
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS detections (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                material_id INTEGER,
                label TEXT NOT NULL,
                confidence REAL DEFAULT 0.0,
                x1 REAL,
                y1 REAL,
                x2 REAL,
                y2 REAL,
                source TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY(material_id) REFERENCES materials(id)
            )
            """
        )
        conn.commit()


@contextmanager
def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()
