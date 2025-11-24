from typing import Optional
from pydantic import BaseModel, Field
from uuid import UUID, uuid4


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
