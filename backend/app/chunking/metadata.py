from dataclasses import dataclass, asdict
from typing import Optional


@dataclass
class CodeStructure:
    language: str
    file_path: str
    node_type: str
    name: Optional[str]
    parent: Optional[str]

    start_line: int
    end_line: int

    start_byte: int
    end_byte: int

    code: str

    def to_dict(self):
        return asdict(self)