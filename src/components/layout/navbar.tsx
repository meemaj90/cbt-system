"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";

interface NavbarProps {
  user: {
    name?: string | null;
    email?: string | null;
    role?: string;
  };
}

export function Navbar({ user }: NavbarProps) {
  const roleLabel = user.role === "ADMIN" ? "Admin" : user.role === "TEACHER" ? "Teacher" : "Student";
  const roleColor =
    user.role === "ADMIN"
      ? "bg-purple-100 text-purple-800"
      : user.role === "TEACHER"
        ? "bg-blue-100 text-blue-800"
        : "bg-green-100 text-green-800";

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center px-6 gap-4">
      <Link href="/" className="flex items-center gap-2 mr-auto">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
        </div>
        <span className="font-bold text-gray-900 hidden sm:block">Nextora Academy</span>
      </Link>

      <div className="flex items-center gap-3">
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${roleColor}`}>
          {roleLabel}
        </span>
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-gray-900">{user.name}</p>
          <p className="text-xs text-gray-500">{user.email}</p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-red-600 transition-colors ml-2 px-3 py-1.5 rounded-lg hover:bg-red-50"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          <span className="hidden sm:block">Logout</span>
        </button>
      </div>
    </header>
  );
}
