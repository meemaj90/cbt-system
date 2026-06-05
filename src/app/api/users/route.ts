import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["ADMIN", "TEACHER", "STUDENT"]),
  studentId: z.string().optional().nullable(),
  classId: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const filterRole = searchParams.get("role");

  const users = await prisma.user.findMany({
    where: filterRole ? { role: filterRole } : undefined,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      studentId: true,
      classId: true,
      class: { select: { id: true, name: true } },
      createdAt: true,
    },
  });

  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors }, { status: 400 });
  }

  const { password, ...data } = parsed.data;
  const hashed = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      ...data,
      password: hashed,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      studentId: true,
      classId: true,
      createdAt: true,
    },
  });

  return NextResponse.json(user, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("id");
  if (!userId) return NextResponse.json({ error: "User ID required" }, { status: 400 });

  await prisma.user.delete({ where: { id: userId } });
  return NextResponse.json({ success: true });
}
