import { cn } from "../../lib/cn.js";

const variants = {
  default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
  secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
  outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
  ghost: "hover:bg-accent hover:text-accent-foreground",
  danger: "border border-destructive/30 bg-background text-destructive shadow-sm hover:bg-destructive/10 hover:text-destructive",
  destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
};

const sizes = {
  default: "h-8 px-3 py-1.5 text-xs",
  sm: "h-7 rounded-md px-2.5 text-[11px]",
  xs: "h-6 rounded-md px-2 text-[10px]",
  icon: "h-7 w-7",
};

export function Button({ className, size = "default", variant = "default", ...props }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-3.5 [&_svg]:shrink-0",
        variants[variant],
        sizes[size],
        className,
      )}
      type="button"
      {...props}
    />
  );
}
