import os
import uuid
from typing import List, Dict, Any

from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    VectorParams,
    PointStruct,
    Filter,
    FieldCondition,
    MatchValue,
    FilterSelector
)


QDRANT_URL = os.getenv(
    "QDRANT_URL",
    "http://localhost:6333"
)

COLLECTION_NAME = os.getenv(
    "QDRANT_COLLECTION",
    "codementor_code"
)

EMBEDDING_DIMENSION = int(
    os.getenv(
        "EMBEDDING_DIMENSION",
        "768"
    )
)


class QdrantService:

    def __init__(self):

        self.client = QdrantClient(
            url=QDRANT_URL
        )

        # Automatically create collection
        # if it does not exist.
        self.create_collection(
            vector_size=EMBEDDING_DIMENSION
        )

    # --------------------------------------------------
    # COLLECTION
    # --------------------------------------------------

    def create_collection(
        self,
        vector_size: int
    ):

        if self.collection_exists():
            return

        self.client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(
                size=vector_size,
                distance=Distance.COSINE
            )
        )

    def collection_exists(self) -> bool:

        collections = self.client.get_collections()

        return COLLECTION_NAME in [
            collection.name
            for collection in collections.collections
        ]

    def get_collection_info(self):

        if not self.collection_exists():
            return None

        return self.client.get_collection(
            collection_name=COLLECTION_NAME
        )

    # --------------------------------------------------
    # INSERT / UPSERT
    # --------------------------------------------------

    def upsert_chunks(
        self,
        vectors: List[List[float]],
        payloads: List[Dict[str, Any]]
    ):

        if len(vectors) != len(payloads):

            raise ValueError(
                "Number of vectors and payloads must match"
            )

        if not vectors:
            return 0

        points = []

        for vector, payload in zip(
            vectors,
            payloads
        ):

            if len(vector) != EMBEDDING_DIMENSION:

                raise ValueError(
                    f"Expected embedding dimension "
                    f"{EMBEDDING_DIMENSION}, "
                    f"got {len(vector)}"
                )

            points.append(
                PointStruct(
                    id=str(uuid.uuid4()),
                    vector=vector,
                    payload=payload
                )
            )

        self.client.upsert(
            collection_name=COLLECTION_NAME,
            points=points
        )

        return len(points)

    # --------------------------------------------------
    # SEARCH
    # --------------------------------------------------

    def search(
        self,
        vector: List[float],
        repository_id: str,
        limit: int = 5
    ):

        if len(vector) != EMBEDDING_DIMENSION:

            raise ValueError(
                f"Expected embedding dimension "
                f"{EMBEDDING_DIMENSION}, "
                f"got {len(vector)}"
            )

        if not repository_id:
            raise ValueError(
                "Repository ID must be provided"
            )

        search_filter = Filter(
            must=[
                FieldCondition(
                    key="repository_id",
                    match=MatchValue(
                        value=repository_id
                    )
                )
            ]
        )

        return self.client.query_points(
            collection_name=COLLECTION_NAME,
            query=vector,
            query_filter=search_filter,
            limit=limit,
            with_payload=True
        )

    # --------------------------------------------------
    # DELETE REPOSITORY
    # --------------------------------------------------

    def delete_repository(
        self,
        repository_id: str
    ) -> int:

        if not repository_id:
            raise ValueError(
                "Repository ID must be provided"
            )

        if not isinstance(repository_id, str):
            raise TypeError(
                "Repository ID must be a string"
            )

        repository_id = repository_id.strip()

        if not repository_id:
            raise ValueError(
                "Repository ID cannot be empty or whitespace"
            )

        # Collection may not exist.
        # Treat that as nothing to delete.
        if not self.collection_exists():
            return 0

        search_filter = Filter(
            must=[
                FieldCondition(
                    key="repository_id",
                    match=MatchValue(
                        value=repository_id
                    )
                )
            ]
        )

        # First find matching points so we know
        # how many points are being deleted.
        points, _ = self.client.scroll(
            collection_name=COLLECTION_NAME,
            scroll_filter=search_filter,
            limit=10000,
            with_payload=False,
            with_vectors=False
        )

        deleted_count = len(points)

        if deleted_count == 0:
            return 0

        self.client.delete(
            collection_name=COLLECTION_NAME,
            points_selector=FilterSelector(
                filter=search_filter
            ),
            wait=True
        )

        return deleted_count