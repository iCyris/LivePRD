import { Languages } from "lucide-react";

import { localeOptions } from "../lib/i18n.js";
import { Button } from "./ui/button.jsx";

export function LanguageToggle({ copy, value, onChange }) {
  return (
    <div className="inline-flex items-center gap-1 rounded-md border bg-background px-1 py-0.5">
      <span className="inline-flex items-center gap-1 px-1.5 text-[10px] text-muted-foreground">
        <Languages className="h-3.5 w-3.5" />
        {copy.language}
      </span>
      {localeOptions.map((option) => {
        const isActive = option.value === value;
        return (
          <Button
            className={isActive ? "bg-accent text-accent-foreground shadow-none" : "shadow-none"}
            key={option.value}
            onClick={() => onChange(option.value)}
            size="xs"
            type="button"
            variant="ghost"
          >
            {copy[option.labelKey]}
          </Button>
        );
      })}
    </div>
  );
}
