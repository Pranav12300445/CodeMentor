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
    MatchValue
)


QDRANT_URL = os.getenv(
    "QDRANT_URL",
    "http://localhost:6333"
)

COLLECTION_NAME = os.getenv(
    "QDRANT_COLLECTION",
    "codementor_code"
)


class QdrantService:

    def __init__(self):
        self.client = QdrantClient(
            url=QDRANT_URL
        )

    def create_collection(
        self,
        vector_size: int
    ):

        existing_collections = (
            self.client.get_collections()
        )

        collection_names = [
            collection.name
            for collection in existing_collections.collections
        ]

        if COLLECTION_NAME in collection_names:
            return

        self.client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(
                size=vector_size,
                distance=Distance.COSINE
            )
        )

    def upsert_chunks(
        self,
        vectors: List[List[float]],
        payloads: List[Dict[str, Any]]
    ):

        if len(vectors) != len(payloads):
            raise ValueError(
                "Number of vectors and payloads must match"
            )

        points = []

        for vector, payload in zip(
            vectors,
            payloads
        ):

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

    def collection_exists(self) -> bool:

        collections = self.client.get_collections()

        return COLLECTION_NAME in [
            collection.name
            for collection in collections.collections
        ]

    def get_collection_info(self):

        return self.client.get_collection(
            collection_name=COLLECTION_NAME
        )

    def search(
        self,
        vector: List[float],
        repository_id: str,
        limit: int = 5
    ):

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