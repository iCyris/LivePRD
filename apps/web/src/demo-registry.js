import { rawRegistry, registry } from "./runtime-generated/demo-registry.mjs";

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
