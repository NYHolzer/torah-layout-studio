from __future__ import annotations

from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship, JSON
import uuid

from .schemas import Block  # pydantic union of TextBlock/ImageBlock


def _uuid() -> str:
    return str(uuid.uuid4())


class ProjectModel(SQLModel, table=True):
    __tablename__ = "projects"

    id: str = Field(default_factory=_uuid, primary_key=True, index=True)
    name: str
    description: Optional[str] = None

    documents: List["DocumentModel"] = Relationship(back_populates="project")


class DocumentModel(SQLModel, table=True):
    __tablename__ = "documents"

    id: str = Field(default_factory=_uuid, primary_key=True, index=True)
    project_id: str = Field(foreign_key="projects.id", index=True)

    title: str
    description: Optional[str] = None

    # Store blocks as JSON; we’ll convert to/from pydantic Block objects
    blocks: Optional[list] = Field(default=None, sa_column=JSON)

    project: Optional[ProjectModel] = Relationship(back_populates="documents")

    def get_blocks(self) -> List[Block]:
        if not self.blocks:
            return []
        # schemas.Block is a discriminated union; pydantic will validate each dict
        from .schemas import Block as BlockUnion  # avoid cycle

        return [BlockUnion.model_validate(b) for b in self.blocks]

    def set_blocks(self, blocks: List[Block]) -> None:
        # store as plain dicts
        self.blocks = [b.model_dump() for b in blocks]
