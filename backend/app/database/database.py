import sqlite3
from pathlib import Path


DATABASE_PATH = (
    Path(__file__).resolve()
    .parents[2]
    / "codementor.db"
)


def get_connection() -> sqlite3.Connection:

    connection = sqlite3.connect(
        DATABASE_PATH
    )

    connection.row_factory = sqlite3.Row

    return connection


def initialize_database():

    connection = get_connection()

    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS repositories (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            original_filename TEXT,
            path TEXT NOT NULL,
            status TEXT NOT NULL,
            total_files INTEGER DEFAULT 0,
            processed_files INTEGER DEFAULT 0,
            skipped_files INTEGER DEFAULT 0,
            total_chunks INTEGER DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
        """
    )

    connection.commit()
    connection.close()