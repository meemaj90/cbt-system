export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { gradeCalculator } from "@/lib/utils";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (!["ADMIN", "TEACHER"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { answerGrades, projectScores, oralScores, feedback } = body;
  // answerGrades: Array<{ answerId: string; marksAwarded: number }>
  // projectScores: Array<{ criteriaId: string; score: number; comment?: string }>
  // oralScores: Array<{ criteriaId: string; score: number; comment?: string }>

  const submission = await prisma.submission.findUnique({
    where: { id: params.id },
    include: {
      assessment: true,
      answers: true,
    },
  });
  if (!submission) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Grade essay/manual answers
  if (answerGrades && answerGrades.length > 0) {
    for (const ag of answerGrades) {
      await prisma.answer.update({
        where: { id: ag.answerId },
        data: { marksAwarded: ag.marksAwarded },
      });
    }
  }

  // Handle project scores
  if (projectScores && projectScores.length > 0) {
    // Delete existing project scores for this submission
    await prisma.projectScore.deleteMany({ where: { submissionId: params.id } });
    await prisma.projectScore.createMany({
      data: projectScores.map((s: any) => ({
        submissionId: params.id,
        criteriaId: s.criteriaId,
        score: s.score,
        comment: s.comment,
        gradedById: session.user!.id!,
      })),
    });
  }

  // Handle oral scores
  if (oralScores && oralScores.length > 0) {
    await prisma.oralScore.deleteMany({ where: { submissionId: params.id } });
    await prisma.oralScore.createMany({
      data: oralScores.map((s: any) => ({
        submissionId: params.id,
        criteriaId: s.criteriaId,
        score: s.score,
        comment: s.comment,
        gradedById: session.user!.id!,
      })),
    });
  }

  // Recalculate total score
  const updatedAnswers = await prisma.answer.findMany({
    where: { submissionId: params.id },
    select: { marksAwarded: true },
  });
  const updatedProjectScores = await prisma.projectScore.findMany({
    where: { submissionId: params.id },
    select: { score: true },
  });
  const updatedOralScores = await prisma.oralScore.findMany({
    where: { submissionId: params.id },
    select: { score: true },
  });

  const answerTotal = updatedAnswers.reduce((sum, a) => sum + (a.marksAwarded ?? 0), 0);
  const projectTotal = updatedProjectScores.reduce((sum, s) => sum + s.score, 0);
  const oralTotal = updatedOralScores.reduce((sum, s) => sum + s.score, 0);
  const totalScore = answerTotal + projectTotal + oralTotal;

  const percentage = (totalScore / submission.assessment.totalMarks) * 100;
  const grade = gradeCalculator(percentage);

  const updated = await prisma.submission.update({
    where: { id: params.id },
    data: {
      status: "GRADED",
      totalScore,
      percentage,
      grade,
      feedback: feedback ?? submission.feedback,
      gradedAt: new Date(),
      gradedById: session.user.id,
    },
  });

  return NextResponse.json(updated);
}
