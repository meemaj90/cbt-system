import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { TakeAssessment } from "./take-assessment";
import Link from "next/link";
import { formatDateTime } from "@/lib/utils";

export default async function StudentAssessmentPage({ params }: { params: { id: string } }) {
  const session = await auth();
  const userId = session!.user!.id!;

  const assessment = await prisma.assessment.findUnique({
    where: { id: params.id },
    include: {
      subject: true,
      class: true,
      questions: { orderBy: { order: "asc" } },
      projectCriteria: true,
      oralCriteria: true,
    },
  });

  if (!assessment) notFound();

  // Check existing submission
  const submission = await prisma.submission.findUnique({
    where: { assessmentId_studentId: { assessmentId: params.id, studentId: userId } },
    include: { answers: true, projectScores: true, oralScores: true },
  });

  if (submission && submission.status !== "IN_PROGRESS") {
    redirect(`/student/assessments/${params.id}/result`);
  }

  // For project and oral, just show info and allow submission creation
  if (assessment.type !== "WRITTEN") {
    // Create submission if not exists
    if (!submission) {
      await prisma.submission.create({
        data: {
          assessmentId: params.id,
          studentId: userId,
          status: "SUBMITTED",
          submittedAt: new Date(),
        },
      });
      redirect(`/student/assessments/${params.id}/result`);
    }
  }

  const questionsWithParsedOptions = assessment.questions.map((q) => ({
    ...q,
    options: q.options ? JSON.parse(q.options) : null,
  }));

  return (
    <div className="page-container max-w-3xl">
      <div className="mb-6">
        <Link href="/student/assessments" className="text-sm text-gray-500 hover:text-indigo-600">
          ← Back to assessments
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h1 className="text-xl font-bold text-gray-900 mb-2">{assessment.title}</h1>
        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          <span>{assessment.subject.name}</span>
          {assessment.class && <span>{assessment.class.name}</span>}
          <span>{assessment.totalMarks} marks</span>
          {assessment.duration && <span>{assessment.duration} min</span>}
          {assessment.endTime && <span>Due: {formatDateTime(assessment.endTime)}</span>}
        </div>
        {assessment.instructions && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-medium text-blue-800 mb-1">Instructions</p>
            <p className="text-sm text-blue-700">{assessment.instructions}</p>
          </div>
        )}
      </div>

      <TakeAssessment
        assessment={{ ...assessment, questions: questionsWithParsedOptions } as any}
        existingSubmission={submission as any}
      />
    </div>
  );
}
