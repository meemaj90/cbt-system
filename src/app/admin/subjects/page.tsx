"use client";

import { useState, useEffect } from "react";

interface Subject {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  _count?: { assessments: number };
}

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", code: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchSubjects();
  }, []);

  async function fetchSubjects() {
    setLoading(true);
    const res = await fetch("/api/admin/subjects");
    if (res.ok) setSubjects(await res.json());
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/admin/subjects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) {
      setError("Failed to create subject");
      return;
    }
    setForm({ name: "", code: "", description: "" });
    setShowForm(false);
    fetchSubjects();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this subject?")) return;
    await fetch(`/api/admin/subjects?id=${id}`, { method: "DELETE" });
    fetchSubjects();
  }

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Subjects</h1>
          <p className="text-sm mt-1" style={{ color: "#6b7280" }}>{subjects.length} subject{subjects.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? "Cancel" : "+ Add Subject"}
        </button>
      </div>

      {showForm && (
        <div className="card mb-6">
          <h2 className="font-semibold text-white mb-4">Add Subject</h2>
          {error && (
            <div
              className="mb-4 p-3 rounded-lg text-sm"
              style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444" }}
            >
              {error}
            </div>
          )}
          <form onSubmit={handleCreate} className="grid grid-cols-3 gap-4">
            <div>
              <label className="form-label">Subject Name</label>
              <input
                className="form-input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                placeholder="e.g., Mathematics"
              />
            </div>
            <div>
              <label className="form-label">Code</label>
              <input
                className="form-input"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                required
                placeholder="e.g., MATH"
              />
            </div>
            <div>
              <label className="form-label">Description</label>
              <input
                className="form-input"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Optional"
              />
            </div>
            <div className="col-span-3 flex gap-2">
              <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
                {saving ? "Saving..." : "Add Subject"}
              </button>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="px-6 py-8 text-center text-sm" style={{ color: "#6b7280" }}>Loading...</div>
        ) : (
          <div>
            {subjects.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm" style={{ color: "#6b7280" }}>No subjects yet.</p>
            ) : (
              subjects.map((s) => (
                <div key={s.id} className="px-6 py-4 border-b last:border-0 flex items-center justify-between" style={{ borderColor: "#2e3250" }}>
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-sm font-bold px-2 py-0.5 rounded"
                        style={{ background: "rgba(26,86,219,0.15)", color: "#3b82f6" }}
                      >
                        {s.code}
                      </span>
                      <span className="font-medium text-white">{s.name}</span>
                    </div>
                    {s.description && (
                      <p className="text-sm mt-0.5" style={{ color: "#6b7280" }}>{s.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm" style={{ color: "#6b7280" }}>
                      {s._count?.assessments ?? 0} assessments
                    </span>
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="text-sm"
                      style={{ color: "#ef4444" }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
