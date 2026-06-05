"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
          <h1 className="text-2xl font-bold text-gray-900">Subjects</h1>
          <p className="text-gray-500 text-sm mt-1">{subjects.length} subjects</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "+ Add Subject"}
        </Button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Add Subject</h2>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
          )}
          <form onSubmit={handleCreate} className="grid grid-cols-3 gap-4">
            <div>
              <label className="form-label">Subject Name</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="e.g., Mathematics" />
            </div>
            <div>
              <label className="form-label">Code</label>
              <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} required placeholder="e.g., MATH" />
            </div>
            <div>
              <label className="form-label">Description</label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional" />
            </div>
            <div className="col-span-3 flex gap-2">
              <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Add Subject"}</Button>
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200">
        {loading ? (
          <div className="px-6 py-8 text-center text-gray-500">Loading...</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {subjects.length === 0 ? (
              <p className="px-6 py-8 text-center text-gray-500 text-sm">No subjects yet.</p>
            ) : (
              subjects.map((s) => (
                <div key={s.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">{s.code}</span>
                      <span className="font-medium text-gray-900">{s.name}</span>
                    </div>
                    {s.description && <p className="text-sm text-gray-500 mt-0.5">{s.description}</p>}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500">{s._count?.assessments ?? 0} assessments</span>
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
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
