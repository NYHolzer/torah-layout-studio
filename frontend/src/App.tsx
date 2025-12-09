import { FormEvent, useEffect, useState } from "react";
import {
  createProject,
  fetchProjects,
  fetchDocuments,
  createDocument,
  fetchDocument,
  updateDocument,
  getDocumentHtmlUrl,
} from "./api";
import type { Project, Document, Block } from "./api";

// Preset styles (will eventually be project-specific)
const TEXT_STYLES = [
  { id: "haggadah_main_hebrew", label: "Haggadah – Main Hebrew (HE)" },
  { id: "haggadah_translation_en", label: "Haggadah – Translation (EN)" },
  { id: "commentary_en", label: "Commentary (EN)" },
  { id: "commentary_he", label: "Commentary (HE)" },
  { id: "footnote_en", label: "Footnote (EN)" },
  { id: "footnote_he", label: "Footnote (HE)" },
  { id: "divrei_torah_callout", label: "Divrei Torah Callout" },
  { id: "custom", label: "Custom…" },
];

const IMAGE_STYLES = [
  { id: "archaeology_fig", label: "Archaeology Figure" },
  { id: "photo_illustration", label: "Photo Illustration" },
  { id: "custom", label: "Custom…" },
];

function App() {
  // Projects
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);

  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const [showNewProjectForm, setShowNewProjectForm] = useState(false);

  // Global error
  const [error, setError] = useState<string | null>(null);

  // Selected project
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null
  );

  // Documents for selected project
  const [documents, setDocuments] = useState<Document[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);

  const [newDocTitle, setNewDocTitle] = useState("");
  const [newDocDescription, setNewDocDescription] = useState("");
  const [showNewDocForm, setShowNewDocForm] = useState(false);

  // Selected document for editing
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(
    null
  );
  const [docEditorTitle, setDocEditorTitle] = useState("");
  const [docEditorDescription, setDocEditorDescription] = useState("");
  const [docBlocks, setDocBlocks] = useState<Block[]>([]);
  const [docEditorLoading, setDocEditorLoading] = useState(false);

  // Load projects on mount
  useEffect(() => {
    const load = async () => {
      try {
        setProjectsLoading(true);
        setError(null);
        const data = await fetchProjects();
        setProjects(data);
        if (data.length > 0 && !selectedProjectId) {
          setSelectedProjectId(data[0].id);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load projects");
      } finally {
        setProjectsLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Whenever selectedProjectId changes, load documents for it
  useEffect(() => {
    const loadDocs = async () => {
      if (!selectedProjectId) {
        setDocuments([]);
        setSelectedDocumentId(null);
        setDocEditorTitle("");
        setDocEditorDescription("");
        setDocBlocks([]);
        return;
      }
      try {
        setDocumentsLoading(true);
        setError(null);
        const data = await fetchDocuments(selectedProjectId);
        setDocuments(data);
        // If selected document no longer belongs to this project, clear it
        if (
          selectedDocumentId &&
          !data.some((d) => d.id === selectedDocumentId)
        ) {
          setSelectedDocumentId(null);
          setDocEditorTitle("");
          setDocEditorDescription("");
          setDocBlocks([]);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load documents");
      } finally {
        setDocumentsLoading(false);
      }
    };
    loadDocs();
  }, [selectedProjectId, selectedDocumentId]);

  const onCreateProject = async (e: FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    try {
      setError(null);
      const project = await createProject({
        name: newProjectName.trim(),
        description: newProjectDescription.trim() || undefined,
      });
      setProjects((prev) => [...prev, project]);
      setNewProjectName("");
      setNewProjectDescription("");
      setShowNewProjectForm(false);
      if (!selectedProjectId) {
        setSelectedProjectId(project.id);
      }
    } catch (err: any) {
      setError(err.message || "Failed to create project");
    }
  };

  const onSelectProject = (projectId: string) => {
    setSelectedProjectId(projectId);
  };

  const onCreateDocument = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || !newDocTitle.trim()) return;

    try {
      setError(null);
      const doc = await createDocument(selectedProjectId, {
        title: newDocTitle.trim(),
        description: newDocDescription.trim() || undefined,
      });
      setDocuments((prev) => [...prev, doc]);
      setNewDocTitle("");
      setNewDocDescription("");
      setShowNewDocForm(false);
    } catch (err: any) {
      setError(err.message || "Failed to create document");
    }
  };

  const onSelectDocument = async (docId: string) => {
    if (!selectedProjectId) return;
    try {
      setError(null);
      setDocEditorLoading(true);
      const doc = await fetchDocument(selectedProjectId, docId);
      setSelectedDocumentId(docId);
      setDocEditorTitle(doc.title);
      setDocEditorDescription(doc.description || "");
      setDocBlocks(doc.blocks || []);
    } catch (err: any) {
      setError(err.message || "Failed to load document");
    } finally {
      setDocEditorLoading(false);
    }
  };

  const onSaveDocument = async () => {
    if (!selectedProjectId || !selectedDocumentId) return;
    if (!docEditorTitle.trim()) return;

    try {
      setError(null);
      setDocEditorLoading(true);
      const updated = await updateDocument(
        selectedProjectId,
        selectedDocumentId,
        {
          title: docEditorTitle.trim(),
          description: docEditorDescription.trim() || undefined,
          blocks: docBlocks,
        }
      );
      // Update in documents list
      setDocuments((prev) =>
        prev.map((d) => (d.id === updated.id ? updated : d))
      );
    } catch (err: any) {
      setError(err.message || "Failed to save document");
    } finally {
      setDocEditorLoading(false);
    }
  };

  const onPreviewHtml = () => {
    if (!selectedProjectId || !selectedDocumentId) return;
    const url = getDocumentHtmlUrl(selectedProjectId, selectedDocumentId);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const addTextBlock = () => {
    setDocBlocks((prev) => [
      ...prev,
      {
        kind: "text",
        role: "haggadah_main_hebrew",
        text: "",
      },
    ]);
  };

  const addImageBlock = () => {
    setDocBlocks((prev) => [
      ...prev,
      {
        kind: "image",
        role: "archaeology_fig",
        src: "",
        alt_text: "",
        alignment: "block",
      },
    ]);
  };

  const removeBlock = (index: number) => {
    setDocBlocks((prev) => prev.filter((_, i) => i !== index));
  };

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Torah Layout Studio</h1>
        <p className="app-tagline">
          Custom “Word-like” editor for Haggadah, Chumash, and sefarim projects.
        </p>
      </header>

      <main className="app-main">
        {/* Sidebar: Projects */}
        <aside className="panel panel-left">
          <div className="panel-heading">
            <h2>Projects</h2>
            <button
              type="button"
              className="small-button"
              onClick={() => setShowNewProjectForm((v) => !v)}
            >
              + New
            </button>
          </div>

          {projectsLoading && <p className="muted">Loading projects…</p>}
          {error && <p className="error">{error}</p>}

          {!projectsLoading && projects.length === 0 && (
            <p className="empty">No projects yet.</p>
          )}

          <ul className="project-list">
            {projects.map((p) => (
              <li
                key={p.id}
                className={`project-item ${
                  p.id === selectedProjectId ? "project-item-selected" : ""
                }`}
                onClick={() => onSelectProject(p.id)}
              >
                <div className="project-title">{p.name}</div>
                {p.description && (
                  <div className="project-description">{p.description}</div>
                )}
              </li>
            ))}
          </ul>

          {showNewProjectForm && (
            <form onSubmit={onCreateProject} className="sidebar-form">
              <label>
                Name
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Haggadah Yeshuas Nissan"
                  required
                />
              </label>
              <label>
                Description
                <textarea
                  value={newProjectDescription}
                  onChange={(e) => setNewProjectDescription(e.target.value)}
                  placeholder="Main Haggadah project with commentary and archaeology."
                />
              </label>
              <button type="submit" disabled={!newProjectName.trim()}>
                Create
              </button>
            </form>
          )}
        </aside>

        {/* Main workspace: Documents + editor */}
        <section className="panel panel-right">
          {!selectedProject ? (
            <div className="empty-state">
              <h2>Select or create a project</h2>
              <p className="empty">
                Use the sidebar to create a Haggadah, Chumash, or other sefer
                project.
              </p>
            </div>
          ) : (
            <>
              {/* Document toolbar */}
              <div className="doc-header">
                <div className="doc-header-main">
                  <h2>{selectedProject.name}</h2>
                  {selectedProject.description && (
                    <p className="selected-project-description">
                      {selectedProject.description}
                    </p>
                  )}
                </div>
                <div className="doc-header-actions">
                  <button
                    type="button"
                    className="small-button"
                    onClick={() => setShowNewDocForm((v) => !v)}
                    disabled={!selectedProjectId}
                  >
                    + New document
                  </button>
                  <button
                    type="button"
                    className="small-button secondary"
                    onClick={onPreviewHtml}
                    disabled={!selectedProjectId || !selectedDocumentId}
                  >
                    Preview HTML
                  </button>
                </div>
              </div>

              {showNewDocForm && (
                <form
                  onSubmit={onCreateDocument}
                  className="inline-form inline-form-doc"
                >
                  <label>
                    Title
                    <input
                      type="text"
                      value={newDocTitle}
                      onChange={(e) => setNewDocTitle(e.target.value)}
                      placeholder="Maggid – Ha Lachma Anya"
                      required
                    />
                  </label>
                  <label>
                    Description
                    <input
                      type="text"
                      value={newDocDescription}
                      onChange={(e) => setNewDocDescription(e.target.value)}
                      placeholder="Short description (optional)"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={!newDocTitle.trim() || !selectedProjectId}
                  >
                    Create
                  </button>
                </form>
              )}

              {/* Document "tabs" */}
              <div className="doc-tabs-wrapper">
                {documentsLoading && (
                  <p className="muted">Loading documents…</p>
                )}

                {!documentsLoading && documents.length === 0 && (
                  <p className="empty">
                    No documents yet. Create a new section or chapter.
                  </p>
                )}

                {documents.length > 0 && (
                  <ul className="doc-tabs">
                    {documents.map((d) => (
                      <li key={d.id}>
                        <button
                          type="button"
                          className={`doc-pill ${
                            d.id === selectedDocumentId ? "doc-pill-active" : ""
                          }`}
                          onClick={() => onSelectDocument(d.id)}
                        >
                          {d.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Editor canvas */}
              <div className="editor-shell">
                {selectedDocumentId ? (
                  <div className="editor-card">
                    {docEditorLoading ? (
                      <p className="muted">Loading document…</p>
                    ) : (
                      <>
                        {/* Document title/description */}
                        <div className="block-editor-header">
                          <label>
                            Title
                            <input
                              type="text"
                              value={docEditorTitle}
                              onChange={(e) =>
                                setDocEditorTitle(e.target.value)
                              }
                              placeholder="Section title"
                            />
                          </label>
                          <label>
                            Description
                            <textarea
                              value={docEditorDescription}
                              onChange={(e) =>
                                setDocEditorDescription(e.target.value)
                              }
                              placeholder="Optional description for this section."
                            />
                          </label>
                        </div>

                        {/* Blocks list */}
                        <div className="block-editor-list">
                          {docBlocks.map((block, index) => (
                            <div
                              key={index}
                              className="block-editor-item"
                            >
                              <div className="block-editor-item-header">
                                <span>
                                  Block {index + 1} –{" "}
                                  {block.kind.toUpperCase()}
                                </span>
                                <button
                                  type="button"
                                  className="block-remove-button"
                                  onClick={() => removeBlock(index)}
                                >
                                  Remove
                                </button>
                              </div>

                              {/* Style (role) */}
                              <label>
                                Style
                                <div className="style-row">
                                  <select
                                    value={
                                      (block.kind === "text"
                                        ? TEXT_STYLES.find(
                                            (s) => s.id === block.role
                                          )?.id
                                        : IMAGE_STYLES.find(
                                            (s) => s.id === block.role
                                          )?.id) || "custom"
                                    }
                                    onChange={(e) => {
                                      const styleId = e.target.value;
                                      setDocBlocks((prev) => {
                                        const copy = [...prev];
                                        let nextRole: string;
                                        if (styleId === "custom") {
                                          nextRole =
                                            copy[index].role || "";
                                        } else {
                                          nextRole = styleId;
                                        }
                                        copy[index] = {
                                          ...copy[index],
                                          role: nextRole,
                                        } as Block;
                                        return copy;
                                      });
                                    }}
                                  >
                                    {(block.kind === "text"
                                      ? TEXT_STYLES
                                      : IMAGE_STYLES
                                    ).map((s) => (
                                      <option key={s.id} value={s.id}>
                                        {s.label}
                                      </option>
                                    ))}
                                  </select>

                                  <input
                                    type="text"
                                    value={block.role}
                                    onChange={(e) => {
                                      const role = e.target.value;
                                      setDocBlocks((prev) => {
                                        const copy = [...prev];
                                        copy[index] = {
                                          ...copy[index],
                                          role,
                                        } as Block;
                                        return copy;
                                      });
                                    }}
                                    placeholder="Custom style key (optional)"
                                  />
                                </div>
                              </label>

                              {/* Text block */}
                              {block.kind === "text" && "text" in block && (
                                <label>
                                  Text
                                  <textarea
                                    value={block.text}
                                    onChange={(e) => {
                                      const text = e.target.value;
                                      setDocBlocks((prev) => {
                                        const copy = [...prev];
                                        const current = copy[index];
                                        if (current.kind === "text") {
                                          copy[index] = {
                                            ...current,
                                            text,
                                          };
                                        }
                                        return copy;
                                      });
                                    }}
                                    placeholder="Block text (Hebrew or English)"
                                  />
                                </label>
                              )}

                              {/* Image block */}
                              {block.kind === "image" && "src" in block && (
                                <>
                                  <label>
                                    Image URL / path
                                    <input
                                      type="text"
                                      value={block.src}
                                      onChange={(e) => {
                                        const src = e.target.value;
                                        setDocBlocks((prev) => {
                                          const copy = [...prev];
                                          const current = copy[index];
                                          if (current.kind === "image") {
                                            copy[index] = {
                                              ...current,
                                              src,
                                            };
                                          }
                                          return copy;
                                        });
                                      }}
                                      placeholder="/images/figure1.jpg"
                                    />
                                  </label>
                                  <label>
                                    Alt text / caption
                                    <input
                                      type="text"
                                      value={block.alt_text || ""}
                                      onChange={(e) => {
                                        const alt_text =
                                          e.target.value;
                                        setDocBlocks((prev) => {
                                          const copy = [...prev];
                                          const current = copy[index];
                                          if (current.kind === "image") {
                                            copy[index] = {
                                              ...current,
                                              alt_text,
                                            };
                                          }
                                          return copy;
                                        });
                                      }}
                                      placeholder="Short description for the figure"
                                    />
                                  </label>
                                  <label>
                                    Alignment
                                    <select
                                      value={block.alignment || "block"}
                                      onChange={(e) => {
                                        const alignment = e.target
                                          .value as Block["alignment"];
                                        setDocBlocks((prev) => {
                                          const copy = [...prev];
                                          const current = copy[index];
                                          if (current.kind === "image") {
                                            copy[index] = {
                                              ...current,
                                              alignment,
                                            };
                                          }
                                          return copy;
                                        });
                                      }}
                                    >
                                      <option value="block">
                                        Block (full width)
                                      </option>
                                      <option value="left">Left</option>
                                      <option value="right">Right</option>
                                      <option value="inline">
                                        Inline
                                      </option>
                                    </select>
                                  </label>
                                </>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Editor actions */}
                        <div className="block-editor-actions">
                          <button
                            type="button"
                            onClick={addTextBlock}
                          >
                            Add text block
                          </button>
                          <button
                            type="button"
                            onClick={addImageBlock}
                          >
                            Add image block
                          </button>
                          <button
                            type="button"
                            onClick={onSaveDocument}
                            disabled={
                              !selectedDocumentId ||
                              !docEditorTitle.trim() ||
                              docEditorLoading
                            }
                          >
                            {docEditorLoading
                              ? "Saving…"
                              : "Save document"}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="empty-state">
                    <h3>No document selected</h3>
                    <p className="empty">
                      Choose a document above or create a new one to start
                      editing.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
