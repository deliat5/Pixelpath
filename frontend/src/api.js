// VITE_API_URL is set on Vercel to your Render backend's real URL. Locally,
// with no .env.local, it falls back to localhost so nothing changes for
// development - only the deployed build needs this set.
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
const TOKEN_KEY = "pixelpath-token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function isAuthenticated() {
  return Boolean(getToken());
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = { "Content-Type": "application/json", ...options.headers };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(BASE_URL + path, { ...options, headers });

  if (res.status === 401) {
    // Token missing/expired/invalid - the session is no longer valid.
    clearToken();
  }

  if (res.status === 204) return null; // DELETE returns no body

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || "Request failed: " + res.status);
  }

  return res.json();
}

export async function register(email, password) {
  const result = await request("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setToken(result.token);
  return result;
}

export async function login(email, password) {
  const result = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setToken(result.token);
  return result;
}

export function logout() {
  clearToken();
}

export function getProjects() {
  return request("/projects");
}

export function getProject(projectId) {
  return request(`/projects/${projectId}`);
}

export function createProject(name) {
  return request("/projects", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

// data: { name?, equippedCharacter?, equippedRewardKey? } - character and
// reward are per-project now, not per-user (see conversation notes / schema.prisma).
export function updateProject(projectId, data) {
  return request(`/projects/${projectId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteProject(projectId) {
  return request(`/projects/${projectId}`, { method: "DELETE" });
}

export function getCPM(projectId) {
  return request(`/projects/${projectId}/cpm`);
}

export function getRecommendation(projectId) {
  return request(`/projects/${projectId}/recommendation`);
}

export function createTask(projectId, data) {
  return request(`/projects/${projectId}/tasks`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateTaskStatus(taskId, status) {
  return request(`/tasks/${taskId}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

// data: { title?, duration?, dependencies?, notBeforeDate? }
export function editTask(taskId, data) {
  return request(`/tasks/${taskId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteTask(taskId) {
  return request(`/tasks/${taskId}`, { method: "DELETE" });
}

// history: [{role: "user"|"assistant", content: string}] - the frontend
// carries the conversation, since nothing is persisted server-side.
export function askAssistant(projectId, message, history = []) {
  return request(`/projects/${projectId}/assistant`, {
    method: "POST",
    body: JSON.stringify({ message, history }),
  });
}
