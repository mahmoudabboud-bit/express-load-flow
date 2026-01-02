import { cn } from "@/lib/utils";

interface LogoProps {
  variant?: "light" | "dark";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeStyles = {
  sm: "text-xl",
  md: "text-3xl",
  lg: "text-5xl",
};

const iconSizes = {
  sm: 32,
  md: 44,
  lg: 60,
};

export function Logo({ variant = "dark", size = "md", className }: LogoProps) {
  const iconSize = iconSizes[size];
  
  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* Custom RR Icon with Speed Lines */}
      <div className={cn(
        "relative flex items-center justify-center rounded-xl",
        size === "sm" ? "w-10 h-10" : size === "md" ? "w-14 h-14" : "w-18 h-18"
      )}
      style={{
        background: "linear-gradient(135deg, hsl(25, 100%, 50%) 0%, hsl(25, 100%, 60%) 100%)",
        boxShadow: "0 4px 14px 0 hsl(25 100% 50% / 0.35)"
      }}
      >
        {/* Stylized RR Letters */}
        <svg 
          viewBox="0 0 40 40" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className={cn(
            size === "sm" ? "w-6 h-6" : size === "md" ? "w-9 h-9" : "w-12 h-12"
          )}
        >
          {/* Speed lines on left */}
          <path 
            d="M4 14H10M4 20H12M4 26H10" 
            stroke="white" 
            strokeWidth="2" 
            strokeLinecap="round"
            opacity="0.7"
          />
          {/* Truck silhouette facing right */}
          <path 
            d="M14 28V16C14 15.4477 14.4477 15 15 15H24L28 19V26C28 26.5523 27.5523 27 27 27H26M14 28C14 28.5523 14.4477 29 15 29H16M14 28V27M26 27C26 28.6569 24.6569 30 23 30C21.3431 30 20 28.6569 20 27M26 27H20M20 27H16M16 27C16 28.6569 17.3431 30 19 30C19.3506 30 19.6872 29.9398 20 29.8293" 
            stroke="white" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
          {/* Cab window */}
          <path 
            d="M24 15V19H28" 
            stroke="white" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
          {/* Road/ground line */}
          <path 
            d="M32 27H36" 
            stroke="white" 
            strokeWidth="2" 
            strokeLinecap="round"
            opacity="0.5"
          />
        </svg>
      </div>
      
      <div className="flex flex-col leading-none">
        <span className={cn(
          "font-extrabold tracking-tight",
          sizeStyles[size],
          variant === "light" ? "text-white" : "text-foreground"
        )}>
          Road Runner
        </span>
        <span className={cn(
          "font-bold tracking-[0.25em] uppercase",
          size === "sm" ? "text-[10px]" : size === "md" ? "text-xs" : "text-sm",
          "text-accent"
        )}>
          Express
        </span>
      </div>
    </div>
  );
}