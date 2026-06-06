export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { gradeCalculator } from "@/lib/utils";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (role !== "STUDENT") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { answers } = body;
  // answers: Array<{ questionId: string; answer: string }>

  const assessment = await prisma.assessment.findUnique({
    where: { id: params.id },
    include: { questions: true },
  });
  if (!assessment) return NextResponse.json({ error: "Assessment not found" }, { status: 404 });

  // Check if already submitted
  const existing = await prisma.submission.findUnique({
    where: { assessmentId_studentId: { assessmentId: params.id, studentId: session.user.id! } },
  });
  if (existing && existing.status !== "IN_PROGRESS") {
    return NextResponse.json({ error: "Already submitted" }, { status: 400 });
  }

  // Grade MCQ and SHORT_ANSWER automatically
  let autoScore = 0;
  const answerData = (answers as any[]).map((a: any) => {
    const question = assessment.questions.find((q) => q.id === a.questionId);
    let isCorrect: boolean | null = null;
    let marksAwarded: number | null = null;

    if (question) {
      if (question.type === "MCQ" && question.correctAnswer) {
        isCorrect = a.answer === question.correctAnswer;
        marksAwarded = isCorrect ? question.marks : 0;
        autoScore += marksAwarded;
      } else if (
        (question.type === "SHORT_ANSWER" || question.type === "FILL_BLANK" || question.type === "TRUE_FALSE") &&
        question.correctAnswer
      ) {
        isCorrect =
          a.answer?.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();
        marksAwarded = isCorrect ? question.marks : 0;
        autoScore += marksAwarded;
      }
    }

    return {
      questionId: a.questionId,
      answer: a.answer,
      isCorrect,
      marksAwarded,
    };
  });

  // Check if all questions are auto-gradeable
  const hasManualQuestions = assessment.questions.some(
    (q) => q.type === "ESSAY" || q.type === "FILE_UPLOAD" || (q.type === "SHORT_ANSWER" && !q.correctAnswer)
  );

  const submissionStatus = hasManualQuestions ? "SUBMITTED" : "GRADED";
  let totalScore: number | null = null;
  let percentage: number | null = null;
  let grade: string | null = null;

  if (!hasManualQuestions) {
    totalScore = autoScore;
    percentage = (autoScore / assessment.totalMarks) * 100;
    grade = gradeCalculator(percentage);
  }

  let submission;
  if (existing) {
    // Delete existing answers and update submission
    await prisma.answer.deleteMany({ where: { submissionId: existing.id } });
    submission = await prisma.submission.update({
      where: { id: existing.id },
      data: {
        status: submissionStatus,
        submittedAt: new Date(),
        totalScore,
        percentage,
        grade,
        gradedAt: !hasManualQuestions ? new Date() : null,
        answers: { create: answerData },
      },
    });
  } else {
    submission = await prisma.submission.create({
      data: {
        assessmentId: params.id,
        studentId: session.user.id!,
        status: submissionStatus,
        submittedAt: new Date(),
        totalScore,
        percentage,
        grade,
        gradedAt: !hasManualQuestions ? new Date() : null,
        answers: { create: answerData },
      },
    });
  }

  return NextResponse.json(submission);
}
