import { Laptop, Moon, Sun } from "lucide-react";

import { Button } from "./ui/button.jsx";

const options = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Laptop },
];

export function ModeToggle({ value, onChange }) {
  return (
    <div className="inline-flex items-center rounded-md border bg-background p-0.5">
      {options.map((option) => {
        const Icon = option.icon;
        const isActive = option.value === value;

        return (
          <Button
            key={option.value}
            className={isActive ? "bg-accent text-accent-foreground shadow-none" : "shadow-none"}
            onClick={() => onChange(option.value)}
            size="xs"
            title={option.label}
            type="button"
            variant="ghost"
          >
            <Icon className="h-4 w-4" />
            <span className="sr-only">{option.label}</span>
          </Button>
        );
      })}
    </div>
  );
}
