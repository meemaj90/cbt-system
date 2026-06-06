import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/badge";

export default async function TeacherDashboard() {
  const session = await auth();
  const userId = session!.user!.id!;

  const [assessmentCount, submissionCount, gradedCount, recentAssessments] = await Promise.all([
    prisma.assessment.count({ where: { createdById: userId } }),
    prisma.submission.count({ where: { assessment: { createdById: userId } } }),
    prisma.submission.count({ where: { assessment: { createdById: userId }, status: "GRADED" } }),
    prisma.assessment.findMany({
      where: { createdById: userId },
      take: 6,
      orderBy: { createdAt: "desc" },
      include: {
        subject: { select: { name: true, code: true } },
        class: { select: { name: true } },
        _count: { select: { submissions: true } },
      },
    }),
  ]);

  const pendingGrading = await prisma.submission.count({
    where: { assessment: { createdById: userId }, status: "SUBMITTED" },
  });

  const stats = [
    { label: "My Assessments", value: assessmentCount, color: "#1a56db" },
    { label: "Total Submissions", value: submissionCount, color: "#3b82f6" },
    { label: "Pending Grading", value: pendingGrading, color: "#ff6b00" },
    { label: "Graded", value: gradedCount, color: "#10b981" },
  ];

  return (
    <div className="page-container">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Teacher Dashboard</h1>
        <p className="text-sm mt-1" style={{ color: "#6b7280" }}>Welcome back, {session!.user!.name}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
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

      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-white">Recent Assessments</h2>
        <Link href="/teacher/assessments/new" className="btn-primary text-sm">
          + New Assessment
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recentAssessments.map((a) => (
          <Link key={a.id} href={`/teacher/assessments/${a.id}`} className="block group">
            <div
              className="rounded-xl border p-5 transition-all"
              style={{ background: "#1e2235", borderColor: "#2e3250" }}
            >
              <div className="flex items-start justify-between mb-2">
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded"
                  style={{ background: "rgba(26,86,219,0.15)", color: "#3b82f6" }}
                >
                  {a.subject.code}
                </span>
                <StatusBadge status={a.status} />
              </div>
              <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors mt-2">
                {a.title}
              </h3>
              <div className="flex items-center gap-4 mt-3 pt-3 border-t text-xs" style={{ borderColor: "#2e3250", color: "#6b7280" }}>
                <span>{a.type}</span>
                {a.class && <span>{a.class.name}</span>}
                <span>{a._count.submissions} submissions</span>
              </div>
            </div>
          </Link>
        ))}

        {recentAssessments.length === 0 && (
          <div className="col-span-3 text-center py-12 card">
            <p className="mb-4" style={{ color: "#6b7280" }}>No assessments yet.</p>
            <Link href="/teacher/assessments/new" className="btn-primary">
              Create your first assessment
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
