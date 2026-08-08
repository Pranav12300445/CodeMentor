import os


IGNORED_DIRECTORIES = {
    ".git",
    "node_modules",
    "__pycache__",
    ".venv",
    "venv",
    "env",
    "target",
    "build",
    "dist",
    ".idea",
    ".vscode"
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

            relative_path = os.path.relpath(
                file_path,
                repository_path
            )

            files.append(relative_path)

    return files