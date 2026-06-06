"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/ui/badge";
import { getGradeColor } from "@/lib/utils";

interface GradePanelProps {
  assessment: any;
  submissions: any[];
}

export function GradePanel({ assessment, submissions }: GradePanelProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [gradeData, setGradeData] = useState<Record<string, any>>({});
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);

  const selectedSub = submissions.find((s) => s.id === selected);

  function initGradeData(sub: any) {
    const data: Record<string, any> = {};
    if (sub.answers) {
      sub.answers.forEach((a: any) => {
        if (a.question.type === "ESSAY" || a.question.type === "SHORT_ANSWER") {
          data[`answer_${a.id}`] = a.marksAwarded ?? 0;
        }
      });
    }
    if (assessment.projectCriteria) {
      assessment.projectCriteria.forEach((c: any) => {
        const existing = sub.projectScores?.find((s: any) => s.criteriaId === c.id);
        data[`project_${c.id}`] = existing?.score ?? 0;
        data[`project_comment_${c.id}`] = existing?.comment ?? "";
      });
    }
    if (assessment.oralCriteria) {
      assessment.oralCriteria.forEach((c: any) => {
        const existing = sub.oralScores?.find((s: any) => s.criteriaId === c.id);
        data[`oral_${c.id}`] = existing?.score ?? 0;
        data[`oral_comment_${c.id}`] = existing?.comment ?? "";
      });
    }
    setGradeData(data);
    setFeedback(sub.feedback ?? "");
  }

  function handleSelect(subId: string) {
    setSelected(subId);
    const sub = submissions.find((s) => s.id === subId);
    if (sub) initGradeData(sub);
  }

  async function handleSave() {
    if (!selectedSub) return;
    setSaving(true);
    const answerGrades = selectedSub.answers
      ?.filter((a: any) => a.question.type === "ESSAY" || a.question.type === "SHORT_ANSWER")
      .map((a: any) => ({
        answerId: a.id,
        marksAwarded: parseFloat(gradeData[`answer_${a.id}`] ?? 0),
      }));
    const projectScores = assessment.projectCriteria?.map((c: any) => ({
      criteriaId: c.id,
      score: parseFloat(gradeData[`project_${c.id}`] ?? 0),
      comment: gradeData[`project_comment_${c.id}`] ?? "",
    }));
    const oralScores = assessment.oralCriteria?.map((c: any) => ({
      criteriaId: c.id,
      score: parseFloat(gradeData[`oral_${c.id}`] ?? 0),
      comment: gradeData[`oral_comment_${c.id}`] ?? "",
    }));
    await fetch(`/api/submissions/${selectedSub.id}/grade`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answerGrades, projectScores, oralScores, feedback }),
    });
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="grid grid-cols-5 gap-6">
      {/* Submission list */}
      <div className="col-span-2 card p-0 overflow-hidden">
        <div className="px-4 py-3 border-b" style={{ borderColor: "#2e3250", background: "#0f1117" }}>
          <p className="text-sm font-medium text-white">Submissions</p>
        </div>
        <div className="overflow-y-auto" style={{ maxHeight: "600px" }}>
          {submissions.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm" style={{ color: "#6b7280" }}>No submissions yet.</p>
          ) : (
            submissions.map((s) => (
              <button
                key={s.id}
                onClick={() => handleSelect(s.id)}
                className="w-full text-left px-4 py-3 transition-colors border-b"
                style={{
                  borderColor: "#2e3250",
                  background: selected === s.id ? "rgba(26,86,219,0.12)" : "transparent",
                  borderLeft: selected === s.id ? "3px solid #1a56db" : "3px solid transparent",
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">{s.student.name}</p>
                    <p className="text-xs" style={{ color: "#6b7280" }}>{s.student.studentId} · {s.student.class?.name}</p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={s.status} />
                    {s.grade && (
                      <p className={`text-sm font-bold mt-0.5 ${getGradeColor(s.grade)}`}>{s.grade}</p>
                    )}
                  </div>
                </div>
                {s.totalScore !== null && (
                  <p className="text-xs mt-1" style={{ color: "#6b7280" }}>
                    Score: {s.totalScore}/{assessment.totalMarks} ({s.percentage?.toFixed(1)}%)
                  </p>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Grading panel */}
      <div className="col-span-3">
        {!selectedSub ? (
          <div className="card flex items-center justify-center h-64">
            <p className="text-sm" style={{ color: "#6b7280" }}>Select a submission to grade</p>
          </div>
        ) : (
          <div className="card p-0 overflow-hidden">
            <div className="px-6 py-4 border-b" style={{ borderColor: "#2e3250" }}>
              <h3 className="font-semibold text-white">{selectedSub.student.name}</h3>
              <p className="text-sm" style={{ color: "#6b7280" }}>
                {selectedSub.student.studentId} · Submitted{" "}
                {selectedSub.submittedAt ? new Date(selectedSub.submittedAt).toLocaleString() : "N/A"}
              </p>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto" style={{ maxHeight: "560px" }}>
              {/* Written: show answers */}
              {assessment.type === "WRITTEN" && selectedSub.answers?.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-white">Answers</h4>
                  {selectedSub.answers.map((a: any) => (
                    <div key={a.id} className="rounded-lg p-4 border" style={{ borderColor: "#2e3250", background: "#0f1117" }}>
                      <p className="text-sm font-medium mb-1" style={{ color: "#a0a8c0" }}>
                        Q{a.question.order}. [{a.question.type}] — {a.question.marks} marks
                      </p>
                      <p className="text-sm text-white mb-2">{a.question.text}</p>
                      <div className="rounded p-2 mb-2" style={{ background: "#1a1d27" }}>
                        <p className="text-xs mb-0.5" style={{ color: "#6b7280" }}>Student Answer:</p>
                        <p className="text-sm text-white">{a.answer ?? "(No answer)"}</p>
                      </div>
                      {a.question.type === "MCQ" || a.question.type === "TRUE_FALSE" || a.question.type === "FILL_BLANK" ? (
                        <p
                          className="text-xs font-medium"
                          style={{ color: a.isCorrect ? "#10b981" : "#ef4444" }}
                        >
                          {a.isCorrect ? "Correct" : "Incorrect"} — {a.marksAwarded ?? 0}/{a.question.marks} marks
                        </p>
                      ) : (
                        <div className="flex items-center gap-2">
                          <label className="text-xs" style={{ color: "#6b7280" }}>Marks awarded:</label>
                          <input
                            type="number"
                            min={0}
                            max={a.question.marks}
                            value={gradeData[`answer_${a.id}`] ?? 0}
                            onChange={(e) =>
                              setGradeData({ ...gradeData, [`answer_${a.id}`]: e.target.value })
                            }
                            className="form-input w-20 text-xs"
                          />
                          <span className="text-xs" style={{ color: "#6b7280" }}>/ {a.question.marks}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Project criteria */}
              {assessment.type === "PROJECT" && assessment.projectCriteria?.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-white">Project Scoring</h4>
                  {assessment.projectCriteria.map((c: any) => (
                    <div key={c.id} className="rounded-lg p-4 border" style={{ borderColor: "#2e3250", background: "#0f1117" }}>
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-sm font-medium text-white">{c.name}</p>
                          {c.description && <p className="text-xs" style={{ color: "#6b7280" }}>{c.description}</p>}
                        </div>
                        <span className="text-xs" style={{ color: "#6b7280" }}>Max: {c.maxMarks}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-2">
                          <label className="text-xs" style={{ color: "#6b7280" }}>Score:</label>
                          <input
                            type="number"
                            min={0}
                            max={c.maxMarks}
                            value={gradeData[`project_${c.id}`] ?? 0}
                            onChange={(e) =>
                              setGradeData({ ...gradeData, [`project_${c.id}`]: e.target.value })
                            }
                            className="form-input w-20 text-xs"
                          />
                          <span className="text-xs" style={{ color: "#6b7280" }}>/ {c.maxMarks}</span>
                        </div>
                        <input
                          type="text"
                          placeholder="Comment..."
                          value={gradeData[`project_comment_${c.id}`] ?? ""}
                          onChange={(e) =>
                            setGradeData({ ...gradeData, [`project_comment_${c.id}`]: e.target.value })
                          }
                          className="form-input text-xs"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Oral criteria */}
              {assessment.type === "ORAL" && assessment.oralCriteria?.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-white">Oral Scoring</h4>
                  {assessment.oralCriteria.map((c: any) => (
                    <div key={c.id} className="rounded-lg p-4 border" style={{ borderColor: "#2e3250", background: "#0f1117" }}>
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-sm font-medium text-white">{c.name}</p>
                          {c.description && <p className="text-xs" style={{ color: "#6b7280" }}>{c.description}</p>}
                        </div>
                        <span className="text-xs" style={{ color: "#6b7280" }}>Max: {c.maxMarks}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-2">
                          <label className="text-xs" style={{ color: "#6b7280" }}>Score:</label>
                          <input
                            type="number"
                            min={0}
                            max={c.maxMarks}
                            value={gradeData[`oral_${c.id}`] ?? 0}
                            onChange={(e) =>
                              setGradeData({ ...gradeData, [`oral_${c.id}`]: e.target.value })
                            }
                            className="form-input w-20 text-xs"
                          />
                          <span className="text-xs" style={{ color: "#6b7280" }}>/ {c.maxMarks}</span>
                        </div>
                        <input
                          type="text"
                          placeholder="Comment..."
                          value={gradeData[`oral_comment_${c.id}`] ?? ""}
                          onChange={(e) =>
                            setGradeData({ ...gradeData, [`oral_comment_${c.id}`]: e.target.value })
                          }
                          className="form-input text-xs"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Feedback */}
              <div>
                <label className="form-label">Overall Feedback</label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="form-textarea"
                  rows={3}
                  placeholder="Optional feedback to the student..."
                />
              </div>

              <button onClick={handleSave} disabled={saving} className="w-full btn-primary py-2.5 disabled:opacity-50">
                {saving ? "Saving..." : "Save Grade"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
