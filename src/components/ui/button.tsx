import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    const variants = {
      primary: "bg-indigo-600 hover:bg-indigo-700 text-white border-transparent",
      secondary: "bg-white hover:bg-gray-50 text-gray-700 border-gray-300",
      danger: "bg-red-600 hover:bg-red-700 text-white border-transparent",
      ghost: "bg-transparent hover:bg-gray-100 text-gray-700 border-transparent",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-xs",
      md: "px-4 py-2 text-sm",
      lg: "px-6 py-2.5 text-base",
    };

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-medium rounded-lg border transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button };
