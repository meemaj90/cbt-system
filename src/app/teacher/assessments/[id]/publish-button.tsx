"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function PublishButton({
  assessmentId,
  currentStatus,
}: {
  assessmentId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggleStatus() {
    setLoading(true);
    const newStatus =
      currentStatus === "DRAFT"
        ? "PUBLISHED"
        : currentStatus === "PUBLISHED"
          ? "ACTIVE"
          : currentStatus === "ACTIVE"
            ? "CLOSED"
            : "PUBLISHED";

    await fetch(`/api/assessments/${assessmentId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setLoading(false);
    router.refresh();
  }

  const label =
    currentStatus === "DRAFT"
      ? "Publish"
      : currentStatus === "PUBLISHED"
        ? "Set Active"
        : currentStatus === "ACTIVE"
          ? "Close"
          : "Re-publish";

  return (
    <Button variant="secondary" size="sm" onClick={toggleStatus} disabled={loading}>
      {loading ? "..." : label}
    </Button>
  );
}
