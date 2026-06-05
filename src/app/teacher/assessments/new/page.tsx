"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  });

  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [projectCriteria, setProjectCriteria] = useState<CriteriaData[]>([]);
  const [oralCriteria, setOralCriteria] = useState<CriteriaData[]>([]);

  useEffect(() => {
    fetch("/api/admin/subjects").then((r) => r.json()).then(setSubjects);
    fetch("/api/admin/classes").then((r) => r.json()).then(setClasses);
  }, []);

  async function handleSubmit(e: React.FormEvent, status: "DRAFT" | "PUBLISHED") {
    e.preventDefault();
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
        <h1 className="text-2xl font-bold text-gray-900">New Assessment</h1>
        <p className="text-gray-500 text-sm mt-1">Fill in the details to create a new assessment</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
      )}

      <form className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Basic Information</h2>

          <div>
            <label className="form-label">Assessment Title *</label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g., Mathematics Mid-Term Examination" required />
          </div>

          <div>
            <label className="form-label">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="form-textarea" rows={2} placeholder="Brief description..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Assessment Type *</label>
              <select className="form-select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="WRITTEN">Written (MCQ + Essay)</option>
                <option value="PROJECT">Project-based</option>
                <option value="ORAL">Oral</option>
              </select>
            </div>
            <div>
              <label className="form-label">Subject *</label>
              <select className="form-select" value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })} required>
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
              <select className="form-select" value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })}>
                <option value="">All classes</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            {form.type === "WRITTEN" && (
              <div>
                <label className="form-label">Duration (minutes)</label>
                <Input type="number" min={1} value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="60" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Total Marks</label>
              <Input type="number" min={1} value={form.totalMarks} onChange={(e) => setForm({ ...form, totalMarks: e.target.value })} />
            </div>
            <div>
              <label className="form-label">Pass Mark</label>
              <Input type="number" min={0} value={form.passMark} onChange={(e) => setForm({ ...form, passMark: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Start Time (optional)</label>
              <Input type="datetime-local" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
            </div>
            <div>
              <label className="form-label">End Time (optional)</label>
              <Input type="datetime-local" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
            </div>
          </div>

          <div>
            <label className="form-label">Instructions</label>
            <textarea value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} className="form-textarea" rows={3} placeholder="Instructions for students..." />
          </div>
        </div>

        {/* Type-specific form */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">
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
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="button" variant="secondary" disabled={saving} onClick={(e) => handleSubmit(e as any, "DRAFT")}>
            Save as Draft
          </Button>
          <Button type="button" disabled={saving} onClick={(e) => handleSubmit(e as any, "PUBLISHED")}>
            {saving ? "Publishing..." : "Publish Assessment"}
          </Button>
        </div>
      </form>
    </div>
  );
}
