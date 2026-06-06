"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface Question {
  id: string;
  order: number;
  type: string;
  text: string;
  marks: number;
  options?: string[] | null;
  imageUrl?: string | null;
}

interface TakeAssessmentProps {
  assessment: {
    id: string;
    title: string;
    type: string;
    duration?: number | null;
    questions: Question[];
    totalMarks: number;
    randomizeQuestions?: boolean;
  };
  existingSubmission?: any;
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function TakeAssessment({ assessment, existingSubmission }: TakeAssessmentProps) {
  const router = useRouter();
  const [questions] = useState<Question[]>(() =>
    assessment.randomizeQuestions
      ? shuffleArray(assessment.questions)
      : assessment.questions
  );
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(
    assessment.duration ? assessment.duration * 60 : null
  );
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Anti-cheating state
  const [warnings, setWarnings] = useState(0);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [showWarning, setShowWarning] = useState(false);

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

  // Anti-cheating: Fullscreen enforcement
  useEffect(() => {
    const requestFullscreen = () => {
      document.documentElement.requestFullscreen?.();
    };
    requestFullscreen();

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setWarnings((w) => w + 1);
        setShowWarning(true);
        setTimeout(() => setShowWarning(false), 3000);
        requestFullscreen();
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Anti-cheating: Tab/window switch detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitches((t) => t + 1);
        setShowWarning(true);
        setTimeout(() => setShowWarning(false), 3000);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // Anti-cheating: Disable right-click and certain key combos
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey && ["c", "v", "a", "u"].includes(e.key.toLowerCase())) ||
        e.key === "F12"
      ) {
        e.preventDefault();
      }
    };
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

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
      body: JSON.stringify({
        answers: answerArray,
        violations: warnings + tabSwitches,
      }),
    });

    setSubmitting(false);
    if (res.ok) {
      setSubmitted(true);
      router.push(`/student/assessments/${assessment.id}/result`);
    }
  }

  const currentQuestion = questions[currentQ];
  const answeredCount = questions.filter((q) => answers[q.id]?.trim()).length;
  const totalViolations = warnings + tabSwitches;
  const isTimeCritical = timeLeft !== null && timeLeft < 300;

  if (showReview) {
    return (
      <div style={{ background: "#0f1117", minHeight: "100vh", color: "#fff" }}>
        {showWarning && (
          <div className="fixed top-0 left-0 right-0 z-50 p-4 text-center font-bold text-white" style={{ background: "#ef4444" }}>
            WARNING: Do not leave the exam window! ({totalViolations} violation{totalViolations !== 1 ? "s" : ""} recorded)
          </div>
        )}
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Review Your Answers</h2>
            <button
              onClick={() => setShowReview(false)}
              className="btn-secondary text-sm px-3 py-1.5"
            >
              Back to Exam
            </button>
          </div>
          <div className="space-y-4 mb-8">
            {questions.map((q, i) => (
              <div key={q.id} className="card">
                <div className="flex items-start gap-3">
                  <span
                    className="w-7 h-7 rounded flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{
                      background: answers[q.id]?.trim() ? "rgba(26,86,219,0.2)" : "rgba(107,114,128,0.2)",
                      color: answers[q.id]?.trim() ? "#1a56db" : "#6b7280",
                    }}
                  >
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white mb-2">{q.text}</p>
                    <p className="text-xs" style={{ color: answers[q.id]?.trim() ? "#10b981" : "#ef4444" }}>
                      {answers[q.id]?.trim() ? `Answer: ${answers[q.id]}` : "Not answered"}
                    </p>
                  </div>
                  <button
                    onClick={() => { setCurrentQ(i); setShowReview(false); }}
                    className="text-xs px-2 py-1 rounded"
                    style={{ color: "#1a56db", background: "rgba(26,86,219,0.1)" }}
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="card flex items-center justify-between">
            <div>
              <p className="text-white font-medium">{answeredCount}/{questions.length} questions answered</p>
              {answeredCount < questions.length && (
                <p className="text-xs mt-1" style={{ color: "#f59e0b" }}>
                  {questions.length - answeredCount} question(s) still unanswered
                </p>
              )}
            </div>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="btn-primary px-6 py-2.5 font-semibold disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Assessment"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "#0f1117", minHeight: "100vh", color: "#fff" }}>
      {/* Warning banner */}
      {showWarning && (
        <div className="fixed top-0 left-0 right-0 z-50 p-4 text-center font-bold text-white" style={{ background: "#ef4444" }}>
          WARNING: Do not leave the exam window! ({totalViolations} violation{totalViolations !== 1 ? "s" : ""} recorded)
        </div>
      )}

      {/* Top bar */}
      <div
        className="sticky top-0 z-40 flex items-center gap-4 px-4 sm:px-6 h-14 border-b"
        style={{ background: "#1a1d27", borderColor: "#2e3250" }}
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{assessment.title}</p>
          <p className="text-xs" style={{ color: "#6b7280" }}>
            {answeredCount}/{questions.length} answered
          </p>
        </div>

        {/* Progress bar */}
        <div className="hidden sm:flex items-center gap-2 flex-1 max-w-xs">
          <div className="flex-1 h-1.5 rounded-full" style={{ background: "#2e3250" }}>
            <div
              className="h-1.5 rounded-full transition-all"
              style={{ width: `${(answeredCount / questions.length) * 100}%`, background: "#1a56db" }}
            />
          </div>
          <span className="text-xs" style={{ color: "#a0a8c0" }}>
            {Math.round((answeredCount / questions.length) * 100)}%
          </span>
        </div>

        {/* Timer */}
        {timeLeft !== null && (
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-sm"
            style={{
              background: isTimeCritical ? "rgba(239,68,68,0.15)" : "rgba(26,86,219,0.15)",
              color: isTimeCritical ? "#ef4444" : "#3b82f6",
              border: `1px solid ${isTimeCritical ? "rgba(239,68,68,0.3)" : "rgba(26,86,219,0.3)"}`,
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" strokeWidth={2} />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2" />
            </svg>
            {formatTime(timeLeft)}
          </div>
        )}

        {totalViolations > 0 && (
          <div
            className="text-xs px-2 py-1 rounded"
            style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444" }}
          >
            {totalViolations} violation{totalViolations !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      <div className="flex h-[calc(100vh-56px)]">
        {/* Left sidebar: question navigation */}
        <div
          className="w-16 sm:w-20 flex-shrink-0 border-r overflow-y-auto p-2"
          style={{ background: "#1a1d27", borderColor: "#2e3250" }}
        >
          <p className="text-xs text-center mb-2 hidden sm:block" style={{ color: "#6b7280" }}>Q Nav</p>
          <div className="space-y-1.5">
            {questions.map((q, i) => {
              const isAnswered = !!answers[q.id]?.trim();
              const isCurrent = i === currentQ;
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentQ(i)}
                  className="w-full h-8 rounded text-xs font-bold transition-all"
                  style={{
                    background: isCurrent
                      ? "#ff6b00"
                      : isAnswered
                        ? "rgba(26,86,219,0.3)"
                        : "#1e2235",
                    color: isCurrent ? "#fff" : isAnswered ? "#3b82f6" : "#6b7280",
                    border: isCurrent ? "1px solid #ff6b00" : isAnswered ? "1px solid rgba(26,86,219,0.4)" : "1px solid #2e3250",
                  }}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
          {/* Legend */}
          <div className="mt-4 space-y-1 hidden sm:block">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded" style={{ background: "#ff6b00" }} />
              <span className="text-xs" style={{ color: "#6b7280" }}>Current</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded" style={{ background: "rgba(26,86,219,0.3)" }} />
              <span className="text-xs" style={{ color: "#6b7280" }}>Answered</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded" style={{ background: "#1e2235", border: "1px solid #2e3250" }} />
              <span className="text-xs" style={{ color: "#6b7280" }}>Empty</span>
            </div>
          </div>
        </div>

        {/* Main question area */}
        <div className="flex-1 overflow-y-auto">
          {currentQuestion && (
            <div className="max-w-2xl mx-auto px-4 py-6">
              {/* Question header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                    style={{ background: "#ff6b00", color: "#fff" }}
                  >
                    {currentQ + 1}
                  </span>
                  <div>
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded"
                      style={{ background: "rgba(26,86,219,0.15)", color: "#3b82f6" }}
                    >
                      {currentQuestion.type === "MCQ"
                        ? "Multiple Choice"
                        : currentQuestion.type === "ESSAY"
                          ? "Essay"
                          : currentQuestion.type === "SHORT_ANSWER"
                            ? "Short Answer"
                            : currentQuestion.type === "TRUE_FALSE"
                              ? "True/False"
                              : currentQuestion.type === "FILL_BLANK"
                                ? "Fill in the Blank"
                                : currentQuestion.type}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-medium" style={{ color: "#a0a8c0" }}>
                  {currentQuestion.marks} mark{currentQuestion.marks !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Question text */}
              <div className="card mb-4">
                <p className="text-base font-medium text-white leading-relaxed mb-3">
                  {currentQuestion.text}
                </p>
                {currentQuestion.imageUrl && (
                  <div className="mt-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={currentQuestion.imageUrl}
                      alt="Question image"
                      className="max-w-full rounded-lg border"
                      style={{ borderColor: "#2e3250", maxHeight: "300px", objectFit: "contain" }}
                    />
                  </div>
                )}
              </div>

              {/* Answer area */}
              <div className="card">
                {currentQuestion.type === "MCQ" && currentQuestion.options && (
                  <div className="space-y-2">
                    {currentQuestion.options.map((opt: string, oi: number) => {
                      const isSelected = answers[currentQuestion.id] === opt;
                      return (
                        <label
                          key={oi}
                          className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all"
                          style={{
                            background: isSelected ? "rgba(26,86,219,0.15)" : "transparent",
                            borderColor: isSelected ? "#1a56db" : "#2e3250",
                          }}
                        >
                          <input
                            type="radio"
                            name={`q_${currentQuestion.id}`}
                            value={opt}
                            checked={isSelected}
                            onChange={(e) =>
                              setAnswers({ ...answers, [currentQuestion.id]: e.target.value })
                            }
                            className="hidden"
                          />
                          <div
                            className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                            style={{
                              borderColor: isSelected ? "#1a56db" : "#2e3250",
                            }}
                          >
                            {isSelected && (
                              <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#1a56db" }} />
                            )}
                          </div>
                          <span className="text-sm" style={{ color: isSelected ? "#fff" : "#a0a8c0" }}>
                            <span className="font-bold mr-2">{String.fromCharCode(65 + oi)}.</span>
                            {opt}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {currentQuestion.type === "TRUE_FALSE" && (
                  <div className="space-y-2">
                    {["True", "False"].map((opt) => {
                      const isSelected = answers[currentQuestion.id] === opt;
                      return (
                        <label
                          key={opt}
                          className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all"
                          style={{
                            background: isSelected ? "rgba(26,86,219,0.15)" : "transparent",
                            borderColor: isSelected ? "#1a56db" : "#2e3250",
                          }}
                        >
                          <input
                            type="radio"
                            name={`q_${currentQuestion.id}`}
                            value={opt}
                            checked={isSelected}
                            onChange={(e) =>
                              setAnswers({ ...answers, [currentQuestion.id]: e.target.value })
                            }
                            className="hidden"
                          />
                          <div
                            className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                            style={{ borderColor: isSelected ? "#1a56db" : "#2e3250" }}
                          >
                            {isSelected && (
                              <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#1a56db" }} />
                            )}
                          </div>
                          <span className="text-sm font-medium" style={{ color: isSelected ? "#fff" : "#a0a8c0" }}>
                            {opt}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {currentQuestion.type === "FILL_BLANK" && (
                  <div>
                    <p className="text-xs mb-2" style={{ color: "#6b7280" }}>
                      Fill in the blank(s) marked with ___
                    </p>
                    <input
                      type="text"
                      value={answers[currentQuestion.id] ?? ""}
                      onChange={(e) =>
                        setAnswers({ ...answers, [currentQuestion.id]: e.target.value })
                      }
                      className="form-input"
                      placeholder="Your answer..."
                    />
                  </div>
                )}

                {currentQuestion.type === "ESSAY" && (
                  <textarea
                    value={answers[currentQuestion.id] ?? ""}
                    onChange={(e) =>
                      setAnswers({ ...answers, [currentQuestion.id]: e.target.value })
                    }
                    className="form-textarea"
                    rows={8}
                    placeholder="Write your answer here..."
                  />
                )}

                {currentQuestion.type === "SHORT_ANSWER" && (
                  <input
                    type="text"
                    value={answers[currentQuestion.id] ?? ""}
                    onChange={(e) =>
                      setAnswers({ ...answers, [currentQuestion.id]: e.target.value })
                    }
                    className="form-input"
                    placeholder="Your answer..."
                  />
                )}
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between mt-4">
                <button
                  onClick={() => setCurrentQ((q) => Math.max(0, q - 1))}
                  disabled={currentQ === 0}
                  className="btn-secondary text-sm px-4 py-2 disabled:opacity-40"
                >
                  Previous
                </button>

                <span className="text-xs" style={{ color: "#6b7280" }}>
                  {currentQ + 1} / {questions.length}
                </span>

                {currentQ < questions.length - 1 ? (
                  <button
                    onClick={() => setCurrentQ((q) => Math.min(questions.length - 1, q + 1))}
                    className="btn-primary text-sm px-4 py-2"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={() => setShowReview(true)}
                    className="btn-orange text-sm px-4 py-2"
                  >
                    Review & Submit
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom submit bar */}
      <div
        className="fixed bottom-0 left-0 right-0 border-t px-4 py-3 flex items-center justify-between"
        style={{ background: "#1a1d27", borderColor: "#2e3250" }}
      >
        <p className="text-xs" style={{ color: "#6b7280" }}>
          {answeredCount} of {questions.length} answered
          {answeredCount < questions.length && (
            <span style={{ color: "#f59e0b" }}> · {questions.length - answeredCount} unanswered</span>
          )}
        </p>
        <button
          onClick={() => setShowReview(true)}
          className="btn-orange text-sm px-4 py-2"
        >
          Review & Submit
        </button>
      </div>
    </div>
  );
}
