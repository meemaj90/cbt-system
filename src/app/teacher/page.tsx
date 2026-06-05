import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/badge";

export default async function TeacherDashboard() {
  const session = await auth();
  const userId = session!.user!.id!;

  const [assessmentCount, submissionCount, gradedCount, recentAssessments] = await Promise.all([
    prisma.assessment.count({ where: { createdById: userId } }),
    prisma.submission.count({
      where: { assessment: { createdById: userId } },
    }),
    prisma.submission.count({
      where: { assessment: { createdById: userId }, status: "GRADED" },
    }),
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

  return (
    <div className="page-container">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back, {session!.user!.name}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-2xl font-bold text-indigo-600">{assessmentCount}</div>
          <div className="text-sm text-gray-500 mt-0.5">My Assessments</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-2xl font-bold text-blue-600">{submissionCount}</div>
          <div className="text-sm text-gray-500 mt-0.5">Total Submissions</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-2xl font-bold text-orange-600">{pendingGrading}</div>
          <div className="text-sm text-gray-500 mt-0.5">Pending Grading</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-2xl font-bold text-green-600">{gradedCount}</div>
          <div className="text-sm text-gray-500 mt-0.5">Graded</div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-900">Recent Assessments</h2>
        <Link
          href="/teacher/assessments/new"
          className="btn-primary text-sm"
        >
          + New Assessment
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recentAssessments.map((a) => (
          <Link key={a.id} href={`/teacher/assessments/${a.id}`} className="block group">
            <div className="bg-white rounded-xl border border-gray-200 p-5 hover:border-indigo-300 hover:shadow-sm transition-all">
              <div className="flex items-start justify-between mb-2">
                <span className="text-xs font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                  {a.subject.code}
                </span>
                <StatusBadge status={a.status} />
              </div>
              <h3 className="font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors mt-2">
                {a.title}
              </h3>
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                <span>{a.type}</span>
                {a.class && <span>{a.class.name}</span>}
                <span>{a._count.submissions} submissions</span>
              </div>
            </div>
          </Link>
        ))}

        {recentAssessments.length === 0 && (
          <div className="col-span-3 text-center py-12 bg-white rounded-xl border border-gray-200">
            <p className="text-gray-500 mb-4">No assessments yet.</p>
            <Link href="/teacher/assessments/new" className="btn-primary">
              Create your first assessment
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
