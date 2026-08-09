from typing import List

from sentence_transformers import SentenceTransformer


MODEL_NAME = "BAAI/bge-base-en-v1.5"


class EmbeddingService:

    def __init__(self):
        self.model = SentenceTransformer(
            MODEL_NAME
        )

        self.model.max_seq_length = 512

    def embed_text(self, text: str) -> List[float]:

        embedding = self.model.encode(
            text,
            normalize_embeddings=True
        )

        return embedding.tolist()

    def embed_texts(
        self,
        texts: List[str]
    ) -> List[List[float]]:

        embeddings = self.model.encode(
            texts,
            normalize_embeddings=True,
            show_progress_bar=True
        )

        return embeddings.tolist()

    @property
    def dimension(self) -> int:
        return 768