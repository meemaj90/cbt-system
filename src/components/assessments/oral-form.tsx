"use client";

import { CriteriaData } from "@/types";

interface OralFormProps {
  criteria: CriteriaData[];
  onChange: (criteria: CriteriaData[]) => void;
}

export function OralForm({ criteria, onChange }: OralFormProps) {
  function addCriteria() {
    onChange([...criteria, { name: "", description: "", maxMarks: 10 }]);
  }
  function removeCriteria(idx: number) {
    onChange(criteria.filter((_, i) => i !== idx));
  }
  function update(idx: number, field: keyof CriteriaData, value: any) {
    onChange(criteria.map((c, i) => (i === idx ? { ...c, [field]: value } : c)));
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium" style={{ color: "#a0a8c0" }}>Oral Evaluation Criteria</h3>
        <button type="button" className="btn-secondary text-xs px-3 py-1.5" onClick={addCriteria}>
          + Add Criteria
        </button>
      </div>

      {criteria.length === 0 && (
        <div
          className="text-center py-8 rounded-xl border-2 border-dashed text-sm"
          style={{ borderColor: "#2e3250", color: "#6b7280" }}
        >
          Add evaluation criteria for this oral assessment
        </div>
      )}

      {criteria.map((c, idx) => (
        <div key={idx} className="rounded-xl border p-4" style={{ background: "#1e2235", borderColor: "#2e3250" }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium" style={{ color: "#a0a8c0" }}>Criteria {idx + 1}</span>
            <button
              type="button"
              onClick={() => removeCriteria(idx)}
              className="text-xs px-2 py-1 rounded"
              style={{ color: "#ef4444", background: "rgba(239,68,68,0.1)" }}
            >
              Remove
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="form-label">Criteria Name</label>
              <input
                className="form-input"
                value={c.name}
                onChange={(e) => update(idx, "name", e.target.value)}
                placeholder="e.g., Content & Knowledge"
                required
              />
            </div>
            <div>
              <label className="form-label">Max Marks</label>
              <input
                type="number"
                min={1}
                className="form-input"
                value={c.maxMarks}
                onChange={(e) => update(idx, "maxMarks", parseInt(e.target.value) || 1)}
              />
            </div>
            <div className="col-span-3">
              <label className="form-label">Description (optional)</label>
              <textarea
                value={c.description ?? ""}
                onChange={(e) => update(idx, "description", e.target.value)}
                className="form-textarea"
                rows={2}
                placeholder="What to evaluate for this criteria..."
              />
            </div>
          </div>
        </div>
      ))}

      {criteria.length > 0 && (
        <div className="flex items-center gap-4 text-sm" style={{ color: "#a0a8c0" }}>
          <span>Total Criteria: <strong style={{ color: "#fff" }}>{criteria.length}</strong></span>
          <span>Total Marks: <strong style={{ color: "#fff" }}>{criteria.reduce((sum, c) => sum + c.maxMarks, 0)}</strong></span>
        </div>
      )}
    </div>
  );
}
