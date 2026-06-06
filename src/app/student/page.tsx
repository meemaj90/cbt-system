import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/badge";
import { formatDate, getGradeColor } from "@/lib/utils";

export default async function StudentDashboard() {
  const session = await auth();
  const userId = session!.user!.id!;
  const classId = (session!.user as any).classId;

  const [availableCount, submittedCount, gradedCount] = await Promise.all([
    prisma.assessment.count({
      where: { status: { in: ["PUBLISHED", "ACTIVE"] }, ...(classId ? { classId } : {}) },
    }),
    prisma.submission.count({ where: { studentId: userId, status: "SUBMITTED" } }),
    prisma.submission.count({ where: { studentId: userId, status: "GRADED" } }),
  ]);

  const upcomingAssessments = await prisma.assessment.findMany({
    where: { status: { in: ["PUBLISHED", "ACTIVE"] }, ...(classId ? { classId } : {}) },
    take: 6,
    orderBy: { createdAt: "desc" },
    include: {
      subject: { select: { name: true, code: true } },
      class: { select: { name: true } },
    },
  });

  const mySubmissions = await prisma.submission.findMany({
    where: { studentId: userId, status: "GRADED" },
    take: 5,
    orderBy: { gradedAt: "desc" },
    include: {
      assessment: {
        select: {
          title: true,
          type: true,
          totalMarks: true,
          subject: { select: { name: true } },
        },
      },
    },
  });

  const stats = [
    { label: "Available", value: availableCount, color: "#1a56db" },
    { label: "Awaiting Results", value: submittedCount, color: "#ff6b00" },
    { label: "Graded", value: gradedCount, color: "#10b981" },
  ];

  return (
    <div className="page-container">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Student Dashboard</h1>
        <p className="text-sm mt-1" style={{ color: "#6b7280" }}>Welcome, {session!.user!.name}</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="stat-card">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${s.color}20` }}
            >
              <div className="w-4 h-4 rounded-full" style={{ background: s.color }} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="text-xs" style={{ color: "#6b7280" }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">Available Assessments</h2>
            <Link href="/student/assessments" className="text-sm" style={{ color: "#3b82f6" }}>
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {upcomingAssessments.length === 0 ? (
              <div className="card p-8 text-center text-sm" style={{ color: "#6b7280" }}>
                No assessments available right now.
              </div>
            ) : (
              upcomingAssessments.map((a) => (
                <Link key={a.id} href={`/student/assessments/${a.id}`} className="block group">
                  <div
                    className="rounded-xl border p-4 transition-all flex items-center justify-between"
                    style={{ background: "#1e2235", borderColor: "#2e3250" }}
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="text-xs font-medium px-1.5 py-0.5 rounded"
                          style={{ background: "rgba(26,86,219,0.15)", color: "#3b82f6" }}
                        >
                          {a.subject.code}
                        </span>
                        <StatusBadge status={a.status} />
                      </div>
                      <p className="font-medium text-white group-hover:text-blue-400 transition-colors">
                        {a.title}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "#6b7280" }}>
                        {a.type}{a.class ? ` · ${a.class.name}` : ""}
                        {a.endTime ? ` · Due ${formatDate(a.endTime)}` : ""}
                      </p>
                    </div>
                    <svg className="w-5 h-5 transition-colors" style={{ color: "#6b7280" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">Recent Results</h2>
            <Link href="/student/results" className="text-sm" style={{ color: "#3b82f6" }}>
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {mySubmissions.length === 0 ? (
              <div className="card p-6 text-center text-sm" style={{ color: "#6b7280" }}>
                No results yet.
              </div>
            ) : (
              mySubmissions.map((s) => (
                <div key={s.id} className="card">
                  <p className="text-sm font-medium text-white line-clamp-1">{s.assessment.title}</p>
                  <p className="text-xs" style={{ color: "#6b7280" }}>{s.assessment.subject.name}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm" style={{ color: "#a0a8c0" }}>
                      {s.totalScore}/{s.assessment.totalMarks}
                    </span>
                    {s.grade && (
                      <span className={`text-lg font-bold ${getGradeColor(s.grade)}`}>{s.grade}</span>
                    )}
                  </div>
                  {s.percentage !== null && (
                    <div className="mt-2 rounded-full h-1.5" style={{ background: "#2e3250" }}>
                      <div
                        className="h-1.5 rounded-full"
                        style={{
                          width: `${Math.min(s.percentage, 100)}%`,
                          background: s.percentage >= 50 ? "#10b981" : "#ef4444",
                        }}
                      />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
