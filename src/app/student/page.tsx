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
      where: {
        status: { in: ["PUBLISHED", "ACTIVE"] },
        ...(classId ? { classId } : {}),
      },
    }),
    prisma.submission.count({ where: { studentId: userId, status: "SUBMITTED" } }),
    prisma.submission.count({ where: { studentId: userId, status: "GRADED" } }),
  ]);

  const upcomingAssessments = await prisma.assessment.findMany({
    where: {
      status: { in: ["PUBLISHED", "ACTIVE"] },
      ...(classId ? { classId } : {}),
    },
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

  return (
    <div className="page-container">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Student Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome, {session!.user!.name}</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{availableCount}</div>
          <div className="text-sm text-gray-500 mt-0.5">Available Assessments</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">{submittedCount}</div>
          <div className="text-sm text-gray-500 mt-0.5">Awaiting Results</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{gradedCount}</div>
          <div className="text-sm text-gray-500 mt-0.5">Graded</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Available Assessments</h2>
            <Link href="/student/assessments" className="text-sm text-indigo-600 hover:text-indigo-800">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {upcomingAssessments.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500 text-sm">
                No assessments available right now.
              </div>
            ) : (
              upcomingAssessments.map((a) => (
                <Link key={a.id} href={`/student/assessments/${a.id}`} className="block group">
                  <div className="bg-white rounded-xl border border-gray-200 p-4 hover:border-indigo-300 transition-all flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                          {a.subject.code}
                        </span>
                        <StatusBadge status={a.status} />
                      </div>
                      <p className="font-medium text-gray-900 group-hover:text-indigo-700 transition-colors">
                        {a.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {a.type}{a.class ? ` · ${a.class.name}` : ""}
                        {a.endTime ? ` · Due ${formatDate(a.endTime)}` : ""}
                      </p>
                    </div>
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <h2 className="font-semibold text-gray-900">Recent Results</h2>
            <Link href="/student/results" className="text-sm text-indigo-600 hover:text-indigo-800">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {mySubmissions.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-500 text-sm">
                No results yet.
              </div>
            ) : (
              mySubmissions.map((s) => (
                <div key={s.id} className="bg-white rounded-xl border border-gray-200 p-4">
                  <p className="text-sm font-medium text-gray-900 line-clamp-1">{s.assessment.title}</p>
                  <p className="text-xs text-gray-500">{s.assessment.subject.name}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-gray-600">
                      {s.totalScore}/{s.assessment.totalMarks}
                    </span>
                    {s.grade && (
                      <span className={`text-lg font-bold ${getGradeColor(s.grade)}`}>{s.grade}</span>
                    )}
                  </div>
                  {s.percentage !== null && (
                    <div className="mt-1 bg-gray-100 rounded-full h-1.5">
                      <div
                        className="bg-indigo-500 h-1.5 rounded-full"
                        style={{ width: `${Math.min(s.percentage, 100)}%` }}
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
