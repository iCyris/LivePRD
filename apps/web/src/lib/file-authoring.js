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

export async function createPrdComment(slug, input) {
  const response = await fetch(`/api/prd/${encodeURIComponent(slug)}/comments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (response.status === 404) {
    throw new Error("Comment API is unavailable. Restart `npm run dev` or `npm run preview`, and do not open the built HTML file directly for comment editing.");
  }

  return readJson(response);
}

export async function updatePrdCommentStatus(slug, commentId, status) {
  const response = await fetch(`/api/prd/${encodeURIComponent(slug)}/comments/${encodeURIComponent(commentId)}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  });

  if (response.status === 404) {
    throw new Error("Comment API is unavailable. Restart `npm run dev` or `npm run preview`, and do not open the built HTML file directly for comment editing.");
  }

  return readJson(response);
}

export async function deletePrdComment(slug, commentId) {
  const response = await fetch(`/api/prd/${encodeURIComponent(slug)}/comments/${encodeURIComponent(commentId)}`, {
    method: "DELETE",
  });

  if (response.status === 404) {
    throw new Error("Comment API is unavailable. Restart `npm run dev` or `npm run preview`, and do not open the built HTML file directly for comment editing.");
  }

  return readJson(response);
}
