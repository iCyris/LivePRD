const modules = import.meta.glob("../../../demos/**/*.{js,jsx}", {
  eager: true,
});

const registry = Object.fromEntries(
  Object.entries(modules).map(([modulePath, mod]) => {
    const normalized = modulePath.split("/demos/")[1];
    return [`demos/${normalized}`, mod.default];
  }),
);

export function resolveDemo(source) {
  return registry[source] ?? null;
}
