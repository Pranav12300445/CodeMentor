from typing import Any


DEFAULT_MAX_CHARS = 30000


class ContextBuilder:

    def __init__(
        self,
        max_chars: int = DEFAULT_MAX_CHARS
    ):
        self.max_chars = max_chars

    def build(
        self,
        results: list[dict[str, Any]]
    ) -> dict[str, Any]:

        selected_chunks = []
        seen = set()
        current_chars = 0

        for result in results:

            key = self._chunk_key(result)

            # Avoid duplicate chunks
            if key in seen:
                continue

            code = str(
                result.get("code") or ""
            )

            if not code.strip():
                continue

            context_block = self._format_chunk(
                result,
                len(selected_chunks) + 1
            )

            block_size = len(context_block)

            # Stop once context limit is reached
            if (
                current_chars + block_size
                > self.max_chars
            ):
                break

            selected_chunks.append({
                "index": len(selected_chunks) + 1,
                "file_path": result.get("file_path"),
                "language": result.get("language"),
                "node_type": result.get("node_type"),
                "name": result.get("name"),
                "parent": result.get("parent"),
                "start_line": result.get("start_line"),
                "end_line": result.get("end_line"),
                "score": result.get("hybrid_score", result.get("score")),
                "code": code
            })

            seen.add(key)
            current_chars += block_size

        context = "\n\n".join(
            self._format_chunk(
                chunk,
                chunk["index"]
            )
            for chunk in selected_chunks
        )

        return {
            "context": context,
            "chunks": selected_chunks,
            "chunk_count": len(selected_chunks),
            "character_count": len(context)
        }

    @staticmethod
    def _chunk_key(
        result: dict[str, Any]
    ) -> str:

        return (
            f"{result.get('file_path')}:"
            f"{result.get('start_line')}:"
            f"{result.get('end_line')}"
        )

    @staticmethod
    def _format_chunk(
        result: dict[str, Any],
        index: int
    ) -> str:

        language = (
            result.get("language")
            or "Unknown"
        )

        file_path = (
            result.get("file_path")
            or "Unknown"
        )

        node_type = (
            result.get("node_type")
            or "code"
        )

        name = (
            result.get("name")
            or "anonymous"
        )

        start_line = (
            result.get("start_line")
            or "?"
        )

        end_line = (
            result.get("end_line")
            or "?"
        )

        code = (
            result.get("code")
            or ""
        )

        return (
            f"[{index}] {file_path}\n"
            f"Language: {language}\n"
            f"Type: {node_type}\n"
            f"Name: {name}\n"
            f"Lines: {start_line}-{end_line}\n\n"
            f"```{language.lower()}\n"
            f"{code}\n"
            f"```\n"
        )