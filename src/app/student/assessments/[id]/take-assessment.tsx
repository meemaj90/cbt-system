"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface Question {
  id: string;
  order: number;
  type: string;
  text: string;
  marks: number;
  options?: string[] | null;
}

interface TakeAssessmentProps {
  assessment: {
    id: string;
    type: string;
    duration?: number | null;
    questions: Question[];
    totalMarks: number;
  };
  existingSubmission?: any;
}

export function TakeAssessment({ assessment, existingSubmission }: TakeAssessmentProps) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(
    assessment.duration ? assessment.duration * 60 : null
  );
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Restore existing answers
  useEffect(() => {
    if (existingSubmission?.answers) {
      const restored: Record<string, string> = {};
      for (const a of existingSubmission.answers) {
        restored[a.questionId] = a.answer ?? "";
      }
      setAnswers(restored);
    }
  }, []);

  // Timer
  useEffect(() => {
    if (timeLeft === null) return;
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }
    timerRef.current = setTimeout(() => setTimeLeft((t) => (t ?? 1) - 1), 1000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timeLeft]);

  const questions = assessment.questions;

  function formatTime(secs: number): string {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  async function handleSubmit() {
    if (submitting || submitted) return;
    setSubmitting(true);
    if (timerRef.current) clearTimeout(timerRef.current);

    const answerArray = questions.map((q) => ({
      questionId: q.id,
      answer: answers[q.id] ?? "",
    }));

    const res = await fetch(`/api/assessments/${assessment.id}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers: answerArray }),
    });

    setSubmitting(false);
    if (res.ok) {
      setSubmitted(true);
      router.push(`/student/assessments/${assessment.id}/result`);
    }
  }

  const currentQuestion = questions[currentQ];
  const answeredCount = questions.filter((q) => answers[q.id]?.trim()).length;

  return (
    <div>
      {/* Header: timer + progress */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-gray-600">
          Question {currentQ + 1} of {questions.length} · {answeredCount}/{questions.length} answered
        </div>
        {timeLeft !== null && (
          <div className={`text-sm font-bold px-3 py-1 rounded-lg ${timeLeft < 300 ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"}`}>
            {formatTime(timeLeft)}
          </div>
        )}
      </div>

      {/* Question navigation */}
      <div className="flex flex-wrap gap-2 mb-6">
        {questions.map((q, i) => (
          <button
            key={q.id}
            onClick={() => setCurrentQ(i)}
            className={`w-8 h-8 rounded text-xs font-medium transition-colors ${
              i === currentQ
                ? "bg-indigo-600 text-white"
                : answers[q.id]?.trim()
                  ? "bg-green-100 text-green-800 border border-green-300"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* Current question */}
      {currentQuestion && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-gray-500">
              {currentQuestion.type} · {currentQuestion.marks} mark{currentQuestion.marks > 1 ? "s" : ""}
            </span>
          </div>
          <p className="text-base font-medium text-gray-900 mb-4">{currentQuestion.text}</p>

          {currentQuestion.type === "MCQ" && currentQuestion.options && (
            <div className="space-y-2">
              {currentQuestion.options.map((opt: string, oi: number) => (
                <label
                  key={oi}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    answers[currentQuestion.id] === opt
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-gray-200 hover:border-indigo-300 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    name={`q_${currentQuestion.id}`}
                    value={opt}
                    checked={answers[currentQuestion.id] === opt}
                    onChange={(e) => setAnswers({ ...answers, [currentQuestion.id]: e.target.value })}
                    className="text-indigo-600"
                  />
                  <span className="text-sm text-gray-900">
                    {String.fromCharCode(65 + oi)}. {opt}
                  </span>
                </label>
              ))}
            </div>
          )}

          {currentQuestion.type === "ESSAY" && (
            <textarea
              value={answers[currentQuestion.id] ?? ""}
              onChange={(e) => setAnswers({ ...answers, [currentQuestion.id]: e.target.value })}
              className="form-textarea"
              rows={8}
              placeholder="Write your answer here..."
            />
          )}

          {currentQuestion.type === "SHORT_ANSWER" && (
            <input
              type="text"
              value={answers[currentQuestion.id] ?? ""}
              onChange={(e) => setAnswers({ ...answers, [currentQuestion.id]: e.target.value })}
              className="form-input"
              placeholder="Your answer..."
            />
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="secondary"
          onClick={() => setCurrentQ((q) => Math.max(0, q - 1))}
          disabled={currentQ === 0}
        >
          Previous
        </Button>

        <Button
          variant="secondary"
          onClick={() => setCurrentQ((q) => Math.min(questions.length - 1, q + 1))}
          disabled={currentQ === questions.length - 1}
        >
          Next
        </Button>
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {answeredCount} of {questions.length} questions answered
          </p>
          <Button
            onClick={handleSubmit}
            disabled={submitting || submitted}
            className="px-8"
          >
            {submitting ? "Submitting..." : "Submit Assessment"}
          </Button>
        </div>
        {answeredCount < questions.length && (
          <p className="text-xs text-orange-600 mt-2">
            Warning: {questions.length - answeredCount} question(s) unanswered.
          </p>
        )}
      </div>
    </div>
  );
}
