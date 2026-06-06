"use client";

import { useState } from "react";
import { QuestionData } from "@/types";

interface WrittenFormProps {
  questions: QuestionData[];
  onChange: (questions: QuestionData[]) => void;
}

const TYPE_LABELS: Record<string, string> = {
  MCQ: "Multiple Choice",
  ESSAY: "Essay",
  SHORT_ANSWER: "Short Answer",
  TRUE_FALSE: "True / False",
  FILL_BLANK: "Fill in the Blank",
};

export function WrittenForm({ questions, onChange }: WrittenFormProps) {
  function addQuestion(type: string) {
    const base: QuestionData = {
      order: questions.length + 1,
      type: type as any,
      text: "",
      marks: type === "ESSAY" ? 10 : type === "SHORT_ANSWER" ? 5 : 2,
      imageUrl: null,
    };
    if (type === "MCQ") {
      base.options = ["", "", "", ""];
      base.correctAnswer = "";
    } else if (type === "SHORT_ANSWER" || type === "FILL_BLANK") {
      base.correctAnswer = "";
    } else if (type === "TRUE_FALSE") {
      base.correctAnswer = "";
    }
    onChange([...questions, base]);
  }

  function removeQuestion(idx: number) {
    const updated = questions.filter((_, i) => i !== idx).map((q, i) => ({ ...q, order: i + 1 }));
    onChange(updated);
  }

  function updateQuestion(idx: number, field: keyof QuestionData, value: any) {
    const updated = questions.map((q, i) => (i === idx ? { ...q, [field]: value } : q));
    onChange(updated);
  }

  function updateOption(qIdx: number, optIdx: number, value: string) {
    const updated = questions.map((q, i) => {
      if (i !== qIdx) return q;
      const opts = [...(q.options ?? ["", "", "", ""])];
      opts[optIdx] = value;
      return { ...q, options: opts };
    });
    onChange(updated);
  }

  return (
    <div className="space-y-4">
      {/* Add question buttons */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(TYPE_LABELS).map(([type, label]) => (
          <button
            key={type}
            type="button"
            onClick={() => addQuestion(type)}
            className="btn-secondary text-xs px-3 py-1.5"
          >
            + {label}
          </button>
        ))}
      </div>

      {questions.length === 0 && (
        <div
          className="text-center py-10 rounded-xl border-2 border-dashed text-sm"
          style={{ borderColor: "#2e3250", color: "#6b7280" }}
        >
          Add questions using the buttons above
        </div>
      )}

      {questions.map((q, idx) => (
        <div
          key={idx}
          className="rounded-xl border p-4"
          style={{ background: "#1e2235", borderColor: "#2e3250" }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium" style={{ color: "#a0a8c0" }}>
              Q{idx + 1}.{" "}
              <span style={{ color: "#3b82f6" }}>{TYPE_LABELS[q.type] ?? q.type}</span>
            </span>
            <button
              type="button"
              onClick={() => removeQuestion(idx)}
              className="text-xs px-2 py-1 rounded"
              style={{ color: "#ef4444", background: "rgba(239,68,68,0.1)" }}
            >
              Remove
            </button>
          </div>

          <div className="space-y-3">
            {/* Question text */}
            <div>
              <label className="form-label">Question Text</label>
              <textarea
                value={q.text}
                onChange={(e) => updateQuestion(idx, "text", e.target.value)}
                className="form-textarea"
                rows={2}
                placeholder={
                  q.type === "FILL_BLANK"
                    ? "Enter question with ___ to mark blank(s)"
                    : "Enter question text..."
                }
                required
              />
              {q.type === "FILL_BLANK" && (
                <p className="text-xs mt-1" style={{ color: "#6b7280" }}>
                  Use ___ (three underscores) to mark where the blank is.
                </p>
              )}
            </div>

            {/* Image URL */}
            <div>
              <label className="form-label">Image URL (optional)</label>
              <input
                type="url"
                value={q.imageUrl ?? ""}
                onChange={(e) => updateQuestion(idx, "imageUrl", e.target.value || null)}
                className="form-input"
                placeholder="https://example.com/image.png"
              />
              {q.imageUrl && (
                <div className="mt-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={q.imageUrl}
                    alt="Preview"
                    className="max-h-40 rounded-lg border object-contain"
                    style={{ borderColor: "#2e3250" }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              )}
            </div>

            {/* Marks */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label">Marks</label>
                <input
                  type="number"
                  min={1}
                  value={q.marks}
                  onChange={(e) => updateQuestion(idx, "marks", parseInt(e.target.value) || 1)}
                  className="form-input"
                />
              </div>
            </div>

            {/* MCQ options */}
            {q.type === "MCQ" && (
              <div className="space-y-2">
                <label className="form-label">Options (select the correct one)</label>
                {(q.options ?? ["", "", "", ""]).map((opt, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`correct-${idx}`}
                      checked={q.correctAnswer === opt && opt !== ""}
                      onChange={() => updateQuestion(idx, "correctAnswer", opt)}
                      style={{ accentColor: "#1a56db" }}
                    />
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => {
                        updateOption(idx, oi, e.target.value);
                        if (q.correctAnswer === opt) {
                          updateQuestion(idx, "correctAnswer", e.target.value);
                        }
                      }}
                      className="form-input"
                      placeholder={`Option ${oi + 1}`}
                    />
                  </div>
                ))}
                <p className="text-xs" style={{ color: "#6b7280" }}>
                  Select the radio button next to the correct answer
                </p>
              </div>
            )}

            {/* TRUE_FALSE correct answer */}
            {q.type === "TRUE_FALSE" && (
              <div>
                <label className="form-label">Correct Answer</label>
                <select
                  value={q.correctAnswer ?? ""}
                  onChange={(e) => updateQuestion(idx, "correctAnswer", e.target.value)}
                  className="form-select"
                >
                  <option value="">Select correct answer...</option>
                  <option value="True">True</option>
                  <option value="False">False</option>
                </select>
              </div>
            )}

            {/* SHORT_ANSWER / FILL_BLANK correct answer */}
            {(q.type === "SHORT_ANSWER" || q.type === "FILL_BLANK") && (
              <div>
                <label className="form-label">Expected Answer (for auto-grading)</label>
                <input
                  type="text"
                  value={q.correctAnswer ?? ""}
                  onChange={(e) => updateQuestion(idx, "correctAnswer", e.target.value)}
                  className="form-input"
                  placeholder="Enter expected answer..."
                />
              </div>
            )}
          </div>
        </div>
      ))}

      {questions.length > 0 && (
        <div className="flex items-center gap-4 text-sm" style={{ color: "#a0a8c0" }}>
          <span>Total Questions: <strong style={{ color: "#fff" }}>{questions.length}</strong></span>
          <span>Total Marks: <strong style={{ color: "#fff" }}>{questions.reduce((sum, q) => sum + q.marks, 0)}</strong></span>
        </div>
      )}
    </div>
  );
}
