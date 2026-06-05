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

const typeColors: Record<string, string> = {
  WRITTEN: "bg-blue-50 text-blue-700 border-blue-200",
  PROJECT: "bg-purple-50 text-purple-700 border-purple-200",
  ORAL: "bg-orange-50 text-orange-700 border-orange-200",
};

const typeIcons: Record<string, string> = {
  WRITTEN: "W",
  PROJECT: "P",
  ORAL: "O",
};

export function AssessmentCard({ assessment, href, role }: AssessmentCardProps) {
  return (
    <Link href={href} className="block group">
      <div className="bg-white rounded-xl border border-gray-200 p-5 hover:border-indigo-300 hover:shadow-md transition-all">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold border ${typeColors[assessment.type] ?? "bg-gray-50 text-gray-700 border-gray-200"}`}
            >
              {typeIcons[assessment.type] ?? "?"}
            </span>
            <div>
              <p className="text-xs text-gray-500">{assessment.subject.code}</p>
              <p className="text-xs text-gray-400">{assessment.type.charAt(0) + assessment.type.slice(1).toLowerCase()}</p>
            </div>
          </div>
          <StatusBadge status={assessment.status} />
        </div>

        <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-indigo-700 transition-colors line-clamp-2">
          {assessment.title}
        </h3>
        {assessment.description && (
          <p className="text-sm text-gray-500 line-clamp-2 mb-3">{assessment.description}</p>
        )}

        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 pt-3 border-t border-gray-100">
          <span className="text-xs text-gray-500">
            <span className="font-medium text-gray-700">{assessment.totalMarks}</span> marks
          </span>
          {assessment.duration && (
            <span className="text-xs text-gray-500">
              <span className="font-medium text-gray-700">{assessment.duration}</span> min
            </span>
          )}
          {assessment.class && (
            <span className="text-xs text-gray-500">
              Class: <span className="font-medium text-gray-700">{assessment.class.name}</span>
            </span>
          )}
          {assessment.endTime && (
            <span className="text-xs text-gray-500">
              Due: <span className="font-medium text-gray-700">{formatDate(assessment.endTime)}</span>
            </span>
          )}
          {role === "teacher" && assessment._count && (
            <span className="text-xs text-gray-500">
              <span className="font-medium text-gray-700">{assessment._count.submissions}</span> submissions
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
