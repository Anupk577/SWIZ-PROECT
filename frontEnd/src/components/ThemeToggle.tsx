import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

interface ThemeToggleProps {
  compact?: boolean;
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  compact = false,
  className = "",
}) => {
  const { toggleTheme, isDark } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
      title={`Switch to ${isDark ? "light" : "dark"} theme`}
      className={`group relative inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono tracking-wider uppercase transition-all duration-300 border cursor-pointer select-none ${
        isDark
          ? "bg-[#181818] hover:bg-[#222222] text-[#F5F4F0] border-white/10 hover:border-[#8B1A1A]/60 shadow-sm"
          : "bg-[#F4F2EE] hover:bg-[#ECEBE7] text-[#141414] border-black/10 hover:border-[#8B1A1A]/50 shadow-sm"
      } ${className}`}
    >
      <div className="relative w-4 h-4 flex items-center justify-center">
        {isDark ? (
          <Moon className="w-3.5 h-3.5 text-[#E5B54F] transition-transform duration-300 group-hover:-rotate-12" />
        ) : (
          <Sun className="w-3.5 h-3.5 text-[#8B1A1A] transition-transform duration-300 group-hover:rotate-45" />
        )}
      </div>

      {!compact && (
        <span className="font-cond font-semibold text-[11px] tracking-widest">
          {isDark ? "DARK" : "LIGHT"}
        </span>
      )}

      {/* Visual Indicator Dot */}
      <span
        className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
          isDark ? "bg-[#8B1A1A]" : "bg-[#8B1A1A]"
        }`}
      />
    </button>
  );
};
