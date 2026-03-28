function collectStyles() {
  const chunks = [];

  for (const sheet of Array.from(document.styleSheets)) {
    try {
      const rules = sheet.cssRules;
      if (!rules) {
        continue;
      }

      chunks.push(Array.from(rules).map((rule) => rule.cssText).join("\n"));
    } catch {
      continue;
    }
  }

  return chunks.join("\n");
}

function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function crc32(bytes) {
  let crc = -1;

  for (let i = 0; i < bytes.length; i += 1) {
    crc ^= bytes[i];

    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }

  return (crc ^ -1) >>> 0;
}

function concatUint8Arrays(chunks) {
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

function dosDateTime(input) {
  const date = input instanceof Date ? input : new Date(input);
  const year = Math.max(1980, date.getFullYear());
  const dosTime =
    (date.getHours() << 11) |
    (date.getMinutes() << 5) |
    Math.floor(date.getSeconds() / 2);
  const dosDate =
    ((year - 1980) << 9) |
    ((date.getMonth() + 1) << 5) |
    date.getDate();

  return { dosDate, dosTime };
}

function createStoredZip(files) {
  const encoder = new TextEncoder();
  const localChunks = [];
  const centralChunks = [];
  let offset = 0;

  for (const file of files) {
    const filenameBytes = encoder.encode(file.path);
    const contentBytes = encoder.encode(file.content);
    const checksum = crc32(contentBytes);
    const { dosDate, dosTime } = dosDateTime(file.modifiedAt || new Date());

    const localHeader = new Uint8Array(30 + filenameBytes.length + contentBytes.length);
    const localView = new DataView(localHeader.buffer);
    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint16(6, 0, true);
    localView.setUint16(8, 0, true);
    localView.setUint16(10, dosTime, true);
    localView.setUint16(12, dosDate, true);
    localView.setUint32(14, checksum, true);
    localView.setUint32(18, contentBytes.length, true);
    localView.setUint32(22, contentBytes.length, true);
    localView.setUint16(26, filenameBytes.length, true);
    localView.setUint16(28, 0, true);
    localHeader.set(filenameBytes, 30);
    localHeader.set(contentBytes, 30 + filenameBytes.length);

    const centralHeader = new Uint8Array(46 + filenameBytes.length);
    const centralView = new DataView(centralHeader.buffer);
    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint16(8, 0, true);
    centralView.setUint16(10, 0, true);
    centralView.setUint16(12, dosTime, true);
    centralView.setUint16(14, dosDate, true);
    centralView.setUint32(16, checksum, true);
    centralView.setUint32(20, contentBytes.length, true);
    centralView.setUint32(24, contentBytes.length, true);
    centralView.setUint16(28, filenameBytes.length, true);
    centralView.setUint16(30, 0, true);
    centralView.setUint16(32, 0, true);
    centralView.setUint16(34, 0, true);
    centralView.setUint16(36, 0, true);
    centralView.setUint32(38, 0, true);
    centralView.setUint32(42, offset, true);
    centralHeader.set(filenameBytes, 46);

    localChunks.push(localHeader);
    centralChunks.push(centralHeader);
    offset += localHeader.length;
  }

  const centralDirectory = concatUint8Arrays(centralChunks);
  const centralDirectoryOffset = offset;
  const endRecord = new Uint8Array(22);
  const endView = new DataView(endRecord.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(4, 0, true);
  endView.setUint16(6, 0, true);
  endView.setUint16(8, files.length, true);
  endView.setUint16(10, files.length, true);
  endView.setUint32(12, centralDirectory.length, true);
  endView.setUint32(16, centralDirectoryOffset, true);
  endView.setUint16(20, 0, true);

  return concatUint8Arrays([
    ...localChunks,
    centralDirectory,
    endRecord,
  ]);
}

export function exportShareHtml({ document: runtimeDocument, element }) {
  if (!element) {
    return;
  }

  const styles = collectStyles();
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${runtimeDocument.meta.title}</title>
    <style>${styles}</style>
  </head>
  <body>
    <main class="min-h-screen bg-background text-foreground">
      <section class="mx-auto max-w-[1200px] px-6 py-8">
        ${element.innerHTML}
      </section>
    </main>
  </body>
</html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  downloadBlob(`${runtimeDocument.slug || "live-prd"}.html`, blob);
}

export function exportMarkdownFile({ document: runtimeDocument }) {
  const blob = new Blob([runtimeDocument.markdown], { type: "text/markdown;charset=utf-8" });
  downloadBlob(`${runtimeDocument.slug || "live-prd"}.md`, blob);
}

export function exportDemoBundle({ document: runtimeDocument, demos }) {
  const now = new Date();
  const normalizedDemos = demos.filter((item) => item?.source && item?.code);
  const manifest = {
    slug: runtimeDocument.slug,
    title: runtimeDocument.meta.title,
    exportedAt: now.toISOString(),
    demos: normalizedDemos.map((item) => item.source),
  };
  const readme = [
    "# Live PRD Demo Bundle",
    "",
    `Title: ${runtimeDocument.meta.title}`,
    `Slug: ${runtimeDocument.slug}`,
    "",
    "Contents:",
    `- docs/${runtimeDocument.slug}.md`,
    ...normalizedDemos.map((item) => `- ${item.source}`),
    "- manifest.json",
    "",
    "This bundle contains the current PRD markdown and the demo source files referenced in it.",
  ].join("\n");

  const zipBytes = createStoredZip([
    {
      path: "README.md",
      content: readme,
      modifiedAt: now,
    },
    {
      path: `docs/${runtimeDocument.slug}.md`,
      content: runtimeDocument.markdown,
      modifiedAt: now,
    },
    {
      path: "manifest.json",
      content: `${JSON.stringify(manifest, null, 2)}\n`,
      modifiedAt: now,
    },
    ...normalizedDemos.map((item) => ({
      path: item.source,
      content: item.code,
      modifiedAt: now,
    })),
  ]);

  downloadBlob(
    `${runtimeDocument.slug || "live-prd"}-demo-bundle.zip`,
    new Blob([zipBytes], { type: "application/zip" }),
  );
}
