export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

function validateApiKey(req: NextRequest): boolean {
  const apiKey =
    req.headers.get("Authorization")?.replace("Bearer ", "") ??
    req.nextUrl.searchParams.get("apiKey");
  return apiKey === process.env.RESULTS_API_KEY;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  const hasApiKey = validateApiKey(req);
  if (!session?.user && !hasApiKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const format = searchParams.get("format") ?? "json";
  const classId = searchParams.get("classId");
  const subjectId = searchParams.get("subjectId");
  const assessmentId = searchParams.get("assessmentId");

  const where: any = { status: "GRADED" };
  if (assessmentId) where.assessmentId = assessmentId;
  if (classId) where.assessment = { ...where.assessment, classId };
  if (subjectId) where.assessment = { ...where.assessment, subjectId };

  const submissions = await prisma.submission.findMany({
    where,
    include: {
      student: {
        select: {
          name: true,
          studentId: true,
          class: { select: { name: true } },
        },
      },
      assessment: {
        select: {
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

  const rows = submissions.map((s) => ({
    studentId: s.student.studentId ?? "",
    studentName: s.student.name,
    class: s.student.class?.name ?? s.assessment.class?.name ?? "",
    subject: s.assessment.subject.name,
    subjectCode: s.assessment.subject.code,
    assessmentTitle: s.assessment.title,
    assessmentType: s.assessment.type,
    totalMarks: s.assessment.totalMarks,
    scoreObtained: s.totalScore ?? 0,
    percentage: s.percentage ? parseFloat(s.percentage.toFixed(2)) : 0,
    grade: s.grade ?? "F",
    status: s.status,
  }));

  if (format === "csv") {
    const headers = [
      "Student ID",
      "Student Name",
      "Class",
      "Subject",
      "Subject Code",
      "Assessment Title",
      "Assessment Type",
      "Total Marks",
      "Score Obtained",
      "Percentage",
      "Grade",
      "Status",
    ];
    const csvLines = [
      headers.join(","),
      ...rows.map((r) =>
        [
          r.studentId,
          `"${r.studentName}"`,
          r.class,
          `"${r.subject}"`,
          r.subjectCode,
          `"${r.assessmentTitle}"`,
          r.assessmentType,
          r.totalMarks,
          r.scoreObtained,
          r.percentage,
          r.grade,
          r.status,
        ].join(",")
      ),
    ];

    return new NextResponse(csvLines.join("\n"), {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="nextora-results-${Date.now()}.csv"`,
      },
    });
  }

  return NextResponse.json({
    exportedAt: new Date().toISOString(),
    count: rows.length,
    results: rows,
  });
}
