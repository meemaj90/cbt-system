"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-500 text-sm mt-1">{users.length} total users</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "+ Add User"}
        </Button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Create New User</h2>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
          <form onSubmit={handleCreate} className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Full Name</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="form-label">Email</label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <label className="form-label">Password</label>
              <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
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
                  <Input value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} placeholder="e.g., NXT006" />
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
              <Button type="submit" disabled={saving}>
                {saving ? "Creating..." : "Create User"}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <Input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search users..."
            className="max-w-sm"
          />
        </div>

        {loading ? (
          <div className="px-6 py-8 text-center text-gray-500">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{u.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        u.role === "ADMIN" ? "bg-purple-100 text-purple-800" :
                        u.role === "TEACHER" ? "bg-blue-100 text-blue-800" :
                        "bg-green-100 text-green-800"
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{u.studentId ?? "-"}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{u.class?.name ?? "-"}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDelete(u.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
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
