"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

interface ToggleSwitchProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  showLabel?: boolean;
}

const sizes = {
  sm: { button: "h-6 w-12", circle: "h-4 w-4", translate: "translate-x-7", icon: 12 },
  md: { button: "h-8 w-16", circle: "h-6 w-6", translate: "translate-x-9", icon: 14 },
  lg: { button: "h-10 w-20", circle: "h-8 w-8", translate: "translate-x-11", icon: 16 },
};

export default function ToggleSwitch({
  size = "md",
  className = "",
  showLabel = false,
}: ToggleSwitchProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const dimensions = sizes[size];
  const isDark = mounted && resolvedTheme === "dark";

  useEffect(() => setMounted(true), []);

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {showLabel && (
        <span className="text-sm text-[#7E6B5C] dark:text-[#C4B5A0]">
          {isDark ? "Тёмная" : "Светлая"}
        </span>
      )}
      <button
        type="button"
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className={`relative inline-flex items-center rounded-full transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF7340] ${isDark ? "bg-[#2C2C2C]" : "bg-[#FFC873]"} ${dimensions.button}`}
        role="switch"
        aria-checked={isDark}
        aria-label="Переключить тему"
        disabled={!mounted}
      >
        <span
          className={`flex transform cursor-pointer items-center justify-center rounded-full bg-white shadow-lg transition-transform duration-300 ${dimensions.circle} ${isDark ? dimensions.translate : "translate-x-1"}`}
        >
          {isDark ? (
            <Moon size={dimensions.icon} className="text-[#4A3B2C]" />
          ) : (
            <Sun size={dimensions.icon} className="text-[#FF7340]" />
          )}
        </span>
      </button>
    </div>
  );
}
