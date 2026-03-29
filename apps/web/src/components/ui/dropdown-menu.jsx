import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check } from "lucide-react";
import { cn } from "../../lib/cn.js";

const DropdownMenuContext = createContext(null);

function useDropdownMenuContext() {
  const context = useContext(DropdownMenuContext);
  if (!context) {
    throw new Error("Dropdown menu components must be used within <DropdownMenu>.");
  }
  return context;
}

export function DropdownMenu({ children }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const contentRef = useRef(null);
  const value = useMemo(() => ({ contentRef, open, setOpen, triggerRef }), [open]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const onPointerDown = (event) => {
      const target = event.target;
      if (contentRef.current?.contains(target) || triggerRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    };

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return <DropdownMenuContext.Provider value={value}>{children}</DropdownMenuContext.Provider>;
}

export function DropdownMenuTrigger({ children, ...props }) {
  const { open, setOpen, triggerRef } = useDropdownMenuContext();

  return (
    <button
      aria-expanded={open}
      ref={triggerRef}
      type="button"
      {...props}
      onClick={() => setOpen(!open)}
    >
      {children}
    </button>
  );
}

export function DropdownMenuContent({ align = "start", children, className, sideOffset = 8, ...props }) {
  const { contentRef, open, triggerRef } = useDropdownMenuContext();
  const [position, setPosition] = useState({ left: 0, top: 0 });

  useEffect(() => {
    if (!open || !triggerRef.current) {
      return;
    }

    const rect = triggerRef.current.getBoundingClientRect();
    setPosition({
      left: align === "end" ? rect.right : rect.left,
      top: rect.bottom + sideOffset,
    });
  }, [align, open, sideOffset, triggerRef]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className={cn(
        "z-[70] min-w-[12rem] rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md",
        className,
      )}
      ref={contentRef}
      style={{
        left: `${position.left}px`,
        position: "fixed",
        top: `${position.top}px`,
        transform: align === "end" ? "translateX(-100%)" : undefined,
      }}
      {...props}
    >
      {children}
    </div>,
    document.body,
  );
}

export function DropdownMenuLabel({ className, ...props }) {
  return <div className={cn("px-2 py-1.5 text-xs font-semibold text-foreground", className)} {...props} />;
}

export function DropdownMenuSeparator({ className, ...props }) {
  return <div className={cn("-mx-1 my-1 h-px bg-border", className)} {...props} />;
}

export function DropdownMenuItem({ children, className, inset = false, onSelect, ...props }) {
  const { setOpen } = useDropdownMenuContext();
  return (
    <button
      className={cn(
        "flex w-full items-center rounded-sm px-2 py-1.5 text-left text-sm outline-none transition hover:bg-accent hover:text-accent-foreground",
        inset && "pl-8",
        className,
      )}
      onClick={() => {
        onSelect?.();
        setOpen(false);
      }}
      type="button"
      {...props}
    >
      {children}
    </button>
  );
}

export function DropdownMenuCheckboxItem({ checked = false, children, className, onCheckedChange, ...props }) {
  return (
    <DropdownMenuItem
      className={cn("justify-between", className)}
      onSelect={() => onCheckedChange?.(!checked)}
      {...props}
    >
      <span>{children}</span>
      {checked ? <Check className="h-4 w-4" /> : null}
    </DropdownMenuItem>
  );
}
