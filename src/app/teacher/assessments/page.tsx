import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { AssessmentCard } from "@/components/assessments/assessment-card";

export default async function TeacherAssessmentsPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const assessments = await prisma.assessment.findMany({
    where: { createdById: userId },
    include: {
      subject: { select: { id: true, name: true, code: true } },
      class: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
      _count: { select: { questions: true, submissions: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Assessments</h1>
          <p className="text-gray-500 text-sm mt-1">{assessments.length} assessments</p>
        </div>
        <Link href="/teacher/assessments/new" className="btn-primary">
          + New Assessment
        </Link>
      </div>

      {assessments.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-500 mb-4">You have not created any assessments yet.</p>
          <Link href="/teacher/assessments/new" className="btn-primary">
            Create Assessment
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assessments.map((a) => (
            <AssessmentCard
              key={a.id}
              assessment={a as any}
              href={`/teacher/assessments/${a.id}`}
              role="teacher"
            />
          ))}
        </div>
      )}
    </div>
  );
}
