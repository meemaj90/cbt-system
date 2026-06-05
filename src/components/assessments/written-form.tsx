"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QuestionData } from "@/types";

interface WrittenFormProps {
  questions: QuestionData[];
  onChange: (questions: QuestionData[]) => void;
}

export function WrittenForm({ questions, onChange }: WrittenFormProps) {
  function addMCQ() {
    onChange([
      ...questions,
      {
        order: questions.length + 1,
        type: "MCQ",
        text: "",
        marks: 2,
        options: ["", "", "", ""],
        correctAnswer: "",
      },
    ]);
  }

  function addEssay() {
    onChange([
      ...questions,
      {
        order: questions.length + 1,
        type: "ESSAY",
        text: "",
        marks: 10,
      },
    ]);
  }

  function addShortAnswer() {
    onChange([
      ...questions,
      {
        order: questions.length + 1,
        type: "SHORT_ANSWER",
        text: "",
        marks: 5,
        correctAnswer: "",
      },
    ]);
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
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={addMCQ}>
          + MCQ Question
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={addEssay}>
          + Essay Question
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={addShortAnswer}>
          + Short Answer
        </Button>
      </div>

      {questions.length === 0 && (
        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 text-gray-500 text-sm">
          Add questions using the buttons above
        </div>
      )}

      {questions.map((q, idx) => (
        <div key={idx} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">
              Q{idx + 1}.{" "}
              <span className="text-indigo-600">
                {q.type === "MCQ" ? "Multiple Choice" : q.type === "ESSAY" ? "Essay" : "Short Answer"}
              </span>
            </span>
            <button
              type="button"
              onClick={() => removeQuestion(idx)}
              className="text-red-500 hover:text-red-700 text-sm"
            >
              Remove
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="form-label">Question Text</label>
              <textarea
                value={q.text}
                onChange={(e) => updateQuestion(idx, "text", e.target.value)}
                className="form-textarea"
                rows={2}
                placeholder="Enter question text..."
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label">Marks</label>
                <Input
                  type="number"
                  min={1}
                  value={q.marks}
                  onChange={(e) => updateQuestion(idx, "marks", parseInt(e.target.value) || 1)}
                />
              </div>
            </div>

            {q.type === "MCQ" && (
              <div className="space-y-2">
                <label className="form-label">Options (mark the correct one)</label>
                {(q.options ?? ["", "", "", ""]).map((opt, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`correct-${idx}`}
                      checked={q.correctAnswer === opt && opt !== ""}
                      onChange={() => updateQuestion(idx, "correctAnswer", opt)}
                      className="text-indigo-600"
                    />
                    <Input
                      value={opt}
                      onChange={(e) => {
                        updateOption(idx, oi, e.target.value);
                        if (q.correctAnswer === opt) {
                          updateQuestion(idx, "correctAnswer", e.target.value);
                        }
                      }}
                      placeholder={`Option ${oi + 1}`}
                    />
                  </div>
                ))}
                <p className="text-xs text-gray-500">Select the radio button next to the correct answer</p>
              </div>
            )}

            {q.type === "SHORT_ANSWER" && (
              <div>
                <label className="form-label">Expected Answer (for auto-grading)</label>
                <Input
                  value={q.correctAnswer ?? ""}
                  onChange={(e) => updateQuestion(idx, "correctAnswer", e.target.value)}
                  placeholder="Enter expected answer..."
                />
              </div>
            )}
          </div>
        </div>
      ))}

      {questions.length > 0 && (
        <div className="text-sm text-gray-600 font-medium">
          Total Questions: {questions.length} | Total Marks:{" "}
          {questions.reduce((sum, q) => sum + q.marks, 0)}
        </div>
      )}
    </div>
  );
}
