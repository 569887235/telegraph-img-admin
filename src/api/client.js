const API_BASE = import.meta.env.VITE_API_BASE || "";

function withQuery(path, params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") search.set(key, value);
  });
  const suffix = search.toString();
  return suffix ? path + "?" + suffix : path;
}

async function request(path, options = {}) {
  const response = await fetch(API_BASE + path, {
    ...options,
    headers: {
      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(options.headers || {})
    }
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || "Request failed: " + response.status);
  return data;
}

export function listSources() {
  return request("/api/sources");
}

export function createSource(payload) {
  return request("/api/sources", { method: "POST", body: JSON.stringify(payload) });
}

export function testSource(id) {
  return request("/api/sources/" + id + "/test", { method: "POST" });
}

export function browseSource(id, path = "/") {
  return request(withQuery("/api/sources/" + id + "/browse", { path }));
}

export function createImportJob(payload) {
  return request("/api/import-jobs", { method: "POST", body: JSON.stringify(payload) });
}

export function listImportJobs(params = {}) {
  return request(withQuery("/api/import-jobs", params));
}

export function getImportJob(id) {
  return request("/api/import-jobs/" + id);
}

export function listGalleryEntities(params = {}) {
  return request(withQuery("/api/gallery/entities", params));
}

export function listGalleryAlbums(params = {}) {
  return request(withQuery("/api/gallery/albums", params));
}

export function getGalleryAlbum(id) {
  return request("/api/gallery/albums/" + id);
}

export function updateGalleryAlbum(id, payload) {
  return request("/api/gallery/albums/" + id, { method: "PATCH", body: JSON.stringify(payload) });
}

export function listGalleryAlbumAssets(id, params = {}) {
  return request(withQuery("/api/gallery/albums/" + id + "/assets", params));
}

export function setGalleryAlbumCover(id, assetId) {
  return request("/api/gallery/albums/" + id + "/cover", {
    method: "PATCH",
    body: JSON.stringify({ asset_id: assetId })
  });
}

export function listStorageAccounts(params = {}) {
  return request(withQuery("/api/storage-accounts", params));
}

export function listEdgeNodes(params = {}) {
  return request(withQuery("/api/edge-nodes", params));
}

export function createEdgeNode(payload) {
  return request("/api/edge-nodes", { method: "POST", body: JSON.stringify(payload) });
}

export function updateEdgeNode(id, payload) {
  return request("/api/edge-nodes/" + id, { method: "PATCH", body: JSON.stringify(payload) });
}

export function createStorageAccount(payload) {
  return request("/api/storage-accounts", { method: "POST", body: JSON.stringify(payload) });
}

export function updateStorageAccount(id, payload) {
  return request("/api/storage-accounts/" + id, { method: "PATCH", body: JSON.stringify(payload) });
}

export function testStorageAccount(id) {
  return request("/api/storage-accounts/" + id + "/test", { method: "POST" });
}
