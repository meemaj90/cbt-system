import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { GradePanel } from "./grade-panel";

export default async function GradePage({ params }: { params: { id: string } }) {
  const assessment = await prisma.assessment.findUnique({
    where: { id: params.id },
    include: {
      subject: true,
      questions: { orderBy: { order: "asc" } },
      projectCriteria: true,
      oralCriteria: true,
    },
  });

  if (!assessment) notFound();

  const submissions = await prisma.submission.findMany({
    where: { assessmentId: params.id },
    include: {
      student: {
        select: { id: true, name: true, studentId: true, class: { select: { name: true } } },
      },
      answers: {
        include: { question: true },
        orderBy: { question: { order: "asc" } },
      },
      projectScores: { include: { criteria: true } },
      oralScores: { include: { criteria: true } },
    },
    orderBy: { submittedAt: "desc" },
  });

  return (
    <div className="page-container">
      <div className="flex items-center gap-2 mb-2">
        <Link href={`/teacher/assessments/${params.id}`} className="text-sm transition-colors" style={{ color: "#6b7280" }}>
          {assessment.title}
        </Link>
        <span style={{ color: "#2e3250" }}>/</span>
        <span className="text-sm" style={{ color: "#a0a8c0" }}>Grade Submissions</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Grade Submissions</h1>
        <div className="flex items-center gap-2 text-sm" style={{ color: "#6b7280" }}>
          <span className="font-medium text-white">{submissions.length}</span> submissions
        </div>
      </div>

      <GradePanel
        assessment={assessment as any}
        submissions={submissions as any}
      />
    </div>
  );
}
