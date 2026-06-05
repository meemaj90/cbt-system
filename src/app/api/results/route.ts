export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

function validateApiKey(req: NextRequest): boolean {
  const apiKey = req.headers.get("Authorization")?.replace("Bearer ", "") ?? req.nextUrl.searchParams.get("apiKey");
  return apiKey === process.env.RESULTS_API_KEY;
}

export async function GET(req: NextRequest) {
  // Allow authenticated users or valid API key
  const session = await auth();
  const hasApiKey = validateApiKey(req);
  if (!session?.user && !hasApiKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const classId = searchParams.get("classId");
  const subjectId = searchParams.get("subjectId");
  const assessmentId = searchParams.get("assessmentId");
  const studentId = searchParams.get("studentId");

  const where: any = {};
  if (assessmentId) where.assessmentId = assessmentId;
  if (studentId) where.studentId = studentId;
  if (classId) where.assessment = { ...where.assessment, classId };
  if (subjectId) where.assessment = { ...where.assessment, subjectId };

  const submissions = await prisma.submission.findMany({
    where,
    include: {
      student: {
        select: {
          id: true,
          name: true,
          studentId: true,
          class: { select: { name: true } },
        },
      },
      assessment: {
        select: {
          id: true,
          title: true,
          type: true,
          totalMarks: true,
          subject: { select: { name: true, code: true } },
          class: { select: { name: true } },
        },
      },
    },
    orderBy: [{ assessment: { title: "asc" } }, { student: { name: "asc" } }],
  });

  const results = submissions.map((s) => ({
    submissionId: s.id,
    studentId: s.student.studentId ?? s.student.id,
    studentName: s.student.name,
    class: s.student.class?.name ?? s.assessment.class?.name ?? null,
    subject: s.assessment.subject.name,
    subjectCode: s.assessment.subject.code,
    assessmentId: s.assessment.id,
    assessmentTitle: s.assessment.title,
    assessmentType: s.assessment.type,
    totalMarks: s.assessment.totalMarks,
    scoreObtained: s.totalScore,
    percentage: s.percentage ? parseFloat(s.percentage.toFixed(2)) : null,
    grade: s.grade,
    status: s.status,
    submittedAt: s.submittedAt,
    gradedAt: s.gradedAt,
  }));

  return NextResponse.json({ count: results.length, results });
}
