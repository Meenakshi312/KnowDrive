import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, icon, rightElement, ...props }, ref) => {
    return (
      <div className="relative flex items-center w-full">
        {icon && <div className="absolute left-3.5 text-muted-foreground pointer-events-none flex items-center">{icon}</div>}
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-xl border border-input bg-background/80 px-3.5 py-2 text-sm shadow-sm transition-all file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50",
            icon && "pl-10",
            rightElement && "pr-10",
            className
          )}
          ref={ref}
          {...props}
        />
        {rightElement && <div className="absolute right-3 flex items-center">{rightElement}</div>}
      </div>
    );
  }
);
Input.displayName = "Input";
