import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/badge";
import { getGradeColor, formatDateTime } from "@/lib/utils";

export default async function StudentResultPage({ params }: { params: { id: string } }) {
  const session = await auth();
  const userId = session!.user!.id!;

  const submission = await prisma.submission.findUnique({
    where: { assessmentId_studentId: { assessmentId: params.id, studentId: userId } },
    include: {
      assessment: {
        include: {
          subject: true,
          questions: { orderBy: { order: "asc" } },
          projectCriteria: true,
          oralCriteria: true,
        },
      },
      answers: { include: { question: true }, orderBy: { question: { order: "asc" } } },
      projectScores: { include: { criteria: true } },
      oralScores: { include: { criteria: true } },
    },
  });

  if (!submission) notFound();

  const isGraded = submission.status === "GRADED";

  return (
    <div className="page-container max-w-2xl">
      <div className="mb-6">
        <Link href="/student/assessments" className="text-sm text-gray-500 hover:text-indigo-600">
          ← Back to assessments
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center mb-6">
        <h1 className="text-xl font-bold text-gray-900 mb-1">{submission.assessment.title}</h1>
        <p className="text-gray-500 text-sm mb-4">{submission.assessment.subject.name}</p>

        <StatusBadge status={submission.status} />

        {isGraded ? (
          <div className="mt-6">
            <div className={`text-6xl font-black ${getGradeColor(submission.grade ?? "F")} mb-2`}>
              {submission.grade}
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {submission.totalScore}/{submission.assessment.totalMarks}
            </div>
            <div className="text-gray-500">{submission.percentage?.toFixed(1)}%</div>

            {submission.percentage !== null && (
              <div className="mt-4 bg-gray-100 rounded-full h-3 max-w-xs mx-auto">
                <div
                  className={`h-3 rounded-full ${
                    (submission.percentage ?? 0) >= 70
                      ? "bg-green-500"
                      : (submission.percentage ?? 0) >= 50
                        ? "bg-yellow-500"
                        : "bg-red-500"
                  }`}
                  style={{ width: `${Math.min(submission.percentage ?? 0, 100)}%` }}
                />
              </div>
            )}

            <p className="mt-4 text-sm text-gray-600">
              {(submission.percentage ?? 0) >= submission.assessment.passMark
                ? "Congratulations! You passed this assessment."
                : "You did not meet the pass mark for this assessment."}
            </p>

            {submission.feedback && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-left">
                <p className="text-sm font-medium text-blue-800 mb-1">Teacher Feedback</p>
                <p className="text-sm text-blue-700">{submission.feedback}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-6">
            <p className="text-gray-600">
              Your submission is being reviewed. Results will be available once graded.
            </p>
            {submission.submittedAt && (
              <p className="text-sm text-gray-500 mt-2">
                Submitted on {formatDateTime(submission.submittedAt)}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Written: show answers with corrections */}
      {submission.assessment.type === "WRITTEN" && isGraded && submission.answers.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Answer Review</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {submission.answers.map((a) => {
              const opts = a.question.options ? JSON.parse(a.question.options) : null;
              return (
                <div key={a.id} className="px-6 py-4">
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    Q{a.question.order}. [{a.question.type}] — {a.marksAwarded ?? "?"}/{a.question.marks} marks
                  </p>
                  <p className="text-sm text-gray-900 mb-2">{a.question.text}</p>
                  <div className={`text-sm px-3 py-2 rounded-lg ${
                    a.isCorrect === true
                      ? "bg-green-50 text-green-800 border border-green-200"
                      : a.isCorrect === false
                        ? "bg-red-50 text-red-800 border border-red-200"
                        : "bg-gray-50 text-gray-800 border border-gray-200"
                  }`}>
                    Your answer: {a.answer ?? "(none)"}
                  </div>
                  {a.question.correctAnswer && a.question.type !== "ESSAY" && (
                    <p className="text-xs text-green-700 mt-1">Correct: {a.question.correctAnswer}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Project/Oral: show criteria scores */}
      {submission.assessment.type === "PROJECT" && isGraded && submission.projectScores.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Project Score Breakdown</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {submission.projectScores.map((s) => (
              <div key={s.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{s.criteria.name}</p>
                  {s.comment && <p className="text-xs text-gray-500">{s.comment}</p>}
                </div>
                <span className="font-medium text-indigo-700">
                  {s.score}/{s.criteria.maxMarks}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {submission.assessment.type === "ORAL" && isGraded && submission.oralScores.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Oral Score Breakdown</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {submission.oralScores.map((s) => (
              <div key={s.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{s.criteria.name}</p>
                  {s.comment && <p className="text-xs text-gray-500">{s.comment}</p>}
                </div>
                <span className="font-medium text-indigo-700">
                  {s.score}/{s.criteria.maxMarks}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
