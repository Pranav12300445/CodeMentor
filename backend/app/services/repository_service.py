from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional
import shutil
import logging

logger = logging.getLogger(__name__)

from app.database.database import get_connection
from app.vector_store.qdrant_service import QdrantService


class RepositoryService:

    def __init__(self):
        self.qdrant = QdrantService()

    # --------------------------------------------------
    # CREATE
    # --------------------------------------------------

    def create(
        self,
        repository_id: str,
        name: str,
        original_filename: str,
        path: str
    ):

        now = datetime.now(timezone.utc).isoformat()

        connection = get_connection()

        try:
            connection.execute(
                """
                INSERT INTO repositories (
                    id,
                    name,
                    original_filename,
                    path,
                    status,
                    created_at,
                    updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    repository_id,
                    name,
                    original_filename,
                    path,
                    "processing",
                    now,
                    now
                )
            )

            connection.commit()

        finally:
            connection.close()

    # --------------------------------------------------
    # UPDATE STATUS
    # --------------------------------------------------

    def update_status(
        self,
        repository_id: str,
        status: str,
        total_files: int = 0,
        processed_files: int = 0,
        skipped_files: int = 0,
        total_chunks: int = 0
    ):

        now = datetime.now(timezone.utc).isoformat()

        connection = get_connection()

        try:
            connection.execute(
                """
                UPDATE repositories
                SET
                    status = ?,
                    total_files = ?,
                    processed_files = ?,
                    skipped_files = ?,
                    total_chunks = ?,
                    updated_at = ?
                WHERE id = ?
                """,
                (
                    status,
                    total_files,
                    processed_files,
                    skipped_files,
                    total_chunks,
                    now,
                    repository_id
                )
            )

            connection.commit()

        finally:
            connection.close()

    # --------------------------------------------------
    # GET
    # --------------------------------------------------

    def get(
        self,
        repository_id: str
    ) -> Optional[dict[str, Any]]:

        connection = get_connection()

        try:
            row = connection.execute(
                """
                SELECT *
                FROM repositories
                WHERE id = ?
                """,
                (repository_id,)
            ).fetchone()

        finally:
            connection.close()

        if row is None:
            return None

        return dict(row)

    # --------------------------------------------------
    # LIST
    # --------------------------------------------------

    def list_all(self) -> list[dict[str, Any]]:

        connection = get_connection()

        try:
            rows = connection.execute(
                """
                SELECT *
                FROM repositories
                ORDER BY created_at DESC
                """
            ).fetchall()

        finally:
            connection.close()

        return [
            dict(row)
            for row in rows
        ]

    # --------------------------------------------------
    # DELETE
    # --------------------------------------------------

    def delete(
        self,
        repository_id: str
    ) -> bool:

        # ----------------------------------------------
        # 1. Get repository metadata
        # ----------------------------------------------

        repository = self.get(repository_id)

        if repository is None:
            return False

        repository_path = Path(repository["path"])

        # ----------------------------------------------
        # 2. Delete Qdrant vectors
        # ----------------------------------------------

        try:

            if self.qdrant.collection_exists():

                self.qdrant.delete_repository(
                    repository_id
                )

        except Exception as exc:

            raise RuntimeError(
                f"Failed to delete Qdrant data: {exc}"
            ) from exc

        # ----------------------------------------------
        # 3. Delete repository files
        # ----------------------------------------------

        if repository_path.exists():

            try:

                shutil.rmtree(repository_path)

            except Exception as exc:

                raise RuntimeError(
                    f"Failed to delete repository files: {exc}"
                ) from exc

        # ----------------------------------------------
        # 4. Delete uploaded files (data/uploads/<id>)
        # ----------------------------------------------

        from app.ingestion.repository_loader import (
            UPLOAD_DIR
        )

        upload_path = UPLOAD_DIR / repository_id

        if upload_path.exists():

            try:

                shutil.rmtree(upload_path)

            except Exception as exc:

                logger.warning(
                    "Failed to delete upload files "
                    "for %s: %s",
                    repository_id,
                    exc
                )

        # ----------------------------------------------
        # 5. Delete SQLite metadata
        # ----------------------------------------------

        connection = get_connection()

        try:

            cursor = connection.execute(
                """
                DELETE FROM repositories
                WHERE id = ?
                """,
                (repository_id,)
            )

            connection.commit()

            return cursor.rowcount > 0

        finally:
            connection.close()

    # --------------------------------------------------
    # DELETE ALL
    # --------------------------------------------------

    def delete_all(self) -> dict:
        """
        Delete ALL data from Qdrant, data folders,
        and SQLite database.
        """

        errors = []

        # ----------------------------------------------
        # 1. Clear Qdrant collection
        # ----------------------------------------------

        try:

            if self.qdrant.collection_exists():

                from app.vector_store.qdrant_service import (
                    COLLECTION_NAME,
                    EMBEDDING_DIMENSION
                )

                self.qdrant.client.delete_collection(
                    collection_name=COLLECTION_NAME
                )

                self.qdrant.create_collection(
                    vector_size=EMBEDDING_DIMENSION
                )

        except Exception as exc:

            logger.error(
                "Failed to clear Qdrant: %s", exc
            )
            errors.append(
                f"Qdrant: {exc}"
            )

        # ----------------------------------------------
        # 2. Clear data folders
        # ----------------------------------------------

        from app.ingestion.repository_loader import (
            UPLOAD_DIR,
            REPOSITORY_DIR
        )

        for data_dir in [UPLOAD_DIR, REPOSITORY_DIR]:

            if data_dir.exists():

                try:

                    for child in data_dir.iterdir():

                        if child.name == ".gitkeep":
                            continue

                        if child.is_dir():
                            shutil.rmtree(child)
                        else:
                            child.unlink()

                except Exception as exc:

                    logger.error(
                        "Failed to clear %s: %s",
                        data_dir,
                        exc
                    )
                    errors.append(
                        f"Data folder {data_dir}: {exc}"
                    )

        # ----------------------------------------------
        # 3. Clear SQLite database
        # ----------------------------------------------

        connection = get_connection()

        try:

            cursor = connection.execute(
                """
                DELETE FROM repositories
                """
            )

            deleted_count = cursor.rowcount

            connection.commit()

        except Exception as exc:

            logger.error(
                "Failed to clear database: %s", exc
            )
            errors.append(
                f"SQLite: {exc}"
            )
            deleted_count = 0

        finally:
            connection.close()

        return {
            "deleted_repositories": deleted_count,
            "errors": errors
        }