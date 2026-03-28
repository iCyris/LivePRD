import { cn } from "../../lib/cn.js";

const variants = {
  default:
    "bg-[color:var(--prd-primary)] text-white hover:opacity-95 shadow-[var(--prd-shadow)]",
  ghost:
    "bg-transparent text-[color:var(--prd-text)] hover:bg-[color:color-mix(in_srgb,var(--prd-primary)_8%,white)]",
};

export function Button({ className, variant = "default", ...props }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-medium transition",
        variants[variant],
        className,
      )}
      type="button"
      {...props}
    />
  );
}
