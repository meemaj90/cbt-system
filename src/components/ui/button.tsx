import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    const variants = {
      primary: "text-white border-transparent",
      secondary: "border text-white",
      danger: "text-white border-transparent",
      ghost: "bg-transparent border-transparent",
    };

    const styles: Record<string, React.CSSProperties> = {
      primary: { background: "#1a56db" },
      secondary: { background: "#1e2235", borderColor: "#2e3250", color: "#a0a8c0" },
      danger: { background: "#ef4444" },
      ghost: { color: "#a0a8c0" },
    };

    const sizes = {
      sm: "px-3 py-1.5 text-xs",
      md: "px-4 py-2 text-sm",
      lg: "px-6 py-2.5 text-base",
    };

    return (
      <button
        ref={ref}
        style={styles[variant]}
        className={cn(
          "inline-flex items-center justify-center font-medium rounded-lg border transition-colors",
          "focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed",
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
