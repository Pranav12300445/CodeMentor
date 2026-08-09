import os

from dotenv import load_dotenv
from google import genai

from app.llm.base import BaseLLM


load_dotenv()


class GeminiProvider(BaseLLM):

    def __init__(
        self,
        model: str | None = None
    ):

        api_key = os.getenv("GEMINI_API_KEY")

        if not api_key:
            raise ValueError(
                "GEMINI_API_KEY is not configured"
            )

        self.client = genai.Client(
            api_key=api_key
        )

        self.model = model or os.getenv(
            "GEMINI_MODEL",
            "gemini-3.5-flash"
        )

    def generate(
        self,
        system_prompt: str,
        user_prompt: str
    ) -> str:

        response = self.client.models.generate_content(
            model=self.model,
            contents=user_prompt,
            config={
                "system_instruction": system_prompt
            }
        )

        return response.text