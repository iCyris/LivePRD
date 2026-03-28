import { cn } from "../../lib/cn.js";

export function Badge({ className, ...props }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] transition-colors",
        className,
      )}
      {...props}
    />
  );
}
