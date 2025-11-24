from typing import Optional, List, Literal, Union
from pydantic import BaseModel, Field
from uuid import UUID, uuid4

# ---------------------------
# Project Schemas
# ---------------------------

class ProjectBase(BaseModel):
    """
    Base fields shared by all project representations.
    For now, a project is just a name and an optional description.
    Later we’ll add styles, layout templates, etc.
    """
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=1000)


class ProjectCreate(ProjectBase):
    """
    Fields allowed/required when creating a new project.
    For now, identical to ProjectBase.
    """
    pass


class Project(ProjectBase):
    """
    Project as stored/returned by the API.
    Includes a generated UUID.
    """
    id: UUID

    @classmethod
    def new(cls, **data: object) -> "Project":
        """
        Helper to create a new project with a fresh UUID.
        """
        return cls(id=uuid4(), **data)

# ---------------------------
# Block Schemas (text + image)
# ---------------------------

class BlockBase(BaseModel):
    """
    Base block fields shared by all block types.

    - kind: "text" or "image" (in the future, maybe "table", "code", etc.)
    - role: semantic/style role like "haggadah_main_hebrew", "commentary_en",
      "footnote_he", "archaeology_fig", etc.
    """
    kind: Literal["text", "image"]
    role: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="Semantic/style role used for layout and styling templates.",
    )

class TextBlock(BlockBase):
    kind: Literal["text"] = "text"
    text: str = Field(..., min_length=1)

class ImageBlock(BlockBase):
    kind: Literal["image"] = "image"
    src: str = Field(
        ...,
        description="Path or URL to the image. For now we’ll keep this simple.",
    )
    alt_text: Optional[str] = Field(
        default=None,
        description="Short description for accessibility / captions.",
        max_length=300,
    )
    alignment: Optional[Literal["inline", "left", "right", "block"]] = Field(
        default="block",
        description="Rough hint to the layout engine about image placement.",
    )

# This union tells FastAPI/Pydantic that a Block can be text or image.
Block = Union[TextBlock, ImageBlock]

# ---------------------------
# Document Schemas
# ---------------------------

class DocumentBase(BaseModel):
    """
    A document belongs to a project and represents a logical unit:
    a chapter, a section of Haggadah, a perek in Chumash, etc.
    """
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=1000)

class DocumentCreate(DocumentBase):
    """
    Payload for creating a new document.
    Includes a list of blocks (which can be text or image).
    """
    blocks: List[Block] = Field(default_factory=list)

class Document(DocumentBase):
    """
    Document as stored/returned by the API.
    Includes IDs and full block content.
    """
    id: UUID
    project_id: UUID
    blocks: List[Block]

    @classmethod
    def new(cls, project_id: UUID, **data: object) -> "Document":
        """
        Helper to create a new document with a fresh UUID bound to a project.
        """
        return cls(id=uuid4(), project_id=project_id, **data)