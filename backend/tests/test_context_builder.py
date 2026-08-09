from app.retrieval.context_builder import ContextBuilder


def test_context_builder():

    results = [
        {
            "file_path": "src/AuthService.java",
            "language": "Java",
            "node_type": "method",
            "name": "authenticate",
            "parent": "AuthService",
            "start_line": 10,
            "end_line": 25,
            "hybrid_score": 0.91,
            "code": "public void authenticate() {}"
        },
        {
            "file_path": "src/JwtFilter.java",
            "language": "Java",
            "node_type": "class",
            "name": "JwtFilter",
            "parent": None,
            "start_line": 1,
            "end_line": 40,
            "hybrid_score": 0.85,
            "code": "public class JwtFilter {}"
        }
    ]

    builder = ContextBuilder()

    result = builder.build(results)

    assert result["chunk_count"] == 2

    assert "AuthService.java" in result["context"]

    assert "JwtFilter.java" in result["context"]

    assert "authenticate" in result["context"]


def test_duplicate_chunks_are_removed():

    chunk = {
        "file_path": "test.py",
        "language": "Python",
        "node_type": "function",
        "name": "hello",
        "start_line": 1,
        "end_line": 3,
        "code": "def hello(): pass"
    }

    builder = ContextBuilder()

    result = builder.build([
        chunk,
        chunk
    ])

    assert result["chunk_count"] == 1


def test_context_limit():

    builder = ContextBuilder(
        max_chars=100
    )

    results = [
        {
            "file_path": "large.py",
            "language": "Python",
            "node_type": "function",
            "name": "large_function",
            "start_line": 1,
            "end_line": 100,
            "code": "x" * 1000
        }
    ]

    result = builder.build(results)

    assert result["chunk_count"] == 0