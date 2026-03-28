async function readJson(response) {
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload?.error || "Request failed.");
  }

  return payload;
}

export async function fetchPrdCatalog() {
  const response = await fetch("/api/prd/catalog");
  const payload = await readJson(response);
  return payload.documents ?? [];
}

export async function fetchVersionState(slug) {
  const response = await fetch(`/api/prd/${encodeURIComponent(slug)}/versions`);
  const payload = await readJson(response);
  return payload;
}

export async function saveVersionFile(slug, input) {
  const response = await fetch(`/api/prd/${encodeURIComponent(slug)}/versions/save`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  return readJson(response);
}

export async function archiveVersionFile(slug, versionId) {
  const response = await fetch(`/api/prd/${encodeURIComponent(slug)}/versions/archive`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ versionId }),
  });

  return readJson(response);
}

export async function deleteVersionFile(slug, versionId) {
  const response = await fetch(
    `/api/prd/${encodeURIComponent(slug)}/versions/${encodeURIComponent(versionId)}`,
    {
      method: "DELETE",
    },
  );

  return readJson(response);
}
