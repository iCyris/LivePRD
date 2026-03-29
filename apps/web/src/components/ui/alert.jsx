import { cn } from "../../lib/cn.js";

const variants = {
  default: "border-border bg-background text-foreground",
  destructive: "border-destructive/40 bg-destructive/10 text-destructive",
};

export function Alert({ children, className, variant = "default", ...props }) {
  return (
    <div
      className={cn("relative w-full rounded-lg border px-4 py-3 text-sm", variants[variant], className)}
      role="alert"
      {...props}
    >
      {children}
    </div>
  );
}

export function AlertTitle({ className, ...props }) {
  return <h5 className={cn("mb-1 font-medium leading-none tracking-tight", className)} {...props} />;
}

export function AlertDescription({ className, ...props }) {
  return <div className={cn("text-sm text-muted-foreground [&_p]:leading-relaxed", className)} {...props} />;
}
