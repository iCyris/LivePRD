import { Check } from "lucide-react";
import { cn } from "../../lib/cn.js";

export function Checkbox({ checked = false, className, onCheckedChange, ...props }) {
  return (
    <button
      aria-checked={checked}
      className={cn(
        "inline-flex h-4 w-4 items-center justify-center rounded-sm border border-input bg-background text-primary transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        checked && "border-primary bg-primary text-primary-foreground",
        className,
      )}
      onClick={() => onCheckedChange?.(!checked)}
      role="checkbox"
      type="button"
      {...props}
    >
      {checked ? <Check className="h-3 w-3" /> : null}
    </button>
  );
}
