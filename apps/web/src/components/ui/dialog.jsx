import { cloneElement, createContext, isValidElement, useContext, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "../../lib/cn.js";

const DialogContext = createContext(null);

function useDialogContext() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error("Dialog components must be used within <Dialog>.");
  }
  return context;
}

function useControlledOpen(open, defaultOpen, onOpenChange) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen || false);
  const isControlled = open !== undefined;
  const value = isControlled ? open : uncontrolledOpen;
  const setValue = (nextValue) => {
    if (!isControlled) {
      setUncontrolledOpen(nextValue);
    }
    onOpenChange?.(nextValue);
  };

  return [value, setValue];
}

export function Dialog({ children, defaultOpen = false, onOpenChange, open }) {
  const [isOpen, setIsOpen] = useControlledOpen(open, defaultOpen, onOpenChange);
  const value = useMemo(() => ({ open: isOpen, setOpen: setIsOpen }), [isOpen, setIsOpen]);
  return <DialogContext.Provider value={value}>{children}</DialogContext.Provider>;
}

export function DialogTrigger({ asChild = false, children, ...props }) {
  const { setOpen } = useDialogContext();

  if (asChild && isValidElement(children)) {
    return cloneElement(children, {
      ...props,
      onClick: (event) => {
        children.props.onClick?.(event);
        setOpen(true);
      },
    });
  }

  return <button type="button" {...props} onClick={() => setOpen(true)}>{children}</button>;
}

export function DialogPortal({ children }) {
  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(children, document.body);
}

export function DialogOverlay({ className, ...props }) {
  const { setOpen } = useDialogContext();
  return (
    <div
      className={cn("fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm", className)}
      onClick={() => setOpen(false)}
      {...props}
    />
  );
}

export function DialogContent({ children, className, showClose = true, ...props }) {
  const { open, setOpen } = useDialogContext();

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, setOpen]);

  if (!open) {
    return null;
  }

  return (
    <DialogPortal>
      <DialogOverlay />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className={cn("relative z-50 w-full max-w-lg rounded-lg border bg-background p-6 shadow-lg", className)}
          role="dialog"
          {...props}
        >
          {showClose ? (
            <button
              aria-label="Close dialog"
              className="absolute right-4 top-4 rounded-sm text-muted-foreground transition hover:text-foreground"
              onClick={() => setOpen(false)}
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
          {children}
        </div>
      </div>
    </DialogPortal>
  );
}

export function DialogHeader({ className, ...props }) {
  return <div className={cn("mb-4 flex flex-col gap-1.5 text-left", className)} {...props} />;
}

export function DialogTitle({ className, ...props }) {
  return <h2 className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} />;
}

export function DialogDescription({ className, ...props }) {
  return <p className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

export function DialogFooter({ className, ...props }) {
  return <div className={cn("mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)} {...props} />;
}

export function DialogClose({ children, ...props }) {
  const { setOpen } = useDialogContext();
  return <button type="button" {...props} onClick={() => setOpen(false)}>{children}</button>;
}
