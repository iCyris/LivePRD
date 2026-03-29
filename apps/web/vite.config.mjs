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
const runtimeRoot = path.resolve(__dirname, "../..");
const workspaceRoot = process.env.LIVE_PRD_WORKSPACE_ROOT
  ? path.resolve(process.env.LIVE_PRD_WORKSPACE_ROOT)
  : runtimeRoot;

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

function liveWorkspaceReloadPlugin() {
  const watchRoots = [
    path.join(workspaceRoot, "docs", "prd"),
    path.join(workspaceRoot, "demos"),
    path.join(workspaceRoot, "themes"),
    path.join(runtimeRoot, "apps", "web", "src", "runtime-generated"),
  ];

  return {
    name: "live-prd-workspace-reload",
    configureServer(server) {
      server.watcher.add(watchRoots);

      let reloadTimer = null;
      const scheduleReload = (changedFile) => {
        const normalized = changedFile.split(path.sep).join("/");
        const isRelevant = watchRoots.some((rootPath) => {
          const normalizedRoot = rootPath.split(path.sep).join("/");
          return normalized === normalizedRoot || normalized.startsWith(`${normalizedRoot}/`);
        });

        if (!isRelevant) {
          return;
        }

        if (reloadTimer) {
          clearTimeout(reloadTimer);
        }

        reloadTimer = setTimeout(() => {
          server.ws.send({ type: "full-reload" });
          reloadTimer = null;
        }, 40);
      };

      server.watcher.on("add", scheduleReload);
      server.watcher.on("change", scheduleReload);
      server.watcher.on("unlink", scheduleReload);
    },
  };
}

export default defineConfig({
  root: __dirname,
  define: {
    __LIVE_PRD_BUILD_ID__: JSON.stringify(new Date().toISOString()),
  },
  plugins: [react(), fileAuthoringApiPlugin(), liveWorkspaceReloadPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    fs: {
      allow: [workspaceRoot, runtimeRoot],
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
