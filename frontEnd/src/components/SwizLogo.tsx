import React from "react";

interface SwizLogoProps {
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
}

export const SwizLogo: React.FC<SwizLogoProps> = ({
  size = "md",
}) => {
  const heightClass = {
    sm: "h-10 sm:h-12",
    md: "h-14 sm:h-16",
    lg: "h-20 sm:h-24",
  }[size];

  return (
    <div className="flex items-center select-none group cursor-pointer">
      <img
        src="/swiz-logo-dark.png"
        alt="Swiz - The Limitless"
        className={`${heightClass} w-auto object-contain mix-blend-screen transition-transform duration-300 group-hover:scale-105`}
      />
    </div>
  );
};
