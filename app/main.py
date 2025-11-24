from typing import List
from uuid import UUID

from fastapi import FastAPI, HTTPException, status
from fastapi.responses import HTMLResponse

from .schemas import (
    Project,
    ProjectCreate,
    Document,
    DocumentCreate,
)
from .storage import project_store, document_store
from .layout import render_document_to_html

app = FastAPI(title="Torah Layout Studio API")

@app.get("/health")
def read_health():
    """
    Simple health check endpoint so that:
    - We can verify the server is running
    - We can write our first test against a real FastAPI app
    """
    return {"status": "ok"}

# ---------------------------
# Project endpoints
# ---------------------------

@app.get("/projects", response_model=List[Project])
def list_projects() -> List[Project]:
    """
    Return all projects.

    Later we can add pagination, filters, etc.
    """
    return project_store.list_projects()


@app.post(
    "/projects",
    response_model=Project,
    status_code=status.HTTP_201_CREATED,
)
def create_project(project_in: ProjectCreate) -> Project:
    """
    Create a new project with the given name/description.
    """
    return project_store.create_project(project_in)


@app.get("/projects/{project_id}", response_model=Project)
def get_project(project_id: UUID) -> Project:
    """
    Retrieve a single project by ID.
    """
    project = project_store.get_project(project_id)
    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )
    return project

# ---------------------------
# Document endpoints
# ---------------------------

def _ensure_project_exists(project_id: UUID) -> None:
    """
    Internal helper: raise 404 if project does not exist.
    """
    if project_store.get_project(project_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )


@app.get(
    "/projects/{project_id}/documents",
    response_model=List[Document],
)
def list_documents(project_id: UUID) -> List[Document]:
    """
    List all documents for a given project.
    """
    _ensure_project_exists(project_id)
    return document_store.list_documents_for_project(project_id)


@app.post(
    "/projects/{project_id}/documents",
    response_model=Document,
    status_code=status.HTTP_201_CREATED,
)
def create_document(
    project_id: UUID,
    doc_in: DocumentCreate,
) -> Document:
    """
    Create a new document under a given project.
    """
    _ensure_project_exists(project_id)
    return document_store.create_document(project_id, doc_in)


@app.get(
    "/projects/{project_id}/documents/{document_id}",
    response_model=Document,
)
def get_document(project_id: UUID, document_id: UUID) -> Document:
    """
    Retrieve a specific document under a given project.
    """
    _ensure_project_exists(project_id)
    doc = document_store.get_document(project_id, document_id)
    if doc is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )
    return doc

@app.get(
    "/projects/{project_id}/documents/{document_id}/export/html",
    response_class=HTMLResponse,
)
def export_document_html(project_id: UUID, document_id: UUID) -> str:
    """
    Export a single document as HTML using the v0 layout renderer.
    """
    _ensure_project_exists(project_id)
    doc = document_store.get_document(project_id, document_id)
    if doc is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )
    html = render_document_to_html(doc)
    return html
