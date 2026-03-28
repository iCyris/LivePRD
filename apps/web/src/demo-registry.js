const modules = import.meta.glob("../../../demos/**/*.{js,jsx}");
const rawModules = import.meta.glob("../../../demos/**/*.{js,jsx}", {
  eager: true,
  import: "default",
  query: "?raw",
});

const registry = Object.fromEntries(
  Object.entries(modules).map(([modulePath, loader]) => {
    const normalized = modulePath.split("/demos/")[1];
    return [`demos/${normalized}`, loader];
  }),
);

const rawRegistry = Object.fromEntries(
  Object.entries(rawModules).map(([modulePath, source]) => {
    const normalized = modulePath.split("/demos/")[1];
    return [`demos/${normalized}`, source];
  }),
);

export function hasDemoSource(source) {
  return Boolean(registry[source]);
}

export async function loadDemoModule(source) {
  const loader = registry[source];
  if (!loader) {
    return null;
  }

  const mod = await loader();
  return mod?.default ?? null;
}

export function getDemoSourceCode(source) {
  return rawRegistry[source] ?? null;
}
