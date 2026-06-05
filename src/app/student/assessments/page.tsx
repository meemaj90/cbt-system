import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AssessmentCard } from "@/components/assessments/assessment-card";

export default async function StudentAssessmentsPage() {
  const session = await auth();
  const classId = (session!.user as any).classId;
  const userId = session!.user!.id!;

  const assessments = await prisma.assessment.findMany({
    where: {
      status: { in: ["PUBLISHED", "ACTIVE"] },
      ...(classId ? { classId } : {}),
    },
    include: {
      subject: { select: { id: true, name: true, code: true } },
      class: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
      _count: { select: { questions: true, submissions: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Get student's submissions to show status
  const submissions = await prisma.submission.findMany({
    where: { studentId: userId },
    select: { assessmentId: true, status: true, totalScore: true, grade: true },
  });
  const submissionMap = Object.fromEntries(submissions.map((s) => [s.assessmentId, s]));

  return (
    <div className="page-container">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Available Assessments</h1>
        <p className="text-gray-500 text-sm mt-1">{assessments.length} assessments available</p>
      </div>

      {assessments.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-500">No assessments available for your class right now.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assessments.map((a) => {
            const sub = submissionMap[a.id];
            return (
              <div key={a.id} className="relative">
                <AssessmentCard
                  assessment={a as any}
                  href={`/student/assessments/${a.id}`}
                  role="student"
                />
                {sub && (
                  <div className="absolute top-3 right-3">
                    {sub.status === "GRADED" && sub.grade ? (
                      <span className="text-lg font-bold text-indigo-600 bg-indigo-50 w-8 h-8 rounded-full flex items-center justify-center">
                        {sub.grade}
                      </span>
                    ) : (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800">
                        {sub.status === "SUBMITTED" ? "Submitted" : "In Progress"}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
