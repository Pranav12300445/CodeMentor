import os


LANGUAGE_EXTENSIONS = {

    ".py": "Python",

    ".java": "Java",

    ".js": "JavaScript",
    ".jsx": "JavaScript",

    ".ts": "TypeScript",
    ".tsx": "TypeScript",

    ".c": "C",

    ".cpp": "C++",
    ".cc": "C++",
    ".cxx": "C++",
    ".h": "C/C++",
    ".hpp": "C++",

    ".cs": "C#",

    ".go": "Go",

    ".rs": "Rust",

    ".php": "PHP",

    ".kt": "Kotlin",
    ".kts": "Kotlin",

    ".swift": "Swift",

    ".dart": "Dart",

    ".rb": "Ruby",

    ".sql": "SQL",

    ".html": "HTML",

    ".css": "CSS",

    ".scss": "SCSS",

    ".sh": "Shell",

    ".xml": "XML",

    ".json": "JSON",

    ".yaml": "YAML",
    ".yml": "YAML",

    ".md": "Markdown"
}


def detect_language(filename: str):

    extension = os.path.splitext(filename)[1].lower()

    return LANGUAGE_EXTENSIONS.get(
        extension,
        "Unknown"
    )