import React from "react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
  className?: string;
}

export function Logo({ size = "md", showWordmark = true, className = "" }: LogoProps) {
  const iconSizes = {
    sm: "w-6 h-6",
    md: "w-7 h-7",
    lg: "w-9 h-9",
  };

  const textSizes = {
    sm: "text-base font-bold tracking-tight",
    md: "text-lg font-bold tracking-tight",
    lg: "text-xl font-bold tracking-tight",
  };

  return (
    <div className={`inline-flex items-center gap-2.5 select-none group cursor-pointer ${className}`}>
      {/* Dynamic Blue Monogram "T" with hover scale/rotation */}
      <div
        className={`${iconSizes[size]} bg-gradient-to-br from-blue-600 via-blue-600 to-blue-700 flex items-center justify-center rounded-[8px] shrink-0 shadow-sm shadow-blue-500/30 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300 ease-out`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-4 text-white stroke-current group-hover:scale-110 transition-transform duration-200"
        >
          <path
            d="M4 6H20M12 6V19"
            stroke="currentColor"
            strokeWidth="2.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {showWordmark && (
        <span className={`${textSizes[size]} text-text-primary font-bold tracking-tight flex items-center gap-1`}>
          <span>Tanggap</span>
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse inline-block"></span>
        </span>
      )}
    </div>
  );
}
