import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

const Input = forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        "block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm",
        "focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500",
        "disabled:bg-gray-50 disabled:text-gray-500",
        "placeholder:text-gray-400",
        className
      )}
      {...props}
    />
  );
});

Input.displayName = "Input";

export { Input };
