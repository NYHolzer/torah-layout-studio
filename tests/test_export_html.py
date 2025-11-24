from fastapi.testclient import TestClient

from app.main import app
from app.storage import project_store, document_store

client = TestClient(app)


def setup_function() -> None:
    project_store.reset()
    document_store.reset()


def _create_project_and_document():
    # Create project
    proj_payload = {
        "name": "Export Test Haggadah",
        "description": "Testing HTML export",
    }
    proj_resp = client.post("/projects", json=proj_payload)
    assert proj_resp.status_code == 201
    project_id = proj_resp.json()["id"]

    # Create document
    doc_payload = {
        "title": "Maggid Export Test",
        "description": "Testing block render",
        "blocks": [
            {
                "kind": "text",
                "role": "haggadah_main_hebrew",
                "text": "הא לחמא עניא די אכלו אבהתנא בארעא דמצרים...",
            },
            {
                "kind": "text",
                "role": "commentary_en",
                "text": "This section introduces the theme of spiritual poverty.",
            },
            {
                "kind": "image",
                "role": "archaeology_fig",
                "src": "/images/matzah_oven_01.jpg",
                "alt_text": "Ancient matzah oven.",
                "alignment": "block",
            },
        ],
    }
    doc_resp = client.post(f"/projects/{project_id}/documents", json=doc_payload)
    assert doc_resp.status_code == 201
    document_id = doc_resp.json()["id"]

    return project_id, document_id


def test_export_document_html_contains_title_and_blocks():
    project_id, document_id = _create_project_and_document()

    resp = client.get(
        f"/projects/{project_id}/documents/{document_id}/export/html"
    )
    assert resp.status_code == 200
    html = resp.text

    # Basic sanity checks on the HTML
    assert "<!DOCTYPE html>" in html
    assert "Maggid Export Test" in html
    assert "הא לחמא עניא" in html
    assert "This section introduces the theme of spiritual poverty." in html
    assert "/images/matzah_oven_01.jpg" in html
    assert 'class="block block-text block-role-haggadah_main_hebrew"' in html
    assert 'class="block block-image block-role-archaeology_fig align-block"' in html
