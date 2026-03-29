import { cn } from "../../lib/cn.js";

export function Label({ className, ...props }) {
  return <label className={cn("text-sm font-medium leading-none", className)} {...props} />;
}
