import React from "react";
import ReactDOM from "react-dom/client";

import { loadDemoModule } from "./demo-registry.js";
import "./index.css";

function postFrameEvent(type, payload = {}) {
  if (window.parent === window) {
    return;
  }

  window.parent.postMessage({ type, ...payload }, "*");
}

function renderMessage(mountNode, title, message) {
  ReactDOM.createRoot(mountNode).render(
    <main className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
      <section className="max-w-lg rounded-md border bg-card px-4 py-3 shadow-sm">
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">{message}</p>
      </section>
    </main>,
  );
}

class DemoErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : String(error),
    };
  }

  componentDidCatch(error) {
    console.error("Live demo crashed inside iframe:", error);
    postFrameEvent("live-prd-demo-error", {
      frameId: this.props.frameId,
      message: error instanceof Error ? error.message : String(error),
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
          <section className="max-w-lg rounded-md border bg-card px-4 py-3 shadow-sm">
            <p className="text-sm font-medium">Demo failed to render</p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">{this.state.message}</p>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}

function applyDemoEnvironment(config) {
  const root = document.documentElement;
  root.classList.toggle("dark", config.colorMode === "dark");

  for (const [key, value] of Object.entries(config.demoStyle ?? {})) {
    root.style.setProperty(key, value);
  }

  document.body.style.margin = "0";
}

function attachHeightObserver(frameId, mountNode) {
  const reportHeight = () => {
    const nextHeight = Math.max(
      mountNode.scrollHeight,
      document.body.scrollHeight,
      document.documentElement.scrollHeight,
    );

    postFrameEvent("live-prd-demo-resize", {
      frameId,
      height: nextHeight,
    });
  };

  window.requestAnimationFrame(() => {
    reportHeight();
    postFrameEvent("live-prd-demo-ready", {
      frameId,
      height: Math.max(
        mountNode.scrollHeight,
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
      ),
    });
  });

  const observer = new ResizeObserver(() => {
    reportHeight();
  });

  observer.observe(document.body);
  observer.observe(document.documentElement);
  observer.observe(mountNode);

  window.addEventListener("beforeunload", () => observer.disconnect(), { once: true });
}

async function bootstrap() {
  const params = new URLSearchParams(window.location.search);
  const payload = params.get("payload");
  const mountNode = document.getElementById("demo-root");

  if (!payload || !mountNode) {
    return;
  }

  let config;
  try {
    config = JSON.parse(decodeURIComponent(payload));
  } catch {
    renderMessage(mountNode, "Demo payload invalid", "The embedded demo configuration could not be parsed.");
    return;
  }

  applyDemoEnvironment(config);

  let DemoComponent;
  try {
    DemoComponent = await loadDemoModule(config.source);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    postFrameEvent("live-prd-demo-error", {
      frameId: config.frameId,
      message,
    });
    renderMessage(mountNode, "Demo module failed to load", message);
    return;
  }

  if (!DemoComponent) {
    postFrameEvent("live-prd-demo-error", {
      frameId: config.frameId,
      message: `Module not found: ${config.source}`,
    });
    renderMessage(mountNode, "Demo module not found", config.source);
    return;
  }

  ReactDOM.createRoot(mountNode).render(
    <React.StrictMode>
      <DemoErrorBoundary frameId={config.frameId}>
        <div className="min-h-screen bg-background text-foreground">
          <DemoComponent />
        </div>
      </DemoErrorBoundary>
    </React.StrictMode>,
  );

  attachHeightObserver(config.frameId, mountNode);
}

bootstrap();
