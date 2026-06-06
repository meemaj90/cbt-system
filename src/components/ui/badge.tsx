import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info";
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  const styles: Record<string, React.CSSProperties> = {
    default: { background: "rgba(107,114,128,0.15)", color: "#a0a8c0" },
    success: { background: "rgba(16,185,129,0.15)", color: "#10b981" },
    warning: { background: "rgba(245,158,11,0.15)", color: "#f59e0b" },
    danger: { background: "rgba(239,68,68,0.15)", color: "#ef4444" },
    info: { background: "rgba(26,86,219,0.15)", color: "#3b82f6" },
  };

  return (
    <span
      style={styles[variant]}
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
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
