import { FormEvent, useEffect, useState } from "react";
import {
  createProject,
  fetchProjects,
  fetchDocuments,
  createDocument,
  fetchDocument,
  updateDocument,
} from "./api";
import type { Project, Document, Block } from "./api";

function App() {
  // Projects
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");

  // Selected project
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null
  );

  // Documents for selected project
  const [documents, setDocuments] = useState<Document[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);

  const [newDocTitle, setNewDocTitle] = useState("");
  const [newDocDescription, setNewDocDescription] = useState("");

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
        // If we had a selected document, but it's not in this project, clear it
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
      // If no project selected yet, select the newly created one
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
          Project-based sefer builder for Haggadah, Chumash, and more.
        </p>
      </header>

      <main className="app-main">
        {/* Left: Projects */}
        <section className="panel panel-left">
          <h2>Projects</h2>

          {projectsLoading && <p>Loading projects…</p>}
          {error && <p className="error">{error}</p>}

          {!projectsLoading && projects.length === 0 && (
            <p className="empty">No projects yet. Create your first one.</p>
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
                <div className="project-meta">
                  <span className="project-id">ID: {p.id}</span>
                </div>
              </li>
            ))}
          </ul>

          <div className="divider" />

          <h3>Create new project</h3>
          <form onSubmit={onCreateProject} className="project-form">
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
              Description (optional)
              <textarea
                value={newProjectDescription}
                onChange={(e) =>
                  setNewProjectDescription(e.target.value)
                }
                placeholder="Main Haggadah project with commentary and archaeology sections."
              />
            </label>
            <button type="submit" disabled={!newProjectName.trim()}>
              Create project
            </button>
          </form>
        </section>

        {/* Right: Documents + Editor */}
        <section className="panel panel-right">
          {selectedProject ? (
            <>
              <div className="panel-header">
                <h2>Documents in: {selectedProject.name}</h2>
                {selectedProject.description && (
                  <p className="selected-project-description">
                    {selectedProject.description}
                  </p>
                )}
              </div>

              {documentsLoading && <p>Loading documents…</p>}

              {!documentsLoading && documents.length === 0 && (
                <p className="empty">
                  No documents yet. Create your first section or chapter.
                </p>
              )}

              <ul className="document-list">
                {documents.map((d) => (
                  <li
                    key={d.id}
                    className={`document-item ${
                      d.id === selectedDocumentId
                        ? "document-item-selected"
                        : ""
                    }`}
                    onClick={() => onSelectDocument(d.id)}
                  >
                    <div className="document-title">{d.title}</div>
                    {d.description && (
                      <div className="document-description">
                        {d.description}
                      </div>
                    )}
                    <div className="document-meta">
                      <span className="document-id">ID: {d.id}</span>
                      <span className="document-blocks">
                        Blocks: {d.blocks?.length ?? 0}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="divider" />

              <h3>Create new document</h3>
              <form onSubmit={onCreateDocument} className="project-form">
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
                  Description (optional)
                  <textarea
                    value={newDocDescription}
                    onChange={(e) =>
                      setNewDocDescription(e.target.value)
                    }
                    placeholder="Opening narrative of Yetziat Mitzrayim."
                  />
                </label>
                <button
                  type="submit"
                  disabled={!newDocTitle.trim() || !selectedProjectId}
                >
                  Create document
                </button>
              </form>

              <div className="divider" />

              <h3>Document editor</h3>
              {selectedDocumentId ? (
                <div className="block-editor">
                  {docEditorLoading && (
                    <p className="empty">Loading document…</p>
                  )}

                  {!docEditorLoading && (
                    <>
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
                            <label>
                              Role
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
                                placeholder="e.g. haggadah_main_hebrew, commentary_en"
                              />
                            </label>

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
                                      if (
                                        current.kind === "text"
                                      ) {
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
                                        if (
                                          current.kind === "image"
                                        ) {
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
                                      const alt_text = e.target.value;
                                      setDocBlocks((prev) => {
                                        const copy = [...prev];
                                        const current = copy[index];
                                        if (
                                          current.kind === "image"
                                        ) {
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
                                      const alignment = e
                                        .target
                                        .value as Block["alignment"];
                                      setDocBlocks((prev) => {
                                        const copy = [...prev];
                                        const current = copy[index];
                                        if (
                                          current.kind === "image"
                                        ) {
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
                <p className="empty">
                  Select a document above to edit its blocks.
                </p>
              )}
            </>
          ) : (
            <div>
              <h2>No project selected</h2>
              <p className="empty">
                Select a project on the left to view or create documents.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
