from fastapi.testclient import TestClient

from app.main import app
from app.storage import project_store

client = TestClient(app)


def setup_function() -> None:
    """
    Pytest will call this before each test function in this module.
    We use it to reset the in-memory store so tests are isolated.
    """
    project_store.reset()


def test_list_projects_initially_empty():
    response = client.get("/projects")
    assert response.status_code == 200
    assert response.json() == []


def test_create_project_and_list_it():
    payload = {
        "name": "Haggadah Yeshuas Nissan",
        "description": "Main Haggadah project",
    }

    create_resp = client.post("/projects", json=payload)
    assert create_resp.status_code == 201
    data = create_resp.json()
    assert data["name"] == payload["name"]
    assert data["description"] == payload["description"]
    assert "id" in data  # UUID

    # Now list projects and ensure it appears
    list_resp = client.get("/projects")
    assert list_resp.status_code == 200
    projects = list_resp.json()
    assert len(projects) == 1
    assert projects[0]["id"] == data["id"]


def test_get_project_by_id():
    payload = {
        "name": "Chumash Vayikra",
        "description": "Vayikra project with Rishonim and Achronim",
    }
    create_resp = client.post("/projects", json=payload)
    assert create_resp.status_code == 201
    project = create_resp.json()

    project_id = project["id"]
    get_resp = client.get(f"/projects/{project_id}")
    assert get_resp.status_code == 200
    data = get_resp.json()
    assert data["id"] == project_id
    assert data["name"] == payload["name"]


def test_get_project_not_found_returns_404():
    # Random UUID that does not exist in the store
    unknown_id = "00000000-0000-0000-0000-000000000000"
    resp = client.get(f"/projects/{unknown_id}")
    assert resp.status_code == 404
    body = resp.json()
    assert body["detail"] == "Project not found"
