import { RetryCard } from "./retry-card";

export function CheckoutRecoveryPage() {
  return (
    <main className="min-h-screen bg-[var(--prd-surface)] px-6 py-10 text-[var(--prd-text)]">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-5">
          <p className="text-sm uppercase tracking-[0.24em] text-[var(--prd-primary)]">
            Checkout recovery
          </p>
          <h1 className="max-w-2xl text-5xl font-semibold leading-tight">
            Recover gracefully from timeout without restarting the flow
          </h1>
          <p className="max-w-xl text-base leading-7 text-[color-mix(in_srgb,var(--prd-text)_78%,white)]">
            This page-level prototype lets engineering and product review copy, hierarchy, and retry behavior in one place.
          </p>
        </section>
        <aside className="flex items-start justify-end">
          <RetryCard />
        </aside>
      </div>
    </main>
  );
}

export default CheckoutRecoveryPage;
