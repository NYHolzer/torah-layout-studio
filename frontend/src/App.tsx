import { FormEvent, useEffect, useState } from "react";
import { createProject, fetchProjects } from "./api";
import type { Project } from "./api";

function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchProjects();
        setProjects(data);
      } catch (err: any) {
        setError(err.message || "Failed to load projects");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const onCreateProject = async (e: FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    try {
      setError(null);
      const project = await createProject({
        name: newName.trim(),
        description: newDescription.trim() || undefined,
      });
      setProjects((prev) => [...prev, project]);
      setNewName("");
      setNewDescription("");
    } catch (err: any) {
      setError(err.message || "Failed to create project");
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Torah Layout Studio</h1>
        <p className="app-tagline">
          Project-based editor for Haggadah, Chumash, and more.
        </p>
      </header>

      <main className="app-main">
        <section className="panel">
          <h2>Projects</h2>

          {loading && <p>Loading projects…</p>}
          {error && <p className="error">{error}</p>}

          {!loading && projects.length === 0 && (
            <p className="empty">No projects yet. Create your first one.</p>
          )}

          <ul className="project-list">
            {projects.map((p) => (
              <li key={p.id} className="project-item">
                <div className="project-title">{p.name}</div>
                {p.description && (
                  <div className="project-description">{p.description}</div>
                )}
                <div className="project-meta">
                  <span className="project-id">ID: {p.id}</span>
                  {/* Later: click to view documents */}
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel">
          <h2>Create new project</h2>
          <form onSubmit={onCreateProject} className="project-form">
            <label>
              Name
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Haggadah Yeshuas Nissan"
                required
              />
            </label>
            <label>
              Description (optional)
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Main Haggadah project with commentary and archaeology sections."
              />
            </label>
            <button type="submit" disabled={!newName.trim()}>
              Create project
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}

export default App;
