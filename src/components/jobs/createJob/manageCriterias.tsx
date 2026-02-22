import React, { forwardRef, useImperativeHandle, useMemo, useState } from "react";
import { toast } from "sonner";
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  ArrowDown,
  ArrowUp,
  GripVertical,
  Plus,
  Trash2,
  Target,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import type { CriterionV2, ExtractedJD, RubricSectionV2, SubCriterionV2 } from "@/types/types";
import { newCriterionFromName } from "@/utils/normalizeRubric";
import { snakeCaseToTitle, titleToSnakeCase } from "@/utils/snakeCaseToTitle";
import { applyImportanceToSections } from "@/utils/computeWeightsFromImportance";

interface CriteriaManagerProps {
  extractedJD: ExtractedJD;
  onUpdate: (updatedJD: ExtractedJD) => void;
  onNext?: () => void;
}

function clampInt(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.round(n)));
}

function normalizePriorities(criteria: CriterionV2[]): CriterionV2[] {
  return criteria.map((c, idx) => ({ ...c, priority: idx + 1 }));
}

function ensureSections(sections: RubricSectionV2[]): RubricSectionV2[] {
  if (!sections?.length) {
    return [{ key: "requirements", label: "Requirements", criteria: [] }];
  }
  return sections.map((s) => ({
    ...s,
    criteria: s.criteria ?? [],
  }));
}

const TIER_COLORS = {
  10: "bg-red-500",
  9: "bg-red-400",
  8: "bg-orange-500",
  7: "bg-orange-400",
  6: "bg-amber-500",
  5: "bg-amber-400",
  4: "bg-yellow-500",
  3: "bg-yellow-400",
  2: "bg-blue-400",
  1: "bg-slate-400",
} as Record<number, string>;

function TierBadge({ importance, maxImp }: { importance: number; maxImp: number }) {
  const color = TIER_COLORS[Math.round((importance / maxImp) * 10)] || "bg-primary";
  let label = "Normal";
  if (maxImp === 10) {
    if (importance >= 9) label = "Critical";
    else if (importance >= 7) label = "Highly Expected";
    else if (importance >= 4) label = "Good to Have";
    else label = "Bonus";
  } else {
    if (importance === 5) label = "Critical";
    else if (importance === 4) label = "Important";
    else if (importance >= 2) label = "Normal";
    else label = "Bonus";
  }

  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-xs font-medium text-muted-foreground">{label} ({importance}/{maxImp})</span>
    </div>
  );
}

// ─── Compact sub-criterion editor row ────────────────────────────────────────
const SubCriteriaEditor: React.FC<{
  subCriteria: SubCriterionV2[] | null;
  onChange: (sub: SubCriterionV2[] | null) => void;
}> = ({ subCriteria, onChange }) => {
  const [newName, setNewName] = useState("");
  const list = subCriteria ?? [];

  const add = () => {
    if (!newName.trim()) { toast.error("Enter sub-criterion name"); return; }
    const name = titleToSnakeCase(newName);
    if (list.some((s) => s.name === name)) { toast.error("Sub-criterion already exists"); return; }
    onChange([...list, { name, display_name: snakeCaseToTitle(name), weight: 0, importance: 3, value: null }]);
    setNewName("");
  };

  const update = (idx: number, updated: SubCriterionV2) => {
    const next = [...list]; next[idx] = updated;
    onChange(next.length ? next : null);
  };

  const del = (idx: number) => {
    const next = list.filter((_, i) => i !== idx);
    onChange(next.length ? next : null);
  };

  return (
    <div className="mt-3 space-y-2">
      {/* Header row */}
      {list.length > 0 && (
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Specific Requirements ({list.length})
        </span>
      )}

      {/* Existing sub-criteria */}
      {list.length > 0 && (
        <div className="space-y-2 mt-2">
          {list.map((s, idx) => (
            <div key={s.name} className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg bg-muted/30 border border-border/50 px-3 py-2">
              {/* Name & Constraint */}
              <div className="flex-1 space-y-1">
                <Input
                  value={s.display_name}
                  onChange={(e) => update(idx, { ...s, display_name: e.target.value })}
                  className="h-7 text-sm bg-transparent border-0 shadow-none px-0 font-medium focus-visible:ring-0"
                  placeholder="Requirement Name"
                />
                <Input
                  value={s.value ?? ""}
                  onChange={(e) => update(idx, { ...s, value: e.target.value || null })}
                  placeholder="e.g. 5+ years, CS degree (Optional)"
                  className="h-6 text-xs text-muted-foreground bg-transparent border-0 shadow-none px-0 focus-visible:ring-0"
                />
              </div>

              {/* Importance Selector 1-5 */}
              <div className="flex items-center gap-2 shrink-0 bg-background rounded-md border p-1">
                {[1, 2, 3, 4, 5].map(tier => (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => update(idx, { ...s, importance: tier })}
                    className={`w-6 h-6 rounded flex items-center justify-center text-xs font-medium transition-all ${(s.importance ?? 3) === tier
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "hover:bg-muted text-muted-foreground"
                      }`}
                  >
                    {tier}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => del(idx)}
                className="h-8 w-8 flex items-center justify-center rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add new sub-criterion */}
      <div className="flex gap-2 pt-1">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder="Add specific detail/requirement..."
          className="h-8 text-sm"
        />
        <Button type="button" variant="secondary" size="sm" onClick={add} className="gap-1 h-8 shrink-0">
          <Plus className="w-3.5 h-3.5" />
          Add
        </Button>
      </div>
    </div>
  );
};

// ─── Main criterion row ──────────────────────────────────────────────────────
const SortableCriterionRow: React.FC<{
  criterion: CriterionV2;
  index: number;
  total: number;
  showPriority: boolean;
  onChange: (updated: CriterionV2) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}> = ({ criterion, index, total, showPriority, onChange, onDelete, onMoveUp, onMoveDown }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: criterion.name });
  const [showSubs, setShowSubs] = useState(false);

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const hasSubs = Array.isArray(criterion.sub_criteria) && criterion.sub_criteria.length > 0;
  const imp = criterion.importance ?? 5;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-xl border border-border bg-card transition-all mb-3"
    >
      {/* ── Top bar: drag + name + controls ── */}
      <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 px-3 py-3">
        {/* Drag handle */}
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="text-muted-foreground/40 hover:text-muted-foreground cursor-grab active:cursor-grabbing shrink-0"
          title="Drag to reorder"
        >
          <GripVertical className="w-4 h-4" />
        </button>

        {/* Priority badge */}
        {showPriority && (
          <span className="text-[11px] font-mono text-muted-foreground/60 shrink-0 w-5 text-center">
            #{criterion.priority}
          </span>
        )}

        {/* Name & Constraint input container */}
        <div className="flex-1 min-w-[200px] flex flex-col gap-1">
          <Input
            value={criterion.display_name || snakeCaseToTitle(criterion.name)}
            onChange={(e) => onChange({ ...criterion, display_name: e.target.value })}
            className="h-7 font-semibold text-sm bg-transparent border-0 shadow-none px-1 focus-visible:ring-0 focus-visible:border-b focus-visible:border-primary/50 rounded-none w-full"
            placeholder="Skill or Category Name"
          />
          <Input
            value={criterion.value ?? ""}
            onChange={(e) => onChange({ ...criterion, value: e.target.value || null })}
            placeholder="Constraint (e.g. 5+ years, Bachelor's in CS) - Optional"
            className="h-6 text-xs text-muted-foreground bg-transparent border-0 shadow-none px-1 focus-visible:ring-0 w-full"
          />
        </div>

        {/* Tier badge / visual weight indicator */}
        <div className="flex flex-col items-end gap-1 shrink-0 px-2 min-w-[120px]">
          <TierBadge importance={imp} maxImp={10} />
          {criterion.weight > 0 && (
            <span className="text-[10px] text-muted-foreground">≈ {criterion.weight}% impact</span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button" onClick={onMoveUp} disabled={index === 0}
            className="h-8 w-8 flex items-center justify-center rounded hover:bg-accent disabled:opacity-30 transition-colors"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
          <button
            type="button" onClick={onMoveDown} disabled={index === total - 1}
            className="h-8 w-8 flex items-center justify-center rounded hover:bg-accent disabled:opacity-30 transition-colors"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setShowSubs(!showSubs)}
            className={`h-8 w-8 flex items-center justify-center rounded transition-colors ${showSubs ? 'bg-primary/10 text-primary' : 'hover:bg-accent text-muted-foreground'}`}
            title={showSubs ? "Close details" : "Add/Edit specific requirements"}
          >
            {showSubs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button
            type="button" onClick={onDelete}
            className="h-8 w-8 flex items-center justify-center rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors ml-1"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Importance Slider (1-10) ── */}
      <div className="px-4 pb-4 flex items-center gap-4">
        <span className="text-xs font-semibold text-muted-foreground w-12 text-right">0</span>
        <Slider
          value={[imp]}
          onValueChange={(v) => onChange({ ...criterion, importance: clampInt(v[0], 1, 10) })}
          min={1} max={10} step={1}
          className="flex-1 cursor-pointer"
        />
        <span className="text-xs font-semibold text-muted-foreground w-12 text-left">10</span>
      </div>

      {/* ── Sub-criteria panel ── */}
      {(showSubs || hasSubs) && (
        <div className="px-4 pb-4 bg-muted/10 border-t border-border/50 rounded-b-xl">
          <SubCriteriaEditor
            subCriteria={criterion.sub_criteria ?? null}
            onChange={(sub) => onChange({ ...criterion, sub_criteria: sub })}
          />
        </div>
      )}
    </div>
  );
};

// ─── Add criterion input row ─────────────────────────────────────────────────
const AddCriterionRow: React.FC<{ onAdd: (name: string) => void }> = ({ onAdd }) => {
  const [name, setName] = useState("");
  return (
    <div className="flex gap-2">
      <Input
        placeholder="Add a new skill or category (e.g., Communication Skills)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onAdd(name); setName(""); } }}
        className="h-10"
      />
      <Button
        type="button"
        onClick={() => { onAdd(name); setName(""); }}
        className="gap-2 h-10 shrink-0"
      >
        <Plus className="w-4 h-4" />
        Add
      </Button>
    </div>
  );
};

// ─── Main CriteriaManager ────────────────────────────────────────────────────
const CriteriaManager = forwardRef(function CriteriaManager(
  { extractedJD, onUpdate, onNext }: CriteriaManagerProps,
  ref,
) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  // Automatically apply computed normalization weights for UI display purposes
  const computedJDSections = useMemo(() => applyImportanceToSections(ensureSections(extractedJD.sections || [])), [extractedJD.sections]);

  const updateSection = (key: string, updater: (s: RubricSectionV2) => RubricSectionV2) => {
    const current = ensureSections(extractedJD.sections || []);
    const next = current.map((s) => (s.key === key ? updater(s) : s));
    onUpdate({ ...extractedJD, sections: next });
  };

  const addCriterion = (key: string, nameRaw: string) => {
    const name = titleToSnakeCase(nameRaw);
    if (!name) { toast.error("Enter a criterion name"); return; }
    updateSection(key, (s) => {
      if (s.criteria.some((c) => c.name === name)) { toast.error("This criterion already exists"); return s; }
      const next = [...s.criteria, { ...newCriterionFromName(nameRaw, s.criteria.length + 1) }];
      return { ...s, criteria: normalizePriorities(next) };
    });
  };

  const handleThresholdChange = (value: number[]) => {
    onUpdate({ ...extractedJD, threshold_score: clampInt(value[0], 0, 100) });
  };

  const handleSubmit = () => {
    // Only validation: ensure at least one criterion exists across all sections
    const totalCriteria = computedJDSections.reduce((sum, s) => sum + s.criteria.length, 0);
    if (totalCriteria === 0) {
      toast.error("Please add at least one criterion before continuing.");
      return;
    }

    // Save with the computed weights
    onUpdate({ ...extractedJD, sections: computedJDSections });
    onNext?.();
  };

  useImperativeHandle(ref, () => ({ submit: handleSubmit }));

  return (
    <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight">Set Job Rubric</h2>
        <p className="text-sm text-muted-foreground">
          Define what's important for this role. Rate each skill precisely from 1 to 10. Our AI handles the grading scale automatically.
        </p>
      </div>

      {/* ── Threshold card ── */}
      <Card className="border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="w-4 h-4 text-primary" />
              Minimum Passing Score
            </CardTitle>
            <span className="text-3xl font-bold text-primary tabular-nums">{extractedJD.threshold_score}%</span>
          </div>
        </CardHeader>
        <div className="px-6 pb-4">
          <Slider
            value={[extractedJD.threshold_score]}
            onValueChange={handleThresholdChange}
            min={0} max={100} step={1}
            className="cursor-pointer"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Candidates scoring above this overall percentage advance to the next stage.
          </p>
        </div>
      </Card>

      {/* ── Sections ── */}
      <div className="space-y-6">
        {computedJDSections.map((section) => {
          const hasCriteria = section.criteria.length > 0;

          return (
            <Card key={section.key} className="border border-border overflow-hidden">
              {/* Section header */}
              <div className="bg-muted/30 px-5 py-4 border-b">
                <h3 className="text-lg font-semibold">{section.label}</h3>
              </div>

              <CardContent className="p-5 space-y-4">
                {/* Add criterion */}
                <AddCriterionRow onAdd={(name) => addCriterion(section.key, name)} />

                {hasCriteria && <div className="pt-2" />}

                {/* DnD criterion list */}
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(event) => {
                    const { active, over } = event;
                    if (!over || active.id === over.id) return;
                    updateSection(section.key, (s) => {
                      const oldIndex = s.criteria.findIndex((c) => c.name === active.id);
                      const newIndex = s.criteria.findIndex((c) => c.name === over.id);
                      if (oldIndex < 0 || newIndex < 0) return s;
                      const moved = arrayMove(s.criteria, oldIndex, newIndex);
                      return { ...s, criteria: normalizePriorities(moved) };
                    });
                  }}
                >
                  <SortableContext items={section.criteria.map((c) => c.name)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-1">
                      {section.criteria.map((c, idx) => (
                        <SortableCriterionRow
                          key={c.name}
                          criterion={c}
                          index={idx}
                          total={section.criteria.length}
                          showPriority={section.criteria.length > 1}
                          onChange={(updated) =>
                            updateSection(section.key, (s) => {
                              const next = [...s.criteria]; next[idx] = updated;
                              return { ...s, criteria: normalizePriorities(next) };
                            })
                          }
                          onDelete={() =>
                            updateSection(section.key, (s) => ({
                              ...s,
                              criteria: normalizePriorities(s.criteria.filter((x) => x.name !== c.name)),
                            }))
                          }
                          onMoveUp={() =>
                            updateSection(section.key, (s) => {
                              if (idx === 0) return s;
                              const next = [...s.criteria];
                              [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
                              return { ...s, criteria: normalizePriorities(next) };
                            })
                          }
                          onMoveDown={() =>
                            updateSection(section.key, (s) => {
                              if (idx >= s.criteria.length - 1) return s;
                              const next = [...s.criteria];
                              [next[idx + 1], next[idx]] = [next[idx], next[idx + 1]];
                              return { ...s, criteria: normalizePriorities(next) };
                            })
                          }
                        />
                      ))}

                      {section.criteria.length === 0 && (
                        <div className="text-center py-10 text-muted-foreground border border-dashed rounded-xl bg-muted/10">
                          <p className="text-sm font-medium">No criteria added yet</p>
                          <p className="text-xs mt-1">Add groups above to define what you're looking for</p>
                        </div>
                      )}
                    </div>
                  </SortableContext>
                </DndContext>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
});

export default CriteriaManager;