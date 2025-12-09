from __future__ import annotations

from html import escape
from typing import List

from .schemas import Document, TextBlock, ImageBlock, Block


BASE_CSS = """
body {
    margin: 0;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    background-color: #f3f4f6;
    color: #111827;
}
.page {
    max-width: 800px;
    margin: 1.5rem auto;
    background-color: #ffffff;
    padding: 1.25rem 1.5rem;
    box-shadow: 0 0 0 1px #e5e7eb;
}
.page-header-title {
    margin: 0 0 0.25rem;
    font-size: 1.4rem;
    font-weight: 600;
}
.page-header-description {
    margin: 0 0 0.75rem;
    font-size: 0.95rem;
    color: #4b5563;
}
.block {
    margin-bottom: 0.75rem;
}
.block p {
    margin: 0;
}

/* Role-based styles – mirror frontend */

.block.role-haggadah_main_hebrew p {
    direction: rtl;
    text-align: right;
    font-size: 1.1rem;
    line-height: 1.7;
}

.block.role-haggadah_translation_en p {
    direction: ltr;
    text-align: left;
    font-size: 1rem;
    line-height: 1.6;
}

.block.role-commentary_en p {
    font-size: 0.95rem;
    line-height: 1.6;
    color: #374151;
}

.block.role-commentary_he p {
    direction: rtl;
    text-align: right;
    font-size: 0.95rem;
    line-height: 1.6;
}

.block.role-footnote_en p,
.block.role-footnote_he p {
    font-size: 0.8rem;
    line-height: 1.3;
    color: #4b5563;
}

/* Images */

.figure {
    margin: 0.5rem 0 0.75rem;
    text-align: center;
}

.figure img {
    max-width: 100%;
    height: auto;
}

.figure figcaption {
    font-size: 0.8rem;
    color: #4b5563;
    margin-top: 0.25rem;
}

/* Simple alignment hooks */

.figure.align-left {
    text-align: left;
}

.figure.align-right {
    text-align: right;
}
"""


def _render_text_block(block: TextBlock) -> str:
    role_class = f"role-{escape(block.role)}" if block.role else "role-default"
    text = escape(block.text or "")
    if not text:
        return ""
    return f'<div class="block {role_class}"><p>{text}</p></div>'


def _render_image_block(block: ImageBlock) -> str:
    role_class = f"role-{escape(block.role)}" if block.role else "role-default"
    src = escape(block.src or "")
    if not src:
        return ""

    alt = escape(block.alt_text or "")
    alignment = block.alignment or "block"
    align_class = ""
    if alignment in ("left", "right"):
        align_class = f"align-{alignment}"

    return (
        f'<figure class="block figure {role_class} {align_class}">'
        f'<img src="{src}" alt="{alt}"/>'
        + (f"<figcaption>{alt}</figcaption>" if alt else "")
        + "</figure>"
    )


def render_document_to_html(doc: Document) -> str:
    """
    Render a single Document into standalone HTML.
    This is a v0 layout: linear blocks with role-based styling.
    """
    pieces: List[str] = []

    # Basic HTML + CSS
    pieces.append("<!DOCTYPE html>")
    pieces.append("<html lang='en'>")
    pieces.append("<head>")
    pieces.append("<meta charset='utf-8'/>")
    title = escape(doc.title or "Document")
    pieces.append(f"<title>{title}</title>")
    pieces.append("<style>")
    pieces.append(BASE_CSS)
    pieces.append("</style>")
    pieces.append("</head>")
    pieces.append("<body>")

    # Page wrapper
    pieces.append('<div class="page">')

    # Header
    pieces.append(f'<h1 class="page-header-title">{title}</h1>')
    if doc.description:
        pieces.append(
            f'<p class="page-header-description">{escape(doc.description)}</p>'
        )

    # Blocks
    for block in doc.blocks:
        if isinstance(block, TextBlock) or block.kind == "text":
            pieces.append(_render_text_block(block))  # type: ignore[arg-type]
        elif isinstance(block, ImageBlock) or block.kind == "image":
            pieces.append(_render_image_block(block))  # type: ignore[arg-type]

    pieces.append("</div>")  # .page
    pieces.append("</body></html>")

    return "".join(pieces)
