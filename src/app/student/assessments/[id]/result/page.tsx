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
  const pct = submission.percentage ?? 0;
  const passed = pct >= (submission.assessment.passMark ?? 50);

  return (
    <div className="page-container max-w-2xl">
      <div className="mb-6">
        <Link href="/student/assessments" className="text-sm transition-colors" style={{ color: "#6b7280" }}>
          ← Back to assessments
        </Link>
      </div>

      <div className="card text-center mb-6 py-8">
        <h1 className="text-xl font-bold text-white mb-1">{submission.assessment.title}</h1>
        <p className="text-sm mb-4" style={{ color: "#6b7280" }}>{submission.assessment.subject.name}</p>

        <div className="inline-block mb-4">
          <StatusBadge status={submission.status} />
        </div>

        {isGraded ? (
          <div className="mt-2">
            <div className={`text-6xl font-black mb-2 ${getGradeColor(submission.grade ?? "F")}`}>
              {submission.grade}
            </div>
            <div className="text-2xl font-bold text-white">
              {submission.totalScore}/{submission.assessment.totalMarks}
            </div>
            <div className="text-sm mt-0.5" style={{ color: "#a0a8c0" }}>{pct.toFixed(1)}%</div>

            <div className="mt-4 max-w-xs mx-auto rounded-full h-3" style={{ background: "#2e3250" }}>
              <div
                className="h-3 rounded-full transition-all"
                style={{
                  width: `${Math.min(pct, 100)}%`,
                  background: pct >= 70 ? "#10b981" : pct >= 50 ? "#f59e0b" : "#ef4444",
                }}
              />
            </div>

            <p
              className="mt-4 text-sm font-medium"
              style={{ color: passed ? "#10b981" : "#ef4444" }}
            >
              {passed
                ? "Congratulations! You passed this assessment."
                : "You did not meet the pass mark for this assessment."}
            </p>

            {submission.feedback && (
              <div
                className="mt-4 p-3 rounded-lg text-left"
                style={{ background: "rgba(26,86,219,0.08)", border: "1px solid rgba(26,86,219,0.2)" }}
              >
                <p className="text-sm font-medium mb-1" style={{ color: "#3b82f6" }}>Teacher Feedback</p>
                <p className="text-sm" style={{ color: "#a0a8c0" }}>{submission.feedback}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-6">
            <p style={{ color: "#a0a8c0" }}>
              Your submission is being reviewed. Results will be available once graded.
            </p>
            {submission.submittedAt && (
              <p className="text-sm mt-2" style={{ color: "#6b7280" }}>
                Submitted on {formatDateTime(submission.submittedAt)}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Written answers review */}
      {submission.assessment.type === "WRITTEN" && isGraded && submission.answers.length > 0 && (
        <div className="card p-0 overflow-hidden mb-6">
          <div className="px-6 py-4 border-b" style={{ borderColor: "#2e3250" }}>
            <h2 className="font-semibold text-white">Answer Review</h2>
          </div>
          <div>
            {submission.answers.map((a) => {
              const opts = a.question.options ? JSON.parse(a.question.options) : null;
              return (
                <div key={a.id} className="px-6 py-4 border-b last:border-0" style={{ borderColor: "#2e3250" }}>
                  <p className="text-xs font-medium mb-1" style={{ color: "#6b7280" }}>
                    Q{a.question.order}. [{a.question.type}] — {a.marksAwarded ?? "?"}/{a.question.marks} marks
                  </p>
                  <p className="text-sm text-white mb-2">{a.question.text}</p>
                  <div
                    className="text-sm px-3 py-2 rounded-lg"
                    style={
                      a.isCorrect === true
                        ? { background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)" }
                        : a.isCorrect === false
                          ? { background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }
                          : { background: "#1a1d27", color: "#a0a8c0", border: "1px solid #2e3250" }
                    }
                  >
                    Your answer: {a.answer ?? "(none)"}
                  </div>
                  {a.question.correctAnswer && a.question.type !== "ESSAY" && (
                    <p className="text-xs mt-1" style={{ color: "#10b981" }}>
                      Correct: {a.question.correctAnswer}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Project scores */}
      {submission.assessment.type === "PROJECT" && isGraded && submission.projectScores.length > 0 && (
        <div className="card p-0 overflow-hidden mb-6">
          <div className="px-6 py-4 border-b" style={{ borderColor: "#2e3250" }}>
            <h2 className="font-semibold text-white">Project Score Breakdown</h2>
          </div>
          <div>
            {submission.projectScores.map((s) => (
              <div key={s.id} className="px-6 py-4 border-b last:border-0 flex items-center justify-between" style={{ borderColor: "#2e3250" }}>
                <div>
                  <p className="font-medium text-white">{s.criteria.name}</p>
                  {s.comment && <p className="text-xs" style={{ color: "#6b7280" }}>{s.comment}</p>}
                </div>
                <span className="font-medium" style={{ color: "#3b82f6" }}>
                  {s.score}/{s.criteria.maxMarks}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Oral scores */}
      {submission.assessment.type === "ORAL" && isGraded && submission.oralScores.length > 0 && (
        <div className="card p-0 overflow-hidden">
          <div className="px-6 py-4 border-b" style={{ borderColor: "#2e3250" }}>
            <h2 className="font-semibold text-white">Oral Score Breakdown</h2>
          </div>
          <div>
            {submission.oralScores.map((s) => (
              <div key={s.id} className="px-6 py-4 border-b last:border-0 flex items-center justify-between" style={{ borderColor: "#2e3250" }}>
                <div>
                  <p className="font-medium text-white">{s.criteria.name}</p>
                  {s.comment && <p className="text-xs" style={{ color: "#6b7280" }}>{s.comment}</p>}
                </div>
                <span className="font-medium" style={{ color: "#3b82f6" }}>
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
