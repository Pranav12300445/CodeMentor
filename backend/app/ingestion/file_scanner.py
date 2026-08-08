import os


IGNORED_DIRECTORIES = {
    ".git",
    ".svn",
    ".hg",
    "node_modules",
    "__pycache__",
    ".venv",
    "venv",
    "env",
    "target",
    "build",
    "dist",
    ".idea",
    ".vscode",
    "coverage",
    ".next",
    ".gradle"
}


BINARY_EXTENSIONS = {
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".bmp",
    ".webp",
    ".ico",

    ".mp3",
    ".wav",
    ".mp4",
    ".avi",
    ".mkv",
    ".mov",

    ".zip",
    ".rar",
    ".7z",
    ".tar",
    ".gz",

    ".exe",
    ".dll",
    ".so",
    ".dylib",

    ".class",
    ".pyc",

    ".pdf",
    ".doc",
    ".docx",
    ".xls",
    ".xlsx",

    ".ttf",
    ".otf",
    ".woff",
    ".woff2"
}


def scan_repository(repository_path: str):

    files = []

    for root, directories, filenames in os.walk(repository_path):

        directories[:] = [
            directory
            for directory in directories
            if directory not in IGNORED_DIRECTORIES
        ]

        for filename in filenames:

            file_path = os.path.join(root, filename)

            extension = os.path.splitext(
                filename
            )[1].lower()

            if extension in BINARY_EXTENSIONS:
                continue

            relative_path = os.path.relpath(
                file_path,
                repository_path
            )

            files.append(relative_path)

    return files