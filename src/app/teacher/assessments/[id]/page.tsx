import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import { PublishButton } from "./publish-button";

export default async function AssessmentDetailPage({ params }: { params: { id: string } }) {
  const assessment = await prisma.assessment.findUnique({
    where: { id: params.id },
    include: {
      subject: true,
      class: true,
      createdBy: { select: { name: true } },
      questions: { orderBy: { order: "asc" } },
      projectCriteria: true,
      oralCriteria: true,
      _count: { select: { submissions: true } },
    },
  });

  if (!assessment) notFound();

  const submissions = await prisma.submission.findMany({
    where: { assessmentId: params.id },
    include: {
      student: { select: { name: true, studentId: true, class: { select: { name: true } } } },
    },
    orderBy: { submittedAt: "desc" },
    take: 10,
  });

  return (
    <div className="page-container max-w-4xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/teacher/assessments" className="text-sm transition-colors" style={{ color: "#6b7280" }}>
              Assessments
            </Link>
            <span style={{ color: "#2e3250" }}>/</span>
            <span className="text-sm" style={{ color: "#a0a8c0" }}>{assessment.title}</span>
          </div>
          <h1 className="text-2xl font-bold text-white">{assessment.title}</h1>
          <div className="flex items-center gap-3 mt-2">
            <StatusBadge status={assessment.status} />
            <span className="text-sm" style={{ color: "#6b7280" }}>{assessment.type}</span>
            <span className="text-sm" style={{ color: "#6b7280" }}>{assessment.subject.name}</span>
            {assessment.class && <span className="text-sm" style={{ color: "#6b7280" }}>{assessment.class.name}</span>}
          </div>
        </div>
        <div className="flex gap-2">
          <PublishButton assessmentId={assessment.id} currentStatus={assessment.status} />
          <Link href={`/teacher/assessments/${assessment.id}/grade`} className="btn-secondary text-sm">
            Grade Submissions
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Marks", value: assessment.totalMarks },
          { label: "Submissions", value: assessment._count.submissions },
          { label: "Pass Mark", value: assessment.passMark },
        ].map((s) => (
          <div key={s.label} className="card text-center py-5">
            <div className="text-2xl font-bold text-white">{s.value}</div>
            <div className="text-xs mt-0.5" style={{ color: "#6b7280" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {assessment.instructions && (
        <div
          className="rounded-xl p-4 mb-6"
          style={{ background: "rgba(26,86,219,0.08)", border: "1px solid rgba(26,86,219,0.2)" }}
        >
          <p className="text-sm font-medium mb-1" style={{ color: "#3b82f6" }}>Instructions</p>
          <p className="text-sm" style={{ color: "#a0a8c0" }}>{assessment.instructions}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-6 text-sm" style={{ color: "#a0a8c0" }}>
        {assessment.startTime && (
          <div><span className="font-medium text-white">Start:</span> {formatDateTime(assessment.startTime)}</div>
        )}
        {assessment.endTime && (
          <div><span className="font-medium text-white">End:</span> {formatDateTime(assessment.endTime)}</div>
        )}
        {assessment.duration && (
          <div><span className="font-medium text-white">Duration:</span> {assessment.duration} minutes</div>
        )}
      </div>

      {/* Questions */}
      {assessment.type === "WRITTEN" && assessment.questions.length > 0 && (
        <div className="card mb-6 p-0 overflow-hidden">
          <div className="px-6 py-4 border-b" style={{ borderColor: "#2e3250" }}>
            <h2 className="font-semibold text-white">Questions ({assessment.questions.length})</h2>
          </div>
          <div>
            {assessment.questions.map((q, i) => {
              const options = q.options ? JSON.parse(q.options) : null;
              return (
                <div key={q.id} className="px-6 py-4 border-b last:border-0" style={{ borderColor: "#2e3250" }}>
                  <p className="text-xs font-medium mb-1" style={{ color: "#6b7280" }}>
                    Q{i + 1}. [{q.type}] — {q.marks} mark{q.marks > 1 ? "s" : ""}
                  </p>
                  <p className="text-sm text-white">{q.text}</p>
                  {q.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={q.imageUrl} alt="Q image" className="mt-2 max-h-32 rounded" />
                  )}
                  {options && (
                    <div className="mt-2 space-y-1">
                      {options.map((opt: string, oi: number) => (
                        <div
                          key={oi}
                          className="text-sm px-2 py-0.5 rounded"
                          style={
                            opt === q.correctAnswer
                              ? { background: "rgba(16,185,129,0.15)", color: "#10b981" }
                              : { color: "#a0a8c0" }
                          }
                        >
                          {String.fromCharCode(65 + oi)}. {opt}
                        </div>
                      ))}
                    </div>
                  )}
                  {q.correctAnswer && q.type !== "MCQ" && (
                    <p className="text-xs mt-1" style={{ color: "#10b981" }}>
                      Expected: {q.correctAnswer}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {assessment.type === "PROJECT" && assessment.projectCriteria.length > 0 && (
        <div className="card mb-6 p-0 overflow-hidden">
          <div className="px-6 py-4 border-b" style={{ borderColor: "#2e3250" }}>
            <h2 className="font-semibold text-white">Rubric Criteria</h2>
          </div>
          <div>
            {assessment.projectCriteria.map((c) => (
              <div key={c.id} className="px-6 py-4 border-b last:border-0 flex items-center justify-between" style={{ borderColor: "#2e3250" }}>
                <div>
                  <p className="font-medium text-white">{c.name}</p>
                  {c.description && <p className="text-sm" style={{ color: "#6b7280" }}>{c.description}</p>}
                </div>
                <span className="text-sm font-medium" style={{ color: "#3b82f6" }}>{c.maxMarks} marks</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {assessment.type === "ORAL" && assessment.oralCriteria.length > 0 && (
        <div className="card mb-6 p-0 overflow-hidden">
          <div className="px-6 py-4 border-b" style={{ borderColor: "#2e3250" }}>
            <h2 className="font-semibold text-white">Oral Criteria</h2>
          </div>
          <div>
            {assessment.oralCriteria.map((c) => (
              <div key={c.id} className="px-6 py-4 border-b last:border-0 flex items-center justify-between" style={{ borderColor: "#2e3250" }}>
                <div>
                  <p className="font-medium text-white">{c.name}</p>
                  {c.description && <p className="text-sm" style={{ color: "#6b7280" }}>{c.description}</p>}
                </div>
                <span className="text-sm font-medium" style={{ color: "#3b82f6" }}>{c.maxMarks} marks</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Submissions */}
      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "#2e3250" }}>
          <h2 className="font-semibold text-white">Recent Submissions</h2>
          <Link
            href={`/teacher/assessments/${assessment.id}/grade`}
            className="text-sm"
            style={{ color: "#3b82f6" }}
          >
            View all
          </Link>
        </div>
        <div>
          {submissions.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm" style={{ color: "#6b7280" }}>No submissions yet.</p>
          ) : (
            submissions.map((s) => (
              <div key={s.id} className="px-6 py-4 border-b last:border-0 flex items-center justify-between" style={{ borderColor: "#2e3250" }}>
                <div>
                  <p className="font-medium text-white">{s.student.name}</p>
                  <p className="text-xs" style={{ color: "#6b7280" }}>
                    {s.student.studentId} · {s.student.class?.name}
                  </p>
                </div>
                <div className="text-right">
                  <StatusBadge status={s.status} />
                  {s.totalScore !== null && (
                    <p className="text-sm font-medium text-white mt-1">
                      {s.totalScore}/{assessment.totalMarks}
                      {s.grade && <span className="ml-2" style={{ color: "#3b82f6" }}>{s.grade}</span>}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
