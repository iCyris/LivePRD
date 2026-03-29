import { createContext, useContext, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../../lib/cn.js";

const AccordionContext = createContext(null);

export function Accordion({ children, className, collapsible = true, defaultValue = null, type = "single" }) {
  const [value, setValue] = useState(type === "multiple" ? (defaultValue || []) : defaultValue);

  const contextValue = useMemo(() => ({
    collapsible,
    type,
    value,
    setValue,
  }), [collapsible, type, value]);

  return (
    <AccordionContext.Provider value={contextValue}>
      <div className={cn("w-full rounded-lg border border-border bg-card", className)}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
}

export function AccordionItem({ children, className, value }) {
  return (
    <div className={cn("border-b border-border last:border-b-0", className)} data-accordion-value={value}>
      {children}
    </div>
  );
}

export function AccordionTrigger({ children, className, value, ...props }) {
  const context = useContext(AccordionContext);
  const isOpen = context?.type === "multiple"
    ? context.value.includes(value)
    : context?.value === value;

  const onToggle = () => {
    if (!context) {
      return;
    }

    if (context.type === "multiple") {
      context.setValue((current) =>
        current.includes(value)
          ? current.filter((item) => item !== value)
          : [...current, value]);
      return;
    }

    if (isOpen && context.collapsible) {
      context.setValue(null);
      return;
    }

    context.setValue(value);
  };

  return (
    <button
      className={cn(
        "flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-medium transition hover:bg-muted/50",
        className,
      )}
      onClick={onToggle}
      type="button"
      {...props}
    >
      <span>{children}</span>
      <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", isOpen && "rotate-180")} />
    </button>
  );
}

export function AccordionContent({ children, className, value }) {
  const context = useContext(AccordionContext);
  const isOpen = context?.type === "multiple"
    ? context.value.includes(value)
    : context?.value === value;

  if (!isOpen) {
    return null;
  }

  return <div className={cn("px-4 pb-4 pt-0 text-sm text-muted-foreground", className)}>{children}</div>;
}
