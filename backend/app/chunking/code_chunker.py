from typing import List

from app.chunking.metadata import CodeStructure


MAX_CHUNK_SIZE = 12000


def create_code_chunks(
    structures: List[CodeStructure]
) -> List[CodeStructure]:

    chunks = []

    for structure in structures:

        if not structure.code.strip():
            continue

        if len(structure.code) <= MAX_CHUNK_SIZE:
            chunks.append(structure)
            continue

        chunks.extend(
            _split_large_structure(structure)
        )

    return chunks


def _split_large_structure(
    structure: CodeStructure
) -> List[CodeStructure]:

    code = structure.code

    chunks = []

    for start in range(
        0,
        len(code),
        MAX_CHUNK_SIZE
    ):

        part = code[
            start:start + MAX_CHUNK_SIZE
        ]

        chunks.append(
            CodeStructure(
                language=structure.language,
                file_path=structure.file_path,
                node_type=structure.node_type,
                name=structure.name,
                parent=structure.parent,
                start_line=structure.start_line,
                end_line=structure.end_line,
                start_byte=structure.start_byte,
                end_byte=structure.end_byte,
                code=part
            )
        )

    return chunks