import { Laptop, Moon, Sun } from "lucide-react";

import { Button } from "./ui/button.jsx";

const options = [
  { value: "light", labelKey: "light", fallback: "Light", icon: Sun },
  { value: "dark", labelKey: "dark", fallback: "Dark", icon: Moon },
  { value: "system", labelKey: "system", fallback: "System", icon: Laptop },
];

export function ModeToggle({ copy = {}, value, onChange }) {
  return (
    <div className="inline-flex items-center rounded-md border bg-background p-0.5">
      {options.map((option) => {
        const Icon = option.icon;
        const isActive = option.value === value;
        const label = copy[option.labelKey] || option.fallback;

        return (
          <Button
            key={option.value}
            className={isActive ? "bg-accent text-accent-foreground shadow-none" : "shadow-none"}
            onClick={() => onChange(option.value)}
            size="xs"
            title={label}
            type="button"
            variant="ghost"
          >
            <Icon className="h-4 w-4" />
            <span className="sr-only">{label}</span>
          </Button>
        );
      })}
    </div>
  );
}
