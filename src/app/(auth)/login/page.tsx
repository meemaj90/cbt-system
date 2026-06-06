"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password. Please try again.");
      return;
    }

    const res = await fetch("/api/auth/session");
    const session = await res.json();
    const role = session?.user?.role;

    if (role === "ADMIN") router.push("/admin");
    else if (role === "TEACHER") router.push("/teacher");
    else if (role === "STUDENT") router.push("/student");
    else router.push("/");
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "linear-gradient(135deg, #0f1117 0%, #1a1d27 50%, #0f1117 100%)" }}
    >
      <div className="w-full max-w-md">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 text-white font-black text-2xl"
            style={{ background: "linear-gradient(135deg, #1a56db, #ff6b00)" }}
          >
            N
          </div>
          <h1 className="text-2xl font-bold text-white">Nextora Academy</h1>
          <p className="text-sm mt-1" style={{ color: "#6b7280" }}>Computer-Based Testing System</p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border p-8" style={{ background: "#1e2235", borderColor: "#2e3250" }}>
          <h2 className="text-xl font-semibold text-white mb-6">Sign in to your account</h2>

          {error && (
            <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="form-label">Email address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                placeholder="you@nextora.edu"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="form-label">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-2.5 text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>

        {/* Demo credentials */}
        <div className="mt-6 p-4 rounded-xl text-sm" style={{ background: "rgba(26,86,219,0.08)", border: "1px solid rgba(26,86,219,0.2)" }}>
          <p className="font-semibold mb-2" style={{ color: "#3b82f6" }}>Demo Accounts</p>
          <div className="space-y-1" style={{ color: "#a0a8c0" }}>
            <p>Admin: admin@nextora.edu / admin123</p>
            <p>Teacher: teacher1@nextora.edu / teacher123</p>
            <p>Student: chidi@nextora.edu / student123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
