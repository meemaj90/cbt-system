import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ResultsTable } from "@/components/results/results-table";

function getGradeLetter(pct: number | null): string {
  if (pct === null) return "N/A";
  if (pct >= 70) return "A";
  if (pct >= 60) return "B";
  if (pct >= 50) return "C";
  if (pct >= 40) return "D";
  return "F";
}

export default async function TeacherResultsPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const submissions = await prisma.submission.findMany({
    where: {
      assessment: { createdById: userId },
      status: { in: ["SUBMITTED", "GRADED"] },
    },
    include: {
      student: {
        select: { name: true, studentId: true, class: { select: { name: true } } },
      },
      assessment: {
        select: {
          id: true,
          title: true,
          type: true,
          totalMarks: true,
          passMark: true,
          subject: { select: { name: true } },
        },
      },
    },
    orderBy: { submittedAt: "desc" },
  });

  const results = submissions.map((s) => ({
    id: s.id,
    studentId: s.student.studentId,
    studentName: s.student.name,
    class: s.student.class?.name ?? null,
    subject: s.assessment.subject.name,
    assessmentTitle: s.assessment.title,
    assessmentType: s.assessment.type,
    totalMarks: s.assessment.totalMarks,
    scoreObtained: s.totalScore,
    percentage: s.percentage,
    grade: s.grade,
    status: s.status,
  }));

  // Analytics
  const total = results.length;
  const graded = results.filter((r) => r.status === "GRADED").length;
  const withPct = results.filter((r) => r.percentage !== null);
  const avgScore =
    withPct.length > 0
      ? withPct.reduce((sum, r) => sum + (r.percentage ?? 0), 0) / withPct.length
      : null;

  const passRate =
    withPct.length > 0
      ? (withPct.filter((r) => (r.percentage ?? 0) >= 50).length / withPct.length) * 100
      : null;

  // Grade distribution
  const gradeDist: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, F: 0 };
  for (const r of withPct) {
    const g = getGradeLetter(r.percentage);
    if (g in gradeDist) gradeDist[g]++;
  }

  // Assessment-level breakdown
  const assessmentMap = new Map<string, { title: string; count: number; totalPct: number; passes: number }>();
  for (const r of results) {
    const key = r.assessmentTitle;
    if (!assessmentMap.has(key)) {
      assessmentMap.set(key, { title: key, count: 0, totalPct: 0, passes: 0 });
    }
    const entry = assessmentMap.get(key)!;
    entry.count++;
    if (r.percentage !== null) {
      entry.totalPct += r.percentage;
      if (r.percentage >= 50) entry.passes++;
    }
  }
  const assessmentStats = Array.from(assessmentMap.values());

  // Top students
  const studentMap = new Map<string, { name: string; totalPct: number; count: number }>();
  for (const r of withPct) {
    if (!studentMap.has(r.studentName)) {
      studentMap.set(r.studentName, { name: r.studentName, totalPct: 0, count: 0 });
    }
    const e = studentMap.get(r.studentName)!;
    e.totalPct += r.percentage ?? 0;
    e.count++;
  }
  const topStudents = Array.from(studentMap.values())
    .map((s) => ({ ...s, avg: s.totalPct / s.count }))
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 5);

  const gradeColors: Record<string, string> = {
    A: "#10b981",
    B: "#3b82f6",
    C: "#f59e0b",
    D: "#ff6b00",
    F: "#ef4444",
  };

  return (
    <div className="page-container">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Results & Analytics</h1>
        <p className="text-sm mt-1" style={{ color: "#6b7280" }}>
          {total} submission{total !== 1 ? "s" : ""} across all your assessments
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Submissions", value: total, color: "#1a56db" },
          { label: "Graded", value: graded, color: "#10b981" },
          { label: "Avg Score", value: avgScore !== null ? `${avgScore.toFixed(1)}%` : "—", color: "#f59e0b" },
          { label: "Pass Rate", value: passRate !== null ? `${passRate.toFixed(0)}%` : "—", color: "#ff6b00" },
        ].map((stat) => (
          <div key={stat.label} className="stat-card">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${stat.color}20` }}
            >
              <div className="w-4 h-4 rounded-full" style={{ background: stat.color }} />
            </div>
            <div>
              <p className="text-xl font-bold text-white">{stat.value}</p>
              <p className="text-xs" style={{ color: "#6b7280" }}>{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Grade distribution */}
        <div className="card">
          <h2 className="text-base font-semibold text-white mb-4">Grade Distribution</h2>
          {withPct.length === 0 ? (
            <p className="text-sm" style={{ color: "#6b7280" }}>No graded results yet</p>
          ) : (
            <div className="space-y-2.5">
              {Object.entries(gradeDist).map(([grade, count]) => {
                const pct = withPct.length > 0 ? (count / withPct.length) * 100 : 0;
                return (
                  <div key={grade} className="flex items-center gap-3">
                    <span
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                      style={{ background: `${gradeColors[grade]}20`, color: gradeColors[grade] }}
                    >
                      {grade}
                    </span>
                    <div className="flex-1 h-2 rounded-full" style={{ background: "#2e3250" }}>
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{ width: `${pct}%`, background: gradeColors[grade] }}
                      />
                    </div>
                    <span className="text-xs w-12 text-right" style={{ color: "#a0a8c0" }}>
                      {count} ({pct.toFixed(0)}%)
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top students */}
        <div className="card">
          <h2 className="text-base font-semibold text-white mb-4">Top Performing Students</h2>
          {topStudents.length === 0 ? (
            <p className="text-sm" style={{ color: "#6b7280" }}>No data yet</p>
          ) : (
            <div className="space-y-2">
              {topStudents.map((s, i) => (
                <div key={s.name} className="flex items-center gap-3">
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{
                      background: i === 0 ? "#f59e0b20" : "#1a56db20",
                      color: i === 0 ? "#f59e0b" : "#1a56db",
                    }}
                  >
                    {i + 1}
                  </span>
                  <p className="flex-1 text-sm text-white truncate">{s.name}</p>
                  <span className="text-xs font-medium" style={{ color: s.avg >= 50 ? "#10b981" : "#ef4444" }}>
                    {s.avg.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Assessment performance */}
        <div className="card">
          <h2 className="text-base font-semibold text-white mb-4">Assessment Performance</h2>
          {assessmentStats.length === 0 ? (
            <p className="text-sm" style={{ color: "#6b7280" }}>No assessments yet</p>
          ) : (
            <div className="space-y-2">
              {assessmentStats.map((a) => {
                const avg = a.count > 0 ? a.totalPct / a.count : 0;
                const passR = a.count > 0 ? (a.passes / a.count) * 100 : 0;
                return (
                  <div key={a.title} className="p-3 rounded-lg" style={{ background: "#0f1117" }}>
                    <p className="text-xs font-medium text-white truncate mb-1">{a.title}</p>
                    <div className="flex items-center gap-3 text-xs" style={{ color: "#6b7280" }}>
                      <span>{a.count} students</span>
                      <span>Avg: <span style={{ color: "#a0a8c0" }}>{avg.toFixed(0)}%</span></span>
                      <span>Pass: <span style={{ color: passR >= 50 ? "#10b981" : "#ef4444" }}>{passR.toFixed(0)}%</span></span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <ResultsTable
        results={results}
        showExport={true}
        exportUrl="/api/results/export?format=csv"
      />
    </div>
  );
}
