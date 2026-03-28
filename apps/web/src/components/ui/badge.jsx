import { cn } from "../../lib/cn.js";

export function Badge({ className, ...props }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-transparent px-3 py-1 text-xs font-medium uppercase tracking-[0.18em]",
        className,
      )}
      {...props}
    />
  );
}
