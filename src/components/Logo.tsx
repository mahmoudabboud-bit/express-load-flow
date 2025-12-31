import { Truck } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoProps {
  variant?: "light" | "dark";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeStyles = {
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-4xl",
};

const iconSizes = {
  sm: 20,
  md: 28,
  lg: 40,
};

export function Logo({ variant = "dark", size = "md", className }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn(
        "p-2 rounded-lg",
        variant === "light" ? "bg-accent" : "bg-accent"
      )}>
        <Truck 
          size={iconSizes[size]} 
          className="text-accent-foreground" 
          strokeWidth={2.5}
        />
      </div>
      <div className="flex flex-col leading-none">
        <span className={cn(
          "font-bold tracking-tight",
          sizeStyles[size],
          variant === "light" ? "text-primary-foreground" : "text-foreground"
        )}>
          Road Runner
        </span>
        <span className={cn(
          "font-medium tracking-widest uppercase",
          size === "sm" ? "text-[10px]" : size === "md" ? "text-xs" : "text-sm",
          variant === "light" ? "text-primary-foreground/80" : "text-accent"
        )}>
          Express
        </span>
      </div>
    </div>
  );
}
