import { cn } from "../../lib/cn.js";

export function Card({ className, ...props }) {
  return (
    <section
      className={cn(
        "rounded-[var(--prd-radius)] border border-[color:var(--prd-border)] bg-[color:var(--prd-panel)]",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }) {
  return <header className={cn("flex flex-col p-6", className)} {...props} />;
}

export function CardTitle({ className, ...props }) {
  return (
    <h3
      className={cn("font-semibold leading-tight text-[color:var(--prd-text)]", className)}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }) {
  return (
    <p
      className={cn("text-sm leading-6 text-[color:var(--prd-muted)]", className)}
      {...props}
    />
  );
}

export function CardContent({ className, ...props }) {
  return <div className={cn("px-6 pb-6", className)} {...props} />;
}
