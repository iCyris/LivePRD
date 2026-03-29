import { cn } from "../../lib/cn.js";

export function Switch({ checked = false, className, onCheckedChange, ...props }) {
  return (
    <button
      aria-checked={checked}
      className={cn(
        "inline-flex h-5 w-9 items-center rounded-full border border-transparent bg-input p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        checked && "bg-primary",
        className,
      )}
      onClick={() => onCheckedChange?.(!checked)}
      role="switch"
      type="button"
      {...props}
    >
      <span
        className={cn(
          "block h-4 w-4 rounded-full bg-background shadow transition-transform",
          checked && "translate-x-4",
        )}
      />
    </button>
  );
}
