import { FormEvent, useEffect, useState } from "react";
import {
  createProject,
  fetchProjects,
  fetchDocuments,
  createDocument,
} from "./api";
import type { Project, Document } from "./api";

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
        return;
      }
      try {
        setDocumentsLoading(true);
        setError(null);
        const data = await fetchDocuments(selectedProjectId);
        setDocuments(data);
      } catch (err: any) {
        setError(err.message || "Failed to load documents");
      } finally {
        setDocumentsLoading(false);
      }
    };
    loadDocs();
  }, [selectedProjectId]);

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
                onChange={(e) => setNewProjectDescription(e.target.value)}
                placeholder="Main Haggadah project with commentary and archaeology sections."
              />
            </label>
            <button type="submit" disabled={!newProjectName.trim()}>
              Create project
            </button>
          </form>
        </section>

        {/* Right: Documents for selected project */}
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
                  <li key={d.id} className="document-item">
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
                    onChange={(e) => setNewDocDescription(e.target.value)}
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