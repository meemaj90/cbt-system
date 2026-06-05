"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
        <h3 className="text-sm font-medium text-gray-700">Oral Evaluation Criteria</h3>
        <Button type="button" variant="secondary" size="sm" onClick={addCriteria}>
          + Add Criteria
        </Button>
      </div>

      {criteria.length === 0 && (
        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 text-gray-500 text-sm">
          Add evaluation criteria for this oral assessment
        </div>
      )}

      {criteria.map((c, idx) => (
        <div key={idx} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">Criteria {idx + 1}</span>
            <button
              type="button"
              onClick={() => removeCriteria(idx)}
              className="text-red-500 hover:text-red-700 text-sm"
            >
              Remove
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="form-label">Criteria Name</label>
              <Input
                value={c.name}
                onChange={(e) => update(idx, "name", e.target.value)}
                placeholder="e.g., Content & Knowledge"
                required
              />
            </div>
            <div>
              <label className="form-label">Max Marks</label>
              <Input
                type="number"
                min={1}
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
        <div className="text-sm text-gray-600 font-medium">
          Total Criteria: {criteria.length} | Total Marks:{" "}
          {criteria.reduce((sum, c) => sum + c.maxMarks, 0)}
        </div>
      )}
    </div>
  );
}
