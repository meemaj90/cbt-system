import Link from "next/link";
import { StatusBadge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

interface AssessmentCardProps {
  assessment: {
    id: string;
    title: string;
    description?: string | null;
    type: string;
    status: string;
    subject: { name: string; code: string };
    class?: { name: string } | null;
    totalMarks: number;
    duration?: number | null;
    endTime?: string | Date | null;
    _count?: { questions: number; submissions: number };
  };
  href: string;
  role: "teacher" | "student";
}

const typeStyles: Record<string, React.CSSProperties> = {
  WRITTEN: { background: "rgba(26,86,219,0.15)", color: "#3b82f6" },
  PROJECT: { background: "rgba(139,92,246,0.15)", color: "#a78bfa" },
  ORAL: { background: "rgba(255,107,0,0.15)", color: "#ff8c38" },
};

const typeIcons: Record<string, string> = {
  WRITTEN: "W",
  PROJECT: "P",
  ORAL: "O",
};

export function AssessmentCard({ assessment, href, role }: AssessmentCardProps) {
  return (
    <Link href={href} className="block group">
      <div
        className="rounded-xl border p-5 transition-all"
        style={{
          background: "#1e2235",
          borderColor: "#2e3250",
        }}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span
              className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
              style={typeStyles[assessment.type] ?? { background: "rgba(107,114,128,0.15)", color: "#6b7280" }}
            >
              {typeIcons[assessment.type] ?? "?"}
            </span>
            <div>
              <p className="text-xs" style={{ color: "#6b7280" }}>{assessment.subject.code}</p>
              <p className="text-xs" style={{ color: "#6b7280" }}>
                {assessment.type.charAt(0) + assessment.type.slice(1).toLowerCase()}
              </p>
            </div>
          </div>
          <StatusBadge status={assessment.status} />
        </div>

        <h3 className="font-semibold text-white mb-1 line-clamp-2 group-hover:text-blue-400 transition-colors">
          {assessment.title}
        </h3>
        {assessment.description && (
          <p className="text-sm line-clamp-2 mb-3" style={{ color: "#6b7280" }}>
            {assessment.description}
          </p>
        )}

        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 pt-3 border-t" style={{ borderColor: "#2e3250" }}>
          <span className="text-xs" style={{ color: "#6b7280" }}>
            <span className="font-medium text-white">{assessment.totalMarks}</span> marks
          </span>
          {assessment.duration && (
            <span className="text-xs" style={{ color: "#6b7280" }}>
              <span className="font-medium text-white">{assessment.duration}</span> min
            </span>
          )}
          {assessment.class && (
            <span className="text-xs" style={{ color: "#6b7280" }}>
              Class: <span className="font-medium text-white">{assessment.class.name}</span>
            </span>
          )}
          {assessment.endTime && (
            <span className="text-xs" style={{ color: "#6b7280" }}>
              Due: <span className="font-medium text-white">{formatDate(assessment.endTime)}</span>
            </span>
          )}
          {role === "teacher" && assessment._count && (
            <span className="text-xs" style={{ color: "#6b7280" }}>
              <span className="font-medium text-white">{assessment._count.submissions}</span> submissions
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
