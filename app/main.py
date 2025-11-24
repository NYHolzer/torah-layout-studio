from typing import List
from uuid import UUID

from fastapi import FastAPI, HTTPException, status

from .schemas import Project, ProjectCreate
from .storage import project_store

app = FastAPI(title="Torah Layout Studio API")


@app.get("/health")
def read_health():
    """
    Simple health check endpoint so that:
    - We can verify the server is running
    - We can write our first test against a real FastAPI app
    """
    return {"status": "ok"}


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
