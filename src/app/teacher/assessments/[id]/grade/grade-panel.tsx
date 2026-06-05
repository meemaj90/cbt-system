"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

    // Essay/short answer grades
    if (sub.answers) {
      sub.answers.forEach((a: any) => {
        if (a.question.type === "ESSAY" || a.question.type === "SHORT_ANSWER") {
          data[`answer_${a.id}`] = a.marksAwarded ?? 0;
        }
      });
    }

    // Project criteria scores
    if (assessment.projectCriteria) {
      assessment.projectCriteria.forEach((c: any) => {
        const existing = sub.projectScores?.find((s: any) => s.criteriaId === c.id);
        data[`project_${c.id}`] = existing?.score ?? 0;
        data[`project_comment_${c.id}`] = existing?.comment ?? "";
      });
    }

    // Oral criteria scores
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
      <div className="col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <p className="text-sm font-medium text-gray-700">Submissions</p>
        </div>
        <div className="divide-y divide-gray-100 overflow-y-auto max-h-[600px]">
          {submissions.length === 0 ? (
            <p className="px-4 py-8 text-center text-gray-500 text-sm">No submissions yet.</p>
          ) : (
            submissions.map((s) => (
              <button
                key={s.id}
                onClick={() => handleSelect(s.id)}
                className={`w-full text-left px-4 py-3 transition-colors hover:bg-indigo-50 ${selected === s.id ? "bg-indigo-50 border-l-2 border-indigo-500" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{s.student.name}</p>
                    <p className="text-xs text-gray-500">{s.student.studentId} · {s.student.class?.name}</p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={s.status} />
                    {s.grade && (
                      <p className={`text-sm font-bold mt-0.5 ${getGradeColor(s.grade)}`}>{s.grade}</p>
                    )}
                  </div>
                </div>
                {s.totalScore !== null && (
                  <p className="text-xs text-gray-500 mt-1">
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
          <div className="bg-white rounded-xl border border-gray-200 flex items-center justify-center h-64">
            <p className="text-gray-500 text-sm">Select a submission to grade</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">{selectedSub.student.name}</h3>
              <p className="text-sm text-gray-500">
                {selectedSub.student.studentId} · Submitted{" "}
                {selectedSub.submittedAt
                  ? new Date(selectedSub.submittedAt).toLocaleString()
                  : "N/A"}
              </p>
            </div>

            <div className="p-6 space-y-6 max-h-[560px] overflow-y-auto">
              {/* Written: show answers */}
              {assessment.type === "WRITTEN" && selectedSub.answers?.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-gray-700">Answers</h4>
                  {selectedSub.answers.map((a: any) => (
                    <div key={a.id} className="border border-gray-200 rounded-lg p-4">
                      <p className="text-sm font-medium text-gray-700 mb-1">
                        Q{a.question.order}. [{a.question.type}] — {a.question.marks} marks
                      </p>
                      <p className="text-sm text-gray-800 mb-2">{a.question.text}</p>
                      <div className="bg-gray-50 rounded p-2 mb-2">
                        <p className="text-xs text-gray-500 mb-0.5">Student Answer:</p>
                        <p className="text-sm text-gray-900">{a.answer ?? "(No answer)"}</p>
                      </div>
                      {a.question.type === "MCQ" ? (
                        <p className={`text-xs font-medium ${a.isCorrect ? "text-green-600" : "text-red-600"}`}>
                          {a.isCorrect ? "Correct" : "Incorrect"} — {a.marksAwarded ?? 0}/{a.question.marks} marks
                        </p>
                      ) : (
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-gray-600">Marks awarded:</label>
                          <Input
                            type="number"
                            min={0}
                            max={a.question.marks}
                            value={gradeData[`answer_${a.id}`] ?? 0}
                            onChange={(e) =>
                              setGradeData({ ...gradeData, [`answer_${a.id}`]: e.target.value })
                            }
                            className="w-20"
                          />
                          <span className="text-xs text-gray-500">/ {a.question.marks}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Project criteria scoring */}
              {assessment.type === "PROJECT" && assessment.projectCriteria?.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-gray-700">Project Scoring</h4>
                  {assessment.projectCriteria.map((c: any) => (
                    <div key={c.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{c.name}</p>
                          {c.description && <p className="text-xs text-gray-500">{c.description}</p>}
                        </div>
                        <span className="text-xs text-gray-500">Max: {c.maxMarks}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-gray-600">Score:</label>
                          <Input
                            type="number"
                            min={0}
                            max={c.maxMarks}
                            value={gradeData[`project_${c.id}`] ?? 0}
                            onChange={(e) =>
                              setGradeData({ ...gradeData, [`project_${c.id}`]: e.target.value })
                            }
                            className="w-20"
                          />
                          <span className="text-xs text-gray-500">/ {c.maxMarks}</span>
                        </div>
                        <div>
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
                    </div>
                  ))}
                </div>
              )}

              {/* Oral criteria scoring */}
              {assessment.type === "ORAL" && assessment.oralCriteria?.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-gray-700">Oral Scoring</h4>
                  {assessment.oralCriteria.map((c: any) => (
                    <div key={c.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{c.name}</p>
                          {c.description && <p className="text-xs text-gray-500">{c.description}</p>}
                        </div>
                        <span className="text-xs text-gray-500">Max: {c.maxMarks}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-gray-600">Score:</label>
                          <Input
                            type="number"
                            min={0}
                            max={c.maxMarks}
                            value={gradeData[`oral_${c.id}`] ?? 0}
                            onChange={(e) =>
                              setGradeData({ ...gradeData, [`oral_${c.id}`]: e.target.value })
                            }
                            className="w-20"
                          />
                          <span className="text-xs text-gray-500">/ {c.maxMarks}</span>
                        </div>
                        <div>
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

              <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving ? "Saving..." : "Save Grade"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
