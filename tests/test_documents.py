from fastapi.testclient import TestClient

from app.main import app
from app.storage import project_store, document_store

client = TestClient(app)


def setup_function() -> None:
    """
    Reset stores before each test for isolation.
    """
    project_store.reset()
    document_store.reset()


def _create_sample_project() -> str:
    payload = {
        "name": "Haggadah Yeshuas Nissan",
        "description": "Main Haggadah project",
    }
    resp = client.post("/projects", json=payload)
    assert resp.status_code == 201
    project = resp.json()
    return project["id"]


def test_list_documents_initially_empty():
    project_id = _create_sample_project()

    resp = client.get(f"/projects/{project_id}/documents")
    assert resp.status_code == 200
    assert resp.json() == []


def test_create_document_with_text_blocks():
    project_id = _create_sample_project()

    payload = {
        "title": "Maggid Section",
        "description": "Core narrative of Yetziat Mitzrayim",
        "blocks": [
            {
                "kind": "text",
                "role": "haggadah_main_hebrew",
                "text": "הא לחמא עניא די אכלו אבהתנא בארעא דמצרים...",
            },
            {
                "kind": "text",
                "role": "commentary_en",
                "text": "Here we introduce the theme of spiritual poverty and redemption.",
            },
        ],
    }

    resp = client.post(f"/projects/{project_id}/documents", json=payload)
    assert resp.status_code == 201
    doc = resp.json()

    assert doc["title"] == payload["title"]
    assert doc["description"] == payload["description"]
    assert doc["project_id"] == project_id
    assert len(doc["blocks"]) == 2

    # Check first block
    first_block = doc["blocks"][0]
    assert first_block["kind"] == "text"
    assert first_block["role"] == "haggadah_main_hebrew"
    assert "text" in first_block


def test_create_document_with_image_block():
    project_id = _create_sample_project()

    payload = {
        "title": "Archaeology Spread",
        "description": "Photos and notes on ancient matzah ovens.",
        "blocks": [
            {
                "kind": "image",
                "role": "archaeology_fig",
                "src": "/images/matzah_oven_01.jpg",
                "alt_text": "Ancient matzah oven excavation site.",
                "alignment": "block",
            },
            {
                "kind": "text",
                "role": "archaeology_caption_en",
                "text": "Excavation of a Second Temple-era matzah oven near Jerusalem.",
            },
        ],
    }

    resp = client.post(f"/projects/{project_id}/documents", json=payload)
    assert resp.status_code == 201
    doc = resp.json()

    assert len(doc["blocks"]) == 2
    image_block = doc["blocks"][0]
    assert image_block["kind"] == "image"
    assert image_block["role"] == "archaeology_fig"
    assert image_block["src"] == "/images/matzah_oven_01.jpg"


def test_get_document_by_id():
    project_id = _create_sample_project()

    payload = {
        "title": "Kadesh Urchatz",
        "description": "Opening section.",
        "blocks": [],
    }

    create_resp = client.post(f"/projects/{project_id}/documents", json=payload)
    assert create_resp.status_code == 201
    created = create_resp.json()
    document_id = created["id"]

    get_resp = client.get(f"/projects/{project_id}/documents/{document_id}")
    assert get_resp.status_code == 200
    got = get_resp.json()
    assert got["id"] == document_id
    assert got["title"] == payload["title"]


def test_get_document_not_found_returns_404():
    project_id = _create_sample_project()
    unknown_doc_id = "00000000-0000-0000-0000-000000000000"

    resp = client.get(f"/projects/{project_id}/documents/{unknown_doc_id}")
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Document not found"


def test_documents_for_unknown_project_404():
    unknown_project_id = "00000000-0000-0000-0000-000000000000"

    # List docs for nonexistent project
    list_resp = client.get(f"/projects/{unknown_project_id}/documents")
    assert list_resp.status_code == 404
    assert list_resp.json()["detail"] == "Project not found"

    # Attempt to create doc for nonexistent project
    payload = {
        "title": "Should Not Exist",
        "description": None,
        "blocks": [],
    }
    create_resp = client.post(f"/projects/{unknown_project_id}/documents", json=payload)
    assert create_resp.status_code == 404
    assert create_resp.json()["detail"] == "Project not found"
