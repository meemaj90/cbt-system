import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function gradeCalculator(percentage: number): string {
  if (percentage >= 70) return "A";
  if (percentage >= 60) return "B";
  if (percentage >= 50) return "C";
  if (percentage >= 45) return "D";
  return "F";
}

export function formatDate(date: Date | string | null): string {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(date: Date | string | null): string {
  if (!date) return "N/A";
  return new Date(date).toLocaleString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getGradeColor(grade: string): string {
  switch (grade) {
    case "A":
      return "text-green-600";
    case "B":
      return "text-blue-600";
    case "C":
      return "text-yellow-600";
    case "D":
      return "text-orange-600";
    case "F":
      return "text-red-600";
    default:
      return "text-gray-600";
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "DRAFT":
      return "bg-gray-100 text-gray-800";
    case "PUBLISHED":
      return "bg-blue-100 text-blue-800";
    case "ACTIVE":
      return "bg-green-100 text-green-800";
    case "CLOSED":
      return "bg-red-100 text-red-800";
    case "IN_PROGRESS":
      return "bg-yellow-100 text-yellow-800";
    case "SUBMITTED":
      return "bg-blue-100 text-blue-800";
    case "GRADED":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}
