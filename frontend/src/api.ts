// --------- Types ---------

export interface Project {
  id: string;
  name: string;
  description?: string | null;
}

export type BlockKind = "text" | "image";

export interface BaseBlock {
  kind: BlockKind;
  role: string;
}

export interface TextBlock extends BaseBlock {
  kind: "text";
  text: string;
}

export interface ImageBlock extends BaseBlock {
  kind: "image";
  src: string;
  alt_text?: string | null;
  alignment?: "inline" | "left" | "right" | "block" | null;
}

export type Block = TextBlock | ImageBlock;

export interface Document {
  id: string;
  project_id: string;
  title: string;
  description?: string | null;
  blocks: Block[];
}

// --------- API base + helper ---------

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `API error ${res.status}: ${res.statusText} – ${text || "no body"}`
    );
  }
  return (await res.json()) as T;
}

// --------- Project API ---------

export async function fetchProjects(): Promise<Project[]> {
  const res = await fetch(`${API_BASE_URL}/projects`);
  return handleResponse<Project[]>(res);
}

export async function createProject(payload: {
  name: string;
  description?: string;
}): Promise<Project> {
  const res = await fetch(`${API_BASE_URL}/projects`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse<Project>(res);
}

// --------- Document API ---------

export async function fetchDocuments(
  projectId: string
): Promise<Document[]> {
  const res = await fetch(`${API_BASE_URL}/projects/${projectId}/documents`);
  return handleResponse<Document[]>(res);
}

export async function createDocument(
  projectId: string,
  payload: {
    title: string;
    description?: string;
  }
): Promise<Document> {
  const res = await fetch(
    `${API_BASE_URL}/projects/${projectId}/documents`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // blocks is required by backend schema, so we start with an empty list
      body: JSON.stringify({ ...payload, blocks: [] }),
    }
  );
  return handleResponse<Document>(res);
}