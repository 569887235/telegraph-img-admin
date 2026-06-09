const API_BASE = import.meta.env.VITE_API_BASE || "";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(options.headers || {})
    }
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || `Request failed: ${response.status}`);
  return data;
}

export function listSources() {
  return request("/api/sources");
}

export function createSource(payload) {
  return request("/api/sources", { method: "POST", body: JSON.stringify(payload) });
}

export function testSource(id) {
  return request(`/api/sources/${id}/test`, { method: "POST" });
}

export function browseSource(id, path = "/") {
  const search = new URLSearchParams({ path });
  return request(`/api/sources/${id}/browse?${search.toString()}`);
}

export function createImportJob(payload) {
  return request("/api/import-jobs", { method: "POST", body: JSON.stringify(payload) });
}

export function getImportJob(id) {
  return request(`/api/import-jobs/${id}`);
}
