import { createContext, useContext, useMemo } from "react";
import { Circle } from "lucide-react";
import { cn } from "../../lib/cn.js";

const RadioGroupContext = createContext(null);

export function RadioGroup({ children, className, onValueChange, value }) {
  const contextValue = useMemo(() => ({ onValueChange, value }), [onValueChange, value]);
  return (
    <RadioGroupContext.Provider value={contextValue}>
      <div className={cn("grid gap-2", className)} role="radiogroup">
        {children}
      </div>
    </RadioGroupContext.Provider>
  );
}

export function RadioGroupItem({ className, value, ...props }) {
  const context = useContext(RadioGroupContext);
  const checked = context?.value === value;
  return (
    <button
      aria-checked={checked}
      className={cn(
        "inline-flex h-4 w-4 items-center justify-center rounded-full border border-input text-primary transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        checked && "border-primary",
        className,
      )}
      onClick={() => context?.onValueChange?.(value)}
      role="radio"
      type="button"
      {...props}
    >
      {checked ? <Circle className="h-2.5 w-2.5 fill-current" /> : null}
    </button>
  );
}
