import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info";
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  const variants = {
    default: "bg-gray-100 text-gray-800",
    success: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
    danger: "bg-red-100 text-red-800",
    info: "bg-blue-100 text-blue-800",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; variant: BadgeProps["variant"] }> = {
    DRAFT: { label: "Draft", variant: "default" },
    PUBLISHED: { label: "Published", variant: "info" },
    ACTIVE: { label: "Active", variant: "success" },
    CLOSED: { label: "Closed", variant: "danger" },
    IN_PROGRESS: { label: "In Progress", variant: "warning" },
    SUBMITTED: { label: "Submitted", variant: "info" },
    GRADED: { label: "Graded", variant: "success" },
  };

  const cfg = config[status] ?? { label: status, variant: "default" as const };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}
