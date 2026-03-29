import { createContext, useContext, useMemo, useState } from "react";
import { cn } from "../../lib/cn.js";

const TabsContext = createContext(null);

export function Tabs({ children, className, defaultValue, onValueChange, value: controlledValue }) {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const value = controlledValue ?? uncontrolledValue;
  const setValue = (nextValue) => {
    if (controlledValue === undefined) {
      setUncontrolledValue(nextValue);
    }
    onValueChange?.(nextValue);
  };

  const contextValue = useMemo(() => ({ setValue, value }), [value]);

  return (
    <TabsContext.Provider value={contextValue}>
      <div className={cn("w-full", className)}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ className, ...props }) {
  return <div className={cn("inline-flex h-9 items-center rounded-lg bg-muted p-1 text-muted-foreground", className)} {...props} />;
}

export function TabsTrigger({ children, className, value, ...props }) {
  const context = useContext(TabsContext);
  const active = context?.value === value;

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        active && "bg-background text-foreground shadow-sm",
        className,
      )}
      onClick={() => context?.setValue?.(value)}
      type="button"
      {...props}
    >
      {children}
    </button>
  );
}

export function TabsContent({ children, className, value, ...props }) {
  const context = useContext(TabsContext);

  if (context?.value !== value) {
    return null;
  }

  return <div className={cn("mt-2", className)} {...props}>{children}</div>;
}
