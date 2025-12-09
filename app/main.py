from typing import List
from uuid import UUID

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse

from .schemas import (
    Project,
    ProjectCreate,
    Document,
    DocumentCreate,
)
from .storage import project_store, document_store
from .layout import render_document_to_html
from .db import init_db, get_session
from .models import ProjectModel, DocumentModel
from .schemas import Project, ProjectCreate, Document, DocumentCreate, DocumentUpdate

@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- Startup ---
    init_db()
    yield
    # --- Shutdown ---
    # (nothing to clean up for SQLite, leave empty)
    pass

app = FastAPI(title="Torah Layout Studio API", lifespan=lifespan)

# --- CORS setup so the React dev server can call the API ---
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
def list_projects():
    with get_session() as session:
        projects = session.query(ProjectModel).all()
        return [
            Project(id=p.id, name=p.name, description=p.description)
            for p in projects
        ]


@app.post("/projects", response_model=Project, status_code=201)
def create_project_endpoint(payload: ProjectCreate):
    with get_session() as session:
        project = ProjectModel(name=payload.name, description=payload.description)
        session.add(project)
        session.commit()
        session.refresh(project)
        return Project(
            id=project.id,
            name=project.name,
            description=project.description,
        )



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

def _get_project_or_404(session, project_id: str) -> ProjectModel:
    project = session.get(ProjectModel, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
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
def list_documents_for_project(project_id: str):
    with get_session() as session:
        project = _get_project_or_404(session, project_id)
        docs = (
            session.query(DocumentModel)
            .filter(DocumentModel.project_id == project.id)
            .all()
        )
        result: List[Document] = []
        for d in docs:
            result.append(
                Document(
                    id=d.id,
                    project_id=d.project_id,
                    title=d.title,
                    description=d.description,
                    blocks=d.get_blocks(),
                )
            )
        return result


@app.post(
    "/projects/{project_id}/documents",
    response_model=Document,
    status_code=201,
)
def create_document_endpoint(project_id: str, payload: DocumentCreate):
    with get_session() as session:
        project = _get_project_or_404(session, project_id)
        doc = DocumentModel(
            project_id=project.id,
            title=payload.title,
            description=payload.description,
        )
        # new docs start with empty blocks
        doc.set_blocks([])
        session.add(doc)
        session.commit()
        session.refresh(doc)
        return Document(
            id=doc.id,
            project_id=doc.project_id,
            title=doc.title,
            description=doc.description,
            blocks=doc.get_blocks(),
        )



@app.get(
    "/projects/{project_id}/documents/{document_id}",
    response_model=Document,
)
def get_document(project_id: str, document_id: str):
    with get_session() as session:
        project = _get_project_or_404(session, project_id)
        doc = session.get(DocumentModel, document_id)
        if not doc or doc.project_id != project.id:
            raise HTTPException(status_code=404, detail="Document not found")
        return Document(
            id=doc.id,
            project_id=doc.project_id,
            title=doc.title,
            description=doc.description,
            blocks=doc.get_blocks(),
        )


@app.put(
    "/projects/{project_id}/documents/{document_id}",
    response_model=Document,
)
def update_document_endpoint(
    project_id: str,
    document_id: str,
    payload: DocumentUpdate,
):
    with get_session() as session:
        project = _get_project_or_404(session, project_id)
        doc = session.get(DocumentModel, document_id)
        if not doc or doc.project_id != project.id:
            raise HTTPException(status_code=404, detail="Document not found")

        doc.title = payload.title
        doc.description = payload.description
        # payload.blocks is List[Block]
        doc.set_blocks(payload.blocks or [])

        session.add(doc)
        session.commit()
        session.refresh(doc)

        return Document(
            id=doc.id,
            project_id=doc.project_id,
            title=doc.title,
            description=doc.description,
            blocks=doc.get_blocks(),
        )


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
