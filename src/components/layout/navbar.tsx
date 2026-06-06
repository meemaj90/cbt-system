"use client";
import { signOut } from "next-auth/react";
import Link from "next/link";

export function Navbar({ user }: { user: any }) {
  return (
    <header style={{ background: "#1a1d27", borderBottom: "1px solid #2e3250" }} className="h-16 flex items-center px-6 gap-4">
      <Link href="/" className="flex items-center gap-3 mr-auto">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-lg" style={{ background: "linear-gradient(135deg, #1a56db, #ff6b00)" }}>N</div>
        <div>
          <p className="font-bold text-white text-sm leading-tight">Nextora Academy</p>
          <p className="text-xs" style={{ color: "#6b7280" }}>CBT System</p>
        </div>
      </Link>
      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-white">{user.name}</p>
          <p className="text-xs" style={{ color: "#6b7280" }}>{user.role}</p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg transition-colors"
          style={{ color: "#a0a8c0" }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="hidden sm:block">Logout</span>
        </button>
      </div>
    </header>
  );
}
