import React from "react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
  className?: string;
}

export function Logo({ size = "md", showWordmark = true, className = "" }: LogoProps) {
  const iconSizes = {
    sm: "w-5 h-5",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  const textSizes = {
    sm: "text-base font-bold tracking-tight",
    md: "text-lg font-bold tracking-tight",
    lg: "text-xl font-bold tracking-tight",
  };

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Geometrical Monochrome Monogram "T" */}
      <div
        className={`${iconSizes[size]} bg-primary flex items-center justify-center rounded-[6px] shrink-0 border border-primary`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-4 text-primary-foreground stroke-current"
        >
          <path
            d="M4 6H20M12 6V19"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="square"
            strokeLinejoin="miter"
          />
        </svg>
      </div>

      {showWordmark && (
        <span className={`${textSizes[size]} text-text-primary font-semibold tracking-tight`}>
          Tanggap
        </span>
      )}
    </div>
  );
}

