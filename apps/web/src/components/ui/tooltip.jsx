import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "../../lib/cn.js";

export function Tooltip({ children, content, side = "top" }) {
  const triggerRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ left: 0, top: 0 });

  useEffect(() => {
    if (!open || !triggerRef.current) {
      return;
    }

    const rect = triggerRef.current.getBoundingClientRect();
    const positions = {
      bottom: { left: rect.left + rect.width / 2, top: rect.bottom + 10, transform: "translateX(-50%)" },
      left: { left: rect.left - 10, top: rect.top + rect.height / 2, transform: "translate(-100%, -50%)" },
      right: { left: rect.right + 10, top: rect.top + rect.height / 2, transform: "translateY(-50%)" },
      top: { left: rect.left + rect.width / 2, top: rect.top - 10, transform: "translate(-50%, -100%)" },
    };

    setPosition(positions[side] || positions.top);
  }, [open, side]);

  return (
    <>
      <span
        onBlur={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        ref={triggerRef}
      >
        {children}
      </span>
      {open && typeof document !== "undefined"
        ? createPortal(
          <div
            className={cn("pointer-events-none fixed z-[80] rounded-md bg-foreground px-2 py-1 text-xs text-background shadow")}
            style={position}
          >
            {content}
          </div>,
          document.body,
        )
        : null}
    </>
  );
}
