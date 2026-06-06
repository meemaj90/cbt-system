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
    <div style={{ background: "#0f1117", minHeight: "100vh" }}>
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="mb-4">
          <Link
            href="/student/assessments"
            className="text-sm transition-colors"
            style={{ color: "#6b7280" }}
          >
            ← Back to assessments
          </Link>
        </div>

        <div className="card mb-6">
          <h1 className="text-xl font-bold text-white mb-2">{assessment.title}</h1>
          <div className="flex flex-wrap gap-3 text-sm mb-3" style={{ color: "#a0a8c0" }}>
            <span>{assessment.subject.name}</span>
            {assessment.class && <span>{assessment.class.name}</span>}
            <span>{assessment.totalMarks} marks</span>
            {assessment.duration && <span>{assessment.duration} min</span>}
            {assessment.endTime && <span>Due: {formatDateTime(assessment.endTime)}</span>}
          </div>
          {assessment.instructions && (
            <div
              className="mt-3 p-3 rounded-lg text-sm"
              style={{
                background: "rgba(26,86,219,0.08)",
                border: "1px solid rgba(26,86,219,0.2)",
                color: "#a0a8c0",
              }}
            >
              <p className="font-medium mb-1" style={{ color: "#3b82f6" }}>Instructions</p>
              <p>{assessment.instructions}</p>
            </div>
          )}
        </div>

        <TakeAssessment
          assessment={{
            ...assessment,
            questions: questionsWithParsedOptions,
          } as any}
          existingSubmission={submission as any}
        />
      </div>
    </div>
  );
}
