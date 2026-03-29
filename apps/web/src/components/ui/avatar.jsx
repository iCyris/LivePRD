import { useState } from "react";
import { cn } from "../../lib/cn.js";

export function Avatar({ className, ...props }) {
  return (
    <span
      className={cn("relative inline-flex h-10 w-10 shrink-0 overflow-hidden rounded-full border border-border bg-muted", className)}
      {...props}
    />
  );
}

export function AvatarImage({ className, onError, ...props }) {
  const [hidden, setHidden] = useState(false);

  if (hidden) {
    return null;
  }

  return (
    <img
      className={cn("aspect-square h-full w-full object-cover", className)}
      onError={(event) => {
        setHidden(true);
        onError?.(event);
      }}
      {...props}
    />
  );
}

export function AvatarFallback({ className, ...props }) {
  return (
    <span
      className={cn("flex h-full w-full items-center justify-center bg-muted text-xs font-medium text-muted-foreground", className)}
      {...props}
    />
  );
}
