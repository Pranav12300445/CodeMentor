from abc import ABC, abstractmethod
from typing import List

from app.chunking.metadata import CodeStructure


class BaseParser(ABC):

    @abstractmethod
    def parse(
        self,
        source_code: str,
        language: str,
        file_path: str = ""
    ) -> List[CodeStructure]:
        """
        Parse source code and return normalized code structures.
        """
        pass