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
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Export Results
          </button>
        </div>
      )}
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assessment</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">%</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {results.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500 text-sm">
                  No results found.
                </td>
              </tr>
            ) : (
              results.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{row.studentName}</p>
                      {row.studentId && (
                        <p className="text-xs text-gray-500">{row.studentId}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{row.class ?? "-"}</td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-900 max-w-xs truncate">{row.assessmentTitle}</p>
                    <p className="text-xs text-gray-500">{row.subject}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                      {row.assessmentType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {row.scoreObtained !== null ? `${row.scoreObtained}/${row.totalMarks}` : "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {row.percentage !== null ? `${row.percentage.toFixed(1)}%` : "-"}
                  </td>
                  <td className="px-4 py-3">
                    {row.grade ? (
                      <span className={`text-sm font-bold ${getGradeColor(row.grade)}`}>
                        {row.grade}
                      </span>
                    ) : (
                      "-"
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
