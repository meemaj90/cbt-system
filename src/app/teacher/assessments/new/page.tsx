"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { WrittenForm } from "@/components/assessments/written-form";
import { ProjectForm } from "@/components/assessments/project-form";
import { OralForm } from "@/components/assessments/oral-form";
import { QuestionData, CriteriaData } from "@/types";

interface Subject { id: string; name: string; code: string; }
interface Class { id: string; name: string; }

export default function NewAssessmentPage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "WRITTEN",
    subjectId: "",
    classId: "",
    duration: "",
    totalMarks: "100",
    passMark: "50",
    instructions: "",
    startTime: "",
    endTime: "",
    randomizeQuestions: false,
  });

  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [projectCriteria, setProjectCriteria] = useState<CriteriaData[]>([]);
  const [oralCriteria, setOralCriteria] = useState<CriteriaData[]>([]);

  useEffect(() => {
    fetch("/api/admin/subjects").then((r) => r.json()).then(setSubjects);
    fetch("/api/admin/classes").then((r) => r.json()).then(setClasses);
  }, []);

  async function handleSubmit(e: React.FormEvent | React.MouseEvent, status: "DRAFT" | "PUBLISHED") {
    e.preventDefault?.();
    setSaving(true);
    setError("");

    const payload = {
      ...form,
      type: form.type as any,
      duration: form.duration ? parseInt(form.duration) : null,
      totalMarks: parseInt(form.totalMarks),
      passMark: parseInt(form.passMark),
      classId: form.classId || null,
      startTime: form.startTime || null,
      endTime: form.endTime || null,
      status,
      questions: form.type === "WRITTEN" ? questions : [],
      projectCriteria: form.type === "PROJECT" ? projectCriteria : [],
      oralCriteria: form.type === "ORAL" ? oralCriteria : [],
    };

    const res = await fetch("/api/assessments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSaving(false);
    if (!res.ok) {
      const data = await res.json();
      setError(typeof data.error === "string" ? data.error : "Failed to create assessment");
      return;
    }

    const created = await res.json();
    router.push(`/teacher/assessments/${created.id}`);
  }

  return (
    <div className="page-container max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">New Assessment</h1>
        <p className="text-sm mt-1" style={{ color: "#6b7280" }}>Fill in the details to create a new assessment</p>
      </div>

      {error && (
        <div
          className="mb-4 p-3 rounded-lg text-sm"
          style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444" }}
        >
          {error}
        </div>
      )}

      <form className="space-y-6">
        {/* Basic info */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-white">Basic Information</h2>

          <div>
            <label className="form-label">Assessment Title *</label>
            <input
              className="form-input"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g., Mathematics Mid-Term Examination"
              required
            />
          </div>

          <div>
            <label className="form-label">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="form-textarea"
              rows={2}
              placeholder="Brief description..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Assessment Type *</label>
              <select
                className="form-select"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <option value="WRITTEN">Written (CBT)</option>
                <option value="PROJECT">Project-based</option>
                <option value="ORAL">Oral</option>
              </select>
            </div>
            <div>
              <label className="form-label">Subject *</label>
              <select
                className="form-select"
                value={form.subjectId}
                onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
                required
              >
                <option value="">Select subject...</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Class (optional)</label>
              <select
                className="form-select"
                value={form.classId}
                onChange={(e) => setForm({ ...form, classId: e.target.value })}
              >
                <option value="">All classes</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            {form.type === "WRITTEN" && (
              <div>
                <label className="form-label">Duration (minutes)</label>
                <input
                  type="number"
                  min={1}
                  className="form-input"
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: e.target.value })}
                  placeholder="60"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Total Marks</label>
              <input
                type="number"
                min={1}
                className="form-input"
                value={form.totalMarks}
                onChange={(e) => setForm({ ...form, totalMarks: e.target.value })}
              />
            </div>
            <div>
              <label className="form-label">Pass Mark</label>
              <input
                type="number"
                min={0}
                className="form-input"
                value={form.passMark}
                onChange={(e) => setForm({ ...form, passMark: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Start Time (optional)</label>
              <input
                type="datetime-local"
                className="form-input"
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
              />
            </div>
            <div>
              <label className="form-label">End Time (optional)</label>
              <input
                type="datetime-local"
                className="form-input"
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="form-label">Instructions</label>
            <textarea
              value={form.instructions}
              onChange={(e) => setForm({ ...form, instructions: e.target.value })}
              className="form-textarea"
              rows={3}
              placeholder="Instructions for students..."
            />
          </div>

          {form.type === "WRITTEN" && (
            <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: "#0f1117", border: "1px solid #2e3250" }}>
              <button
                type="button"
                onClick={() => setForm({ ...form, randomizeQuestions: !form.randomizeQuestions })}
                className="relative w-10 h-6 rounded-full transition-colors flex-shrink-0"
                style={{ background: form.randomizeQuestions ? "#1a56db" : "#2e3250" }}
              >
                <span
                  className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all"
                  style={{ left: form.randomizeQuestions ? "22px" : "4px" }}
                />
              </button>
              <div>
                <p className="text-sm font-medium text-white">Randomize Questions</p>
                <p className="text-xs" style={{ color: "#6b7280" }}>
                  Questions will appear in a different order for each student
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Type-specific form */}
        <div className="card">
          <h2 className="font-semibold text-white mb-4">
            {form.type === "WRITTEN" ? "Questions" : form.type === "PROJECT" ? "Project Rubric" : "Oral Criteria"}
          </h2>
          {form.type === "WRITTEN" && (
            <WrittenForm questions={questions} onChange={setQuestions} />
          )}
          {form.type === "PROJECT" && (
            <ProjectForm criteria={projectCriteria} onChange={setProjectCriteria} />
          )}
          {form.type === "ORAL" && (
            <OralForm criteria={oralCriteria} onChange={setOralCriteria} />
          )}
        </div>

        <div className="flex gap-3 justify-end">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => router.back()}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-secondary"
            disabled={saving}
            onClick={(e) => handleSubmit(e, "DRAFT")}
          >
            Save as Draft
          </button>
          <button
            type="button"
            className="btn-primary"
            disabled={saving}
            onClick={(e) => handleSubmit(e, "PUBLISHED")}
          >
            {saving ? "Publishing..." : "Publish Assessment"}
          </button>
        </div>
      </form>
    </div>
  );
}
