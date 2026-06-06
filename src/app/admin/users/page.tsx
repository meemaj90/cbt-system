"use client";

import { useState, useEffect } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  studentId?: string | null;
  class?: { name: string } | null;
  createdAt: string;
}

interface ClassOption {
  id: string;
  name: string;
}

const roleStyle: Record<string, React.CSSProperties> = {
  ADMIN: { background: "rgba(139,92,246,0.15)", color: "#a78bfa" },
  TEACHER: { background: "rgba(26,86,219,0.15)", color: "#3b82f6" },
  STUDENT: { background: "rgba(16,185,129,0.15)", color: "#10b981" },
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "STUDENT",
    studentId: "",
    classId: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchUsers();
    fetchClasses();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    const res = await fetch("/api/users");
    if (res.ok) setUsers(await res.json());
    setLoading(false);
  }

  async function fetchClasses() {
    const res = await fetch("/api/admin/classes");
    if (res.ok) setClasses(await res.json());
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        studentId: form.studentId || null,
        classId: form.classId || null,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to create user");
      return;
    }
    setForm({ name: "", email: "", password: "", role: "STUDENT", studentId: "", classId: "" });
    setShowForm(false);
    fetchUsers();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this user? This cannot be undone.")) return;
    await fetch(`/api/users?id=${id}`, { method: "DELETE" });
    fetchUsers();
  }

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(filter.toLowerCase()) ||
      u.email.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">User Management</h1>
          <p className="text-sm mt-1" style={{ color: "#6b7280" }}>{users.length} total users</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? "Cancel" : "+ Add User"}
        </button>
      </div>

      {showForm && (
        <div className="card mb-6">
          <h2 className="font-semibold text-white mb-4">Create New User</h2>
          {error && (
            <div
              className="mb-4 p-3 rounded-lg text-sm"
              style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444" }}
            >
              {error}
            </div>
          )}
          <form onSubmit={handleCreate} className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Full Name</label>
              <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="form-label">Email</label>
              <input type="email" className="form-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <label className="form-label">Password</label>
              <input type="password" className="form-input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
            </div>
            <div>
              <label className="form-label">Role</label>
              <select className="form-select" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="STUDENT">Student</option>
                <option value="TEACHER">Teacher</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            {form.role === "STUDENT" && (
              <>
                <div>
                  <label className="form-label">Student ID</label>
                  <input className="form-input" value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} placeholder="e.g., NXT006" />
                </div>
                <div>
                  <label className="form-label">Class</label>
                  <select className="form-select" value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })}>
                    <option value="">Select class...</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </>
            )}
            <div className="col-span-2 flex gap-2">
              <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
                {saving ? "Creating..." : "Create User"}
              </button>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b" style={{ borderColor: "#2e3250" }}>
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search users..."
            className="form-input max-w-sm"
          />
        </div>

        {loading ? (
          <div className="px-6 py-8 text-center text-sm" style={{ color: "#6b7280" }}>Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead style={{ background: "#0f1117" }}>
                <tr>
                  {["Name", "Email", "Role", "Student ID", "Class", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase" style={{ color: "#6b7280" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} className="border-t" style={{ borderColor: "#2e3250" }}>
                    <td className="px-4 py-3 text-sm font-medium text-white">{u.name}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: "#a0a8c0" }}>{u.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={roleStyle[u.role] ?? { color: "#6b7280" }}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: "#6b7280" }}>{u.studentId ?? "-"}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: "#6b7280" }}>{u.class?.name ?? "-"}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDelete(u.id)}
                        className="text-sm font-medium"
                        style={{ color: "#ef4444" }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
