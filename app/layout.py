from html import escape
from typing import List

from .schemas import Document, TextBlock, ImageBlock, Block


def _render_text_block(block: TextBlock) -> str:
    """
    Render a text block as a <div> with a CSS class based on its role.
    For now we keep it simple and let CSS handle styling later.
    """
    role_class = f"block-role-{escape(block.role)}"
    text_html = escape(block.text)
    return f'<div class="block block-text {role_class}">{text_html}</div>'


def _render_image_block(block: ImageBlock) -> str:
    """
    Render an image block as a <figure> with optional caption (alt_text).
    """
    role_class = f"block-role-{escape(block.role)}"
    src = escape(block.src)
    alt = escape(block.alt_text) if block.alt_text else ""
    alignment_class = f"align-{block.alignment}" if block.alignment else ""
    caption_html = (
        f"<figcaption>{alt}</figcaption>" if block.alt_text else ""
    )
    return (
        f'<figure class="block block-image {role_class} {alignment_class}">'
        f'<img src="{src}" alt="{alt}" />'
        f"{caption_html}"
        f"</figure>"
    )


def _render_block(block: Block) -> str:
    """
    Dispatch rendering based on block kind.
    """
    if isinstance(block, TextBlock):
        return _render_text_block(block)
    if isinstance(block, ImageBlock):
        return _render_image_block(block)
    # In case we add more kinds in the future
    raise ValueError(f"Unsupported block kind: {block}")


def render_document_to_html(document: Document) -> str:
    """
    Render a single Document into a basic HTML string.

    This is our v0 'layout engine':
    - Wraps everything in a <html><body>
    - Renders blocks in order
    - Adds minimal structure for later CSS-based layout
    """
    block_html_parts: List[str] = []

    for block in document.blocks:
        block_html_parts.append(_render_block(block))

    blocks_html = "\n".join(block_html_parts)
    title = escape(document.title)

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <title>{title}</title>
    <style>
        /* Minimal baseline styles, we will refine later */

        body {{
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            margin: 1in;
        }}

        .document-title {{
            font-size: 1.5rem;
            font-weight: bold;
            margin-bottom: 1rem;
        }}

        .block {{
            margin-bottom: 0.5rem;
        }}

        .block-role-haggadah_main_hebrew {{
            font-size: 1.3rem;
        }}

        .block-role-commentary_en {{
            font-size: 0.95rem;
        }}

        .block-role-archaeology_fig {{
            border: 1px solid #ccc;
            padding: 0.5rem;
            background-color: #f9f9f9;
        }}

        .block-image img {{
            max-width: 100%;
            height: auto;
        }}

        .align-left {{
            float: left;
            margin-right: 0.5rem;
        }}

        .align-right {{
            float: right;
            margin-left: 0.5rem;
        }}
    </style>
</head>
<body>
    <div class="document">
        <div class="document-title">{title}</div>
        {blocks_html}
    </div>
</body>
</html>"""
    return html
