import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <div
      className={cn("rounded-xl border p-6", className)}
      style={{ background: "#1e2235", borderColor: "#2e3250" }}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: CardProps) {
  return (
    <div
      className={cn("px-6 py-4 border-b", className)}
      style={{ borderColor: "#2e3250" }}
    >
      {children}
    </div>
  );
}

export function CardContent({ children, className }: CardProps) {
  return <div className={cn("px-6 py-4", className)}>{children}</div>;
}

export function CardTitle({ children, className }: CardProps) {
  return <h3 className={cn("text-lg font-semibold text-white", className)}>{children}</h3>;
}
