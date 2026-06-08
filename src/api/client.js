const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3100";

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

export function uploadFiles(files) {
  const formData = new FormData();
  Array.from(files).forEach(file => formData.append("files", file));
  return request("/api/batches/files", { method: "POST", body: formData });
}

export function importUrls(urls) {
  return request("/api/batches/urls", { method: "POST", body: JSON.stringify({ urls }) });
}

export function getBatch(id) {
  return request(`/api/batches/${id}`);
}

export function listImages(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") search.set(key, value);
  });
  return request(`/api/images?${search.toString()}`);
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
