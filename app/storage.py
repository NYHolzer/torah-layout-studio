from typing import List
from uuid import UUID

from .schemas import Project, ProjectCreate, Document, DocumentCreate


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

class InMemoryDocumentStore:
    """
    Simple in-memory document store.
    Documents are keyed by project_id, but we also keep a flat list for lookup by id.
    """

    def __init__(self) -> None:
        self._documents: List[Document] = []

    def reset(self) -> None:
        """
        Clear all documents. Used for tests.
        """
        self._documents.clear()

    def list_documents_for_project(self, project_id: UUID) -> List[Document]:
        return [d for d in self._documents if d.project_id == project_id]

    def create_document(self, project_id: UUID, data: DocumentCreate) -> Document:
        doc = Document.new(project_id=project_id, **data.dict())
        self._documents.append(doc)
        return doc

    def get_document(self, project_id: UUID, document_id: UUID) -> Document | None:
        for d in self._documents:
            if d.id == document_id and d.project_id == project_id:
                return d
        return None

# Single global store instance for now
project_store = InMemoryProjectStore()
document_store = InMemoryDocumentStore()
