export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(["WRITTEN", "PROJECT", "ORAL"]),
  subjectId: z.string(),
  classId: z.string().optional().nullable(),
  startTime: z.string().optional().nullable(),
  endTime: z.string().optional().nullable(),
  duration: z.number().optional().nullable(),
  totalMarks: z.number().default(100),
  passMark: z.number().default(50),
  instructions: z.string().optional(),
  questions: z.array(z.any()).optional(),
  projectCriteria: z.array(z.any()).optional(),
  oralCriteria: z.array(z.any()).optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const classId = searchParams.get("classId");
  const subjectId = searchParams.get("subjectId");
  const type = searchParams.get("type");
  const status = searchParams.get("status");
  const role = (session.user as any).role;

  const where: any = {};
  if (classId) where.classId = classId;
  if (subjectId) where.subjectId = subjectId;
  if (type) where.type = type;
  if (status) where.status = status;

  // Teachers see only their own assessments
  if (role === "TEACHER") where.createdById = session.user.id;

  // Students see assessments for their class that are published/active
  if (role === "STUDENT") {
    const userClassId = (session.user as any).classId;
    where.status = { in: ["PUBLISHED", "ACTIVE"] };
    if (userClassId) where.classId = userClassId;
  }

  const assessments = await prisma.assessment.findMany({
    where,
    include: {
      subject: { select: { id: true, name: true, code: true } },
      class: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
      _count: { select: { questions: true, submissions: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(assessments);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (!["ADMIN", "TEACHER"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors }, { status: 400 });
  }

  const { questions, projectCriteria, oralCriteria, ...data } = parsed.data;

  const assessment = await prisma.assessment.create({
    data: {
      ...data,
      startTime: data.startTime ? new Date(data.startTime) : null,
      endTime: data.endTime ? new Date(data.endTime) : null,
      createdById: session.user.id!,
      questions:
        questions && questions.length > 0
          ? {
              create: questions.map((q: any) => ({
                order: q.order,
                type: q.type,
                text: q.text,
                marks: q.marks,
                options: q.options ? JSON.stringify(q.options) : null,
                correctAnswer: q.correctAnswer || null,
              })),
            }
          : undefined,
      projectCriteria:
        projectCriteria && projectCriteria.length > 0
          ? { create: projectCriteria }
          : undefined,
      oralCriteria:
        oralCriteria && oralCriteria.length > 0 ? { create: oralCriteria } : undefined,
    },
    include: {
      subject: true,
      class: true,
      questions: true,
      projectCriteria: true,
      oralCriteria: true,
    },
  });

  return NextResponse.json(assessment, { status: 201 });
}
