import mermaid from "mermaid";

let initialized = false;
let renderSequence = 0;

function ensureMermaid() {
  if (initialized) {
    return;
  }

  mermaid.initialize({
    startOnLoad: false,
    securityLevel: "loose",
    theme: "default",
  });
  initialized = true;
}

export async function renderMermaidBlocks(root) {
  if (!root) {
    return;
  }

  ensureMermaid();
  const blocks = root.querySelectorAll(".prd-code-block code.language-mermaid");

  await Promise.all(Array.from(blocks).map(async (codeNode) => {
    const block = codeNode.closest(".prd-code-block");
    const pre = codeNode.closest("pre");
    if (!block || !pre) {
      return;
    }

    const source = codeNode.textContent || "";
    if (!source.trim()) {
      return;
    }

    let mount = block.querySelector("[data-mermaid-render]");
    if (!mount) {
      mount = document.createElement("div");
      mount.className = "prd-mermaid-render";
      mount.dataset.mermaidRender = "true";
      pre.insertAdjacentElement("afterend", mount);
    }

    block.classList.add("prd-code-block--mermaid");

    try {
      renderSequence += 1;
      const { svg } = await mermaid.render(`live-prd-mermaid-${renderSequence}`, source);
      mount.innerHTML = svg;
      mount.dataset.mermaidState = "ready";
      block.dataset.mermaidState = "ready";
    } catch (error) {
      mount.innerHTML = `<div class="prd-mermaid-error">${error instanceof Error ? error.message : String(error)}</div>`;
      mount.dataset.mermaidState = "error";
      block.dataset.mermaidState = "error";
    }
  }));
}
