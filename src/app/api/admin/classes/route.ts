import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const classes = await prisma.class.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { students: true } } },
  });

  return NextResponse.json(classes);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as any).role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name, description } = await req.json();
  const cls = await prisma.class.create({ data: { name, description } });
  return NextResponse.json(cls, { status: 201 });
}
