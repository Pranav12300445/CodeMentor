from typing import List, Optional

from tree_sitter_language_pack import get_parser

from app.parsers.base_parser import BaseParser
from app.chunking.metadata import CodeStructure


class TreeSitterParser(BaseParser):

    LANGUAGE_ALIASES = {
        "c++": "cpp",
        "c/c++": "cpp",
        "c#": "c_sharp",
        "javascript": "javascript",
        "typescript": "typescript",
        "python": "python",
        "java": "java",
        "go": "go",
        "rust": "rust",
        "php": "php",
        "kotlin": "kotlin",
        "swift": "swift",
        "dart": "dart",
        "ruby": "ruby",
        "sql": "sql",
        "html": "html",
        "css": "css",
        "shell": "bash"
    }

    STRUCTURE_TYPES = {

        # Classes
        "class_definition": "class",
        "class_declaration": "class",
        "class_specifier": "class",

        # Functions / methods
        "function_definition": "function",
        "function_declaration": "function",
        "function_item": "function",
        "method_definition": "method",
        "method_declaration": "method",

        # Interfaces
        "interface_declaration": "interface",
        "interface_definition": "interface",

        # Structs
        "struct_specifier": "struct",
        "struct_item": "struct",
        "struct_declaration": "struct",

        # Enums
        "enum_specifier": "enum",
        "enum_item": "enum",
        "enum_declaration": "enum",

        # Imports
        "import_statement": "import",
        "import_declaration": "import",
        "use_declaration": "import",

        # Exports
        "export_statement": "export",

        # Namespaces / modules
        "namespace_definition": "namespace",
        "namespace_declaration": "namespace",
        "module": "module",
    }

    def parse(
        self,
        source_code: str,
        language: str,
        file_path: str = ""
    ) -> List[CodeStructure]:

        parser_language = self._normalize_language(language)

        if not parser_language:
            raise ValueError(
                f"Unsupported language: {language}"
            )

        try:
            parser = get_parser(parser_language)
        except Exception as exc:
            raise ValueError(
                f"Unable to load Tree-sitter parser "
                f"for language '{language}': {exc}"
            ) from exc

        source_bytes = source_code.encode("utf-8")

        try:
            tree = parser.parse(source_bytes)
        except Exception as exc:
            raise ValueError(
                f"Failed to parse {file_path}: {exc}"
            ) from exc

        root = tree.root_node

        structures = []

        self._walk_tree(
            node=root,
            source_bytes=source_bytes,
            language=language,
            file_path=file_path,
            structures=structures,
            parent_name=None
        )

        return structures

    def _walk_tree(
        self,
        node,
        source_bytes: bytes,
        language: str,
        file_path: str,
        structures: List[CodeStructure],
        parent_name: Optional[str]
    ):

        normalized_type = self.STRUCTURE_TYPES.get(
            node.type
        )

        current_name = self._get_node_name(
            node,
            source_bytes
        )

        current_parent = parent_name

        if normalized_type:

            code = source_bytes[
                node.start_byte:node.end_byte
            ].decode(
                "utf-8",
                errors="replace"
            )

            structure = CodeStructure(
                language=language,
                file_path=file_path,
                node_type=normalized_type,
                name=current_name,
                parent=parent_name,
                start_line=node.start_point[0] + 1,
                end_line=node.end_point[0] + 1,
                start_byte=node.start_byte,
                end_byte=node.end_byte,
                code=code
            )

            structures.append(structure)

            if current_name:
                current_parent = current_name

        for child in node.children:
            self._walk_tree(
                node=child,
                source_bytes=source_bytes,
                language=language,
                file_path=file_path,
                structures=structures,
                parent_name=current_parent
            )

    @staticmethod
    def _get_node_name(
        node,
        source_bytes: bytes
    ) -> Optional[str]:

        name_node = node.child_by_field_name("name")

        if name_node is None:
            return None

        return source_bytes[
            name_node.start_byte:name_node.end_byte
        ].decode(
            "utf-8",
            errors="replace"
        )

    @classmethod
    def _normalize_language(
        cls,
        language: str
    ) -> Optional[str]:

        if not language:
            return None

        normalized = language.strip().lower()

        return cls.LANGUAGE_ALIASES.get(
            normalized
        )