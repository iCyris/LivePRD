import path from "node:path";
import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import {
  addPrdComment,
  removePrdComment,
  renderCatalog,
  updatePrdCommentStatus,
} from "../../packages/engine/index.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, "../..");

function json(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(`${JSON.stringify(payload)}\n`);
}

async function readRequestBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }

  if (!chunks.length) {
    return {};
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

async function handlePrdApi(req, res) {
  const requestUrl = new URL(req.url, "http://127.0.0.1");
  const pathname = requestUrl.pathname;

  try {
    if (req.method === "GET" && pathname === "/api/prd/catalog") {
      const { documents } = await renderCatalog(workspaceRoot);
      json(res, 200, { documents });
      return true;
    }

    const createCommentMatch = pathname.match(/^\/api\/prd\/([^/]+)\/comments$/);
    if (req.method === "POST" && createCommentMatch) {
      const slug = decodeURIComponent(createCommentMatch[1]);
      const body = await readRequestBody(req);
      const payload = await addPrdComment(workspaceRoot, slug, body);
      json(res, 200, payload);
      return true;
    }

    const updateCommentMatch = pathname.match(/^\/api\/prd\/([^/]+)\/comments\/([^/]+)$/);
    if (req.method === "PATCH" && updateCommentMatch) {
      const slug = decodeURIComponent(updateCommentMatch[1]);
      const commentId = decodeURIComponent(updateCommentMatch[2]);
      const body = await readRequestBody(req);
      const payload = await updatePrdCommentStatus(workspaceRoot, slug, commentId, body.status);
      json(res, 200, payload);
      return true;
    }

    const deleteCommentMatch = pathname.match(/^\/api\/prd\/([^/]+)\/comments\/([^/]+)$/);
    if (req.method === "DELETE" && deleteCommentMatch) {
      const slug = decodeURIComponent(deleteCommentMatch[1]);
      const commentId = decodeURIComponent(deleteCommentMatch[2]);
      const payload = await removePrdComment(workspaceRoot, slug, commentId);
      json(res, 200, payload);
      return true;
    }
  } catch (error) {
    json(res, 500, {
      error: error instanceof Error ? error.message : String(error),
    });
    return true;
  }

  return false;
}

function fileAuthoringApiPlugin() {
  return {
    name: "live-prd-file-authoring-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url?.startsWith("/api/prd/")) {
          const handled = await handlePrdApi(req, res);
          if (!handled) {
            next();
          }
          return;
        }

        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url?.startsWith("/api/prd/")) {
          const handled = await handlePrdApi(req, res);
          if (!handled) {
            next();
          }
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig({
  root: __dirname,
  define: {
    __LIVE_PRD_BUILD_ID__: JSON.stringify(new Date().toISOString()),
  },
  plugins: [react(), fileAuthoringApiPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    fs: {
      allow: [workspaceRoot],
    },
  },
  build: {
    outDir: path.resolve(workspaceRoot, "dist/web"),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
        demoFrame: path.resolve(__dirname, "demo-frame.html"),
      },
    },
  },
});
