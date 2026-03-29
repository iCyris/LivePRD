import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "../../lib/cn.js";

const PopoverContext = createContext(null);

function usePopoverContext() {
  const context = useContext(PopoverContext);
  if (!context) {
    throw new Error("Popover components must be used within <Popover>.");
  }
  return context;
}

export function Popover({ children, defaultOpen = false, open: controlledOpen, onOpenChange }) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = (nextValue) => {
    if (controlledOpen === undefined) {
      setUncontrolledOpen(nextValue);
    }
    onOpenChange?.(nextValue);
  };
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

  return <PopoverContext.Provider value={value}>{children}</PopoverContext.Provider>;
}

export function PopoverTrigger({ children, ...props }) {
  const { open, setOpen, triggerRef } = usePopoverContext();
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

export function PopoverContent({ align = "center", children, className, sideOffset = 8, ...props }) {
  const { contentRef, open, triggerRef } = usePopoverContext();
  const [position, setPosition] = useState({ left: 0, top: 0 });

  useEffect(() => {
    if (!open || !triggerRef.current) {
      return;
    }

    const rect = triggerRef.current.getBoundingClientRect();
    const center = rect.left + rect.width / 2;
    const left = align === "start" ? rect.left : align === "end" ? rect.right : center;

    setPosition({
      left,
      top: rect.bottom + sideOffset,
    });
  }, [align, open, sideOffset, triggerRef]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  const transform = align === "center"
    ? "translateX(-50%)"
    : align === "end"
      ? "translateX(-100%)"
      : undefined;

  return createPortal(
    <div
      className={cn("z-[70] w-72 rounded-md border border-border bg-popover p-4 text-popover-foreground shadow-md", className)}
      ref={contentRef}
      style={{ left: `${position.left}px`, position: "fixed", top: `${position.top}px`, transform }}
      {...props}
    >
      {children}
    </div>,
    document.body,
  );
}
