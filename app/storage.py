from typing import List
from uuid import UUID

from .schemas import Project, ProjectCreate


class InMemoryProjectStore:
    """
    Very simple in-memory project store.
    This is just for early development and tests.
    Later we can replace with a DB-backed implementation.
    """

    def __init__(self) -> None:
        self._projects: List[Project] = []

    def list_projects(self) -> List[Project]:
        return list(self._projects)

    def create_project(self, data: ProjectCreate) -> Project:
        project = Project.new(**data.dict())
        self._projects.append(project)
        return project

    def reset(self) -> None:
        """
        Clear all projects. Used for tests.
        """
        self._projects.clear()

    def get_project(self, project_id: UUID) -> Project | None:
        for p in self._projects:
            if p.id == project_id:
                return p
        return None


# Single global store instance for now
project_store = InMemoryProjectStore()
