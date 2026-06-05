import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ResultsTable } from "@/components/results/results-table";

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

  return (
    <div className="page-container">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Results</h1>
        <p className="text-gray-500 text-sm mt-1">{results.length} submissions across all assessments</p>
      </div>

      <ResultsTable
        results={results}
        showExport={true}
        exportUrl="/api/results/export?format=csv"
      />
    </div>
  );
}
