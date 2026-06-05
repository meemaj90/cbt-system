import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/badge";
import { formatDateTime, formatDate } from "@/lib/utils";
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
            <Link href="/teacher/assessments" className="text-sm text-gray-500 hover:text-indigo-600">
              Assessments
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-sm text-gray-700">{assessment.title}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{assessment.title}</h1>
          <div className="flex items-center gap-3 mt-2">
            <StatusBadge status={assessment.status} />
            <span className="text-sm text-gray-500">{assessment.type}</span>
            <span className="text-sm text-gray-500">{assessment.subject.name}</span>
            {assessment.class && <span className="text-sm text-gray-500">{assessment.class.name}</span>}
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
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">{assessment.totalMarks}</div>
          <div className="text-xs text-gray-500 mt-0.5">Total Marks</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">{assessment._count.submissions}</div>
          <div className="text-xs text-gray-500 mt-0.5">Submissions</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">{assessment.passMark}</div>
          <div className="text-xs text-gray-500 mt-0.5">Pass Mark</div>
        </div>
      </div>

      {assessment.instructions && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <p className="text-sm font-medium text-blue-800 mb-1">Instructions</p>
          <p className="text-sm text-blue-700">{assessment.instructions}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-6 text-sm text-gray-600">
        {assessment.startTime && (
          <div><span className="font-medium">Start:</span> {formatDateTime(assessment.startTime)}</div>
        )}
        {assessment.endTime && (
          <div><span className="font-medium">End:</span> {formatDateTime(assessment.endTime)}</div>
        )}
        {assessment.duration && (
          <div><span className="font-medium">Duration:</span> {assessment.duration} minutes</div>
        )}
      </div>

      {/* Questions / Criteria */}
      {assessment.type === "WRITTEN" && assessment.questions.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Questions ({assessment.questions.length})</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {assessment.questions.map((q, i) => {
              const options = q.options ? JSON.parse(q.options) : null;
              return (
                <div key={q.id} className="px-6 py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700 mb-1">
                        Q{i + 1}. [{q.type}] — {q.marks} mark{q.marks > 1 ? "s" : ""}
                      </p>
                      <p className="text-sm text-gray-900">{q.text}</p>
                      {options && (
                        <div className="mt-2 space-y-1">
                          {options.map((opt: string, oi: number) => (
                            <div key={oi} className={`text-sm px-2 py-0.5 rounded ${opt === q.correctAnswer ? "bg-green-100 text-green-800 font-medium" : "text-gray-600"}`}>
                              {String.fromCharCode(65 + oi)}. {opt}
                            </div>
                          ))}
                        </div>
                      )}
                      {q.correctAnswer && q.type !== "MCQ" && (
                        <p className="text-xs text-green-700 mt-1">Expected: {q.correctAnswer}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {assessment.type === "PROJECT" && assessment.projectCriteria.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Rubric Criteria</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {assessment.projectCriteria.map((c) => (
              <div key={c.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{c.name}</p>
                  {c.description && <p className="text-sm text-gray-500">{c.description}</p>}
                </div>
                <span className="text-sm font-medium text-indigo-700">{c.maxMarks} marks</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {assessment.type === "ORAL" && assessment.oralCriteria.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Oral Criteria</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {assessment.oralCriteria.map((c) => (
              <div key={c.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{c.name}</p>
                  {c.description && <p className="text-sm text-gray-500">{c.description}</p>}
                </div>
                <span className="text-sm font-medium text-indigo-700">{c.maxMarks} marks</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Submissions */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Recent Submissions</h2>
          <Link href={`/teacher/assessments/${assessment.id}/grade`} className="text-sm text-indigo-600 hover:text-indigo-800">
            View all
          </Link>
        </div>
        <div className="divide-y divide-gray-100">
          {submissions.length === 0 ? (
            <p className="px-6 py-8 text-center text-gray-500 text-sm">No submissions yet.</p>
          ) : (
            submissions.map((s) => (
              <div key={s.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{s.student.name}</p>
                  <p className="text-xs text-gray-500">
                    {s.student.studentId} · {s.student.class?.name}
                  </p>
                </div>
                <div className="text-right">
                  <StatusBadge status={s.status} />
                  {s.totalScore !== null && (
                    <p className="text-sm font-medium text-gray-900 mt-1">
                      {s.totalScore}/{assessment.totalMarks}
                      {s.grade && <span className="ml-2 text-indigo-600">{s.grade}</span>}
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
