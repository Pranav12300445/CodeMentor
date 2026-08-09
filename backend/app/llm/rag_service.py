from app.llm.provider import GeminiProvider
from app.llm.prompts import (
    SYSTEM_PROMPT,
    USER_PROMPT_TEMPLATE
)
from app.retrieval.hybrid_search import HybridSearch
from app.retrieval.context_builder import ContextBuilder


class RAGService:

    def __init__(self):

        self.search = HybridSearch()

        self.context_builder = ContextBuilder()

        self.llm = GeminiProvider()

    def answer(
        self,
        question: str,
        repository_id: str,
        top_k: int = 5
    ):

        # Step 1: Retrieve relevant code
        search_results = self.search.search(
            query=question,
            repository_id=repository_id,
            top_k=top_k
        )

        # Step 2: Build LLM context
        context_data = self.context_builder.build(
            search_results
        )

        # Step 3: Generate prompt
        user_prompt = USER_PROMPT_TEMPLATE.format(
            question=question,
            context=context_data["context"]
        )

        # Step 4: Ask LLM
        answer = self.llm.generate(
            system_prompt=SYSTEM_PROMPT,
            user_prompt=user_prompt
        )

        return {
            "answer": answer,
            "repository_id": repository_id,
            "question": question,
            "sources": context_data["chunks"],
            "source_count": context_data["chunk_count"]
        }