"use client";

import { getGradeColor } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/badge";

interface ResultRow {
  id: string;
  studentId?: string | null;
  studentName: string;
  class?: string | null;
  subject: string;
  assessmentTitle: string;
  assessmentType: string;
  totalMarks: number;
  scoreObtained: number | null;
  percentage: number | null;
  grade: string | null;
  status: string;
}

interface ResultsTableProps {
  results: ResultRow[];
  showExport?: boolean;
  exportUrl?: string;
}

export function ResultsTable({ results, showExport = false, exportUrl }: ResultsTableProps) {
  function handleExport() {
    if (exportUrl) {
      window.open(exportUrl, "_blank");
    }
  }

  return (
    <div>
      {showExport && (
        <div className="flex justify-end mb-4 gap-2">
          <button onClick={handleExport} className="btn-secondary flex items-center gap-2 text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export Results
          </button>
        </div>
      )}
      <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "#2e3250" }}>
        <table className="min-w-full divide-y" style={{ borderColor: "#2e3250" }}>
          <thead style={{ background: "#1a1d27" }}>
            <tr>
              {["Student", "Class", "Assessment", "Type", "Score", "%", "Grade", "Status"].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-medium uppercase"
                  style={{ color: "#6b7280" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody style={{ background: "#1e2235" }}>
            {results.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-sm" style={{ color: "#6b7280" }}>
                  No results found.
                </td>
              </tr>
            ) : (
              results.map((row) => (
                <tr
                  key={row.id}
                  className="border-t transition-colors"
                  style={{ borderColor: "#2e3250" }}
                >
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-white">{row.studentName}</p>
                      {row.studentId && (
                        <p className="text-xs" style={{ color: "#6b7280" }}>{row.studentId}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: "#a0a8c0" }}>{row.class ?? "-"}</td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-white max-w-xs truncate">{row.assessmentTitle}</p>
                    <p className="text-xs" style={{ color: "#6b7280" }}>{row.subject}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded"
                      style={{ background: "rgba(26,86,219,0.15)", color: "#3b82f6" }}
                    >
                      {row.assessmentType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-white">
                    {row.scoreObtained !== null ? `${row.scoreObtained}/${row.totalMarks}` : "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-white">
                    {row.percentage !== null ? `${row.percentage.toFixed(1)}%` : "-"}
                  </td>
                  <td className="px-4 py-3">
                    {row.grade ? (
                      <span className={`text-sm font-bold ${getGradeColor(row.grade)}`}>
                        {row.grade}
                      </span>
                    ) : (
                      <span style={{ color: "#6b7280" }}>-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={row.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
