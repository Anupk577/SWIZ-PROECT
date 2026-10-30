import React from "react";
import { useTheme } from "../context/ThemeContext";

interface SwizLogoProps {
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
  forceTheme?: "light" | "dark";
  className?: string;
}

export const SwizLogo: React.FC<SwizLogoProps> = ({
  size = "md",
  forceTheme,
  className = "",
}) => {
  const { isDark } = useTheme();

  const effectiveDark = forceTheme ? forceTheme === "dark" : isDark;

  const heightClass = {
    sm: "h-9 sm:h-10",
    md: "h-12 sm:h-14",
    lg: "h-16 sm:h-20",
  }[size];

  const logoSrc = effectiveDark
    ? "/swiz-logo-nav.jpg"
    : "/swiz-logo-transparent.png";

  const blendClass = effectiveDark ? "mix-blend-screen" : "mix-blend-multiply";

  return (
    <div className={`flex items-center select-none group cursor-pointer ${className}`}>
      <img
        src={logoSrc}
        alt="Swizcoin — The Limitless"
        className={`${heightClass} w-auto object-contain ${blendClass} transition-transform duration-300 group-hover:scale-105`}
      />
    </div>
  );
};
