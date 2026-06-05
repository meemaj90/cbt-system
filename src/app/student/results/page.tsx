import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ResultsTable } from "@/components/results/results-table";

export default async function StudentResultsPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const submissions = await prisma.submission.findMany({
    where: {
      studentId: userId,
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

  const graded = results.filter((r) => r.status === "GRADED");
  const avgPercentage =
    graded.length > 0
      ? graded.reduce((sum, r) => sum + (r.percentage ?? 0), 0) / graded.length
      : null;

  return (
    <div className="page-container">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Results</h1>
        <p className="text-gray-500 text-sm mt-1">{results.length} assessments taken</p>
      </div>

      {avgPercentage !== null && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 flex items-center gap-6">
          <div>
            <p className="text-sm text-gray-500">Average Score</p>
            <p className="text-3xl font-bold text-indigo-600">{avgPercentage.toFixed(1)}%</p>
          </div>
          <div className="flex-1 bg-gray-100 rounded-full h-3">
            <div
              className="bg-indigo-500 h-3 rounded-full transition-all"
              style={{ width: `${Math.min(avgPercentage, 100)}%` }}
            />
          </div>
        </div>
      )}

      <ResultsTable results={results} />
    </div>
  );
}
