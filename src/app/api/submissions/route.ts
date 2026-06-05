import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const assessmentId = searchParams.get("assessmentId");
  const studentId = searchParams.get("studentId");
  const role = (session.user as any).role;

  const where: any = {};
  if (assessmentId) where.assessmentId = assessmentId;
  if (studentId) where.studentId = studentId;
  if (role === "STUDENT") where.studentId = session.user.id;

  const submissions = await prisma.submission.findMany({
    where,
    include: {
      student: { select: { id: true, name: true, studentId: true } },
      assessment: {
        select: {
          id: true,
          title: true,
          type: true,
          totalMarks: true,
          subject: { select: { name: true } },
          class: { select: { name: true } },
        },
      },
    },
    orderBy: { submittedAt: "desc" },
  });

  return NextResponse.json(submissions);
}
