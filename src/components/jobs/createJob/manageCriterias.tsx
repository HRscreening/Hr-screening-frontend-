import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GripVertical, Plus, Trash2, Target, ChevronDown, ChevronUp } from "lucide-react";

import type { CriterionV2, ExtractedJD, NonNegotiable, RubricSectionV2, SubCriterionV2 } from "@/types/types";
import { newCriterionFromName } from "@/utils/normalizeRubric";
import { snakeCaseToTitle, titleToSnakeCase } from "@/utils/snakeCaseToTitle";
import { applyImportanceToSections } from "@/utils/computeWeightsFromImportance";

interface CriteriaManagerProps {
  extractedJD: ExtractedJD;
  onUpdate: (updatedJD: ExtractedJD) => void;
  onNext?: () => void;
}

// ─── Nordic design tokens ─────────────────────────────────────────────────────
const N = {
  page:          "#EEF2F7",
  card:          "#FFFFFF",
  border:        "#D5DCE8",
  rowHover:      "#F4F7FB",
  sectionBg:     "#E6EDF6",
  sectionBorder: "#C5D0E0",
  sectionText:   "#1E3A5F",
  sectionSub:    "#6B849E",
  nameText:      "#0D2137",
  tierBg:        "#EBF2FB",
  tierBorder:    "#BDD0E8",
  tierText:      "#2C5282",
  colLabel:      "#93AABF",
  sliderAccent:  "#2563EB",
  barTrack:      "#D5DCE8",
  barFill:       "#2563EB",
  weightText:    "#1E3A5F",
  footerBg:      "#E6EDF6",
  pillBg:        "#DBEAFE",
  pillText:      "#1E3A5F",
  pillBorder:    "#BDD0E8",
};

// Per-section left-border accent — all within the Nordic blue family
const SECTION_ACCENT: Record<string, string> = {
  required_qualifications:  "#1E3A5F",
  technical_skills:         "#2563EB",
  soft_skills:              "#3B82F6",
  preferred_qualifications: "#93C5FD",
};
function sectionAccent(key: string): string {
  return SECTION_ACCENT[key] ?? "#6B849E";
}

// Tier derived from importance value
function getTier(imp: number): { label: string; dot: string } {
  if (imp >= 9) return { label: "Must-Have", dot: "#1E3A5F" };
  if (imp >= 7) return { label: "Core",      dot: "#2563EB" };
  if (imp >= 5) return { label: "Important", dot: "#60A5FA" };
  return              { label: "Supporting", dot: "#93C5FD" };
}

function clampInt(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.round(n)));
}
function normalizePriorities(criteria: CriterionV2[]): CriterionV2[] {
  return criteria.map((c, idx) => ({ ...c, priority: idx + 1 }));
}
function ensureSections(sections: RubricSectionV2[]): RubricSectionV2[] {
  if (!sections?.length) return [{ key: "requirements", label: "Requirements", criteria: [] }];
  return sections.map((s) => ({ ...s, criteria: s.criteria ?? [] }));
}

// ─── Importance slider (1–10) ─────────────────────────────────────────────────
function ImportanceSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const tier = getTier(value);
  return (
    <div className="flex items-center gap-3 flex-1">
      <span style={{ fontSize: 11, color: N.sectionSub, flexShrink: 0 }}>Importance</span>
      <input
        type="range"
        min={1}
        max={10}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ flex: 1, height: 3, accentColor: N.sliderAccent, cursor: "pointer" }}
      />
      <span style={{
        fontSize: 11, fontWeight: 700, color: N.sectionSub,
        width: 14, textAlign: "center", flexShrink: 0,
      }}>
        {value}
      </span>
      {/* Tier badge */}
      <span style={{
        fontSize: 10, fontWeight: 500,
        padding: "2px 8px",
        background: N.tierBg,
        border: `1px solid ${N.tierBorder}`,
        borderRadius: 10,
        color: N.tierText,
        display: "inline-flex", alignItems: "center", gap: 5,
        flexShrink: 0,
        whiteSpace: "nowrap",
      }}>
        <span style={{ width: 5, height: 5, borderRadius: "50%", background: tier.dot, flexShrink: 0 }} />
        {tier.label}
      </span>
    </div>
  );
}

// ─── Sub-criterion editor ─────────────────────────────────────────────────────
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
    <div style={{ marginTop: 12, borderTop: `1px solid ${N.border}`, paddingTop: 12 }}>
      <p style={{ fontSize: 10, fontWeight: 600, color: N.sectionSub, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
        Specific Requirements {list.length > 0 && `(${list.length})`}
      </p>

      {list.map((s, idx) => (
        <div key={s.name} style={{
          display: "flex", alignItems: "center", gap: 8,
          background: N.sectionBg, border: `1px solid ${N.sectionBorder}`,
          borderRadius: 8, padding: "6px 10px", marginBottom: 6,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Input
              value={s.display_name}
              onChange={(e) => update(idx, { ...s, display_name: e.target.value })}
              className="h-7 text-sm bg-transparent border-0 shadow-none px-0 font-medium focus-visible:ring-0"
              placeholder="Requirement name"
            />
          </div>
          <button
            type="button"
            onClick={() => del(idx)}
            style={{ color: N.colLabel, background: "none", border: "none", cursor: "pointer", padding: 2, borderRadius: 4 }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#EF4444")}
            onMouseLeave={(e) => (e.currentTarget.style.color = N.colLabel)}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}

      <div className="flex gap-2">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder="Add specific requirement..."
          className="h-8 text-sm"
          style={{ borderColor: N.border }}
        />
        <Button type="button" variant="secondary" size="sm" onClick={add} className="gap-1 h-8 shrink-0"
          style={{ background: N.sectionBg, borderColor: N.sectionBorder, color: N.sectionText }}>
          <Plus className="w-3.5 h-3.5" /> Add
        </Button>
      </div>
    </div>
  );
};

// ─── Criterion card ───────────────────────────────────────────────────────────
const SortableCriterionRow: React.FC<{
  criterion: CriterionV2;
  sectionKey: string;
  maxWeight: number;
  onChange: (updated: CriterionV2) => void;
  onDelete: () => void;
}> = ({ criterion, sectionKey, maxWeight, onChange, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: criterion.name });
  const [showSubs, setShowSubs] = useState(false);
  const [hovered, setHovered] = useState(false);

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const accent = sectionAccent(sectionKey);
  const hasSubs = Array.isArray(criterion.sub_criteria) && criterion.sub_criteria.length > 0;
  const barPct = maxWeight > 0 ? (criterion.weight / maxWeight) * 100 : 0;

  return (
    <div ref={setNodeRef} style={style}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: N.card,
          border: `1px solid ${N.border}`,
          borderLeft: `3px solid ${hovered ? accent : N.border}`,
          borderRadius: showSubs ? "10px 10px 0 0" : 10,
          marginBottom: showSubs ? 0 : 6,
          transition: "border-color 0.12s",
        }}
      >
        {/* Top row: handle · name · weight · actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px 8px" }}>
          <button
            type="button"
            {...attributes}
            {...listeners}
            style={{ color: N.colLabel, background: "none", border: "none", cursor: "grab", flexShrink: 0, padding: 0 }}
          >
            <GripVertical className="w-4 h-4" />
          </button>

          {/* Name input */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <Input
              value={criterion.display_name || snakeCaseToTitle(criterion.name)}
              onChange={(e) => onChange({ ...criterion, display_name: e.target.value })}
              className="h-7 font-semibold text-sm bg-transparent border-0 shadow-none px-0 focus-visible:ring-0 focus-visible:border-b rounded-none"
              style={{ color: N.nameText }}
              placeholder="Skill or category name"
            />
          </div>

          {/* Weight % + mini bar stacked */}
          {criterion.weight > 0 && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3, flexShrink: 0 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: N.weightText, lineHeight: 1 }}>
                {criterion.weight}%
              </span>
              <div style={{ width: 44, height: 3, background: N.barTrack, borderRadius: 2, overflow: "hidden" }}>
                <div style={{
                  width: `${barPct}%`, height: "100%",
                  background: N.barFill, borderRadius: 2,
                  transition: "width 0.25s ease",
                }} />
              </div>
            </div>
          )}

          {/* Sub-criteria toggle + delete */}
          <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => setShowSubs(!showSubs)}
              style={{
                width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center",
                background: showSubs ? N.pillBg : "none",
                border: `1px solid ${showSubs ? N.pillBorder : "transparent"}`,
                borderRadius: 6, cursor: "pointer",
                color: showSubs ? N.pillText : N.colLabel,
                transition: "all 0.12s",
              }}
              title={hasSubs ? `Sub-criteria (${criterion.sub_criteria?.length ?? 0})` : "Sub-criteria"}
            >
              {showSubs ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {hasSubs && (
              <span style={{
                fontSize: 9, fontWeight: 700,
                color: N.pillText, background: N.pillBg,
                border: `1px solid ${N.pillBorder}`,
                padding: "1px 5px", borderRadius: 8,
              }}>
                {criterion.sub_criteria?.length ?? 0}
              </span>
            )}

            <button
              type="button"
              onClick={onDelete}
              style={{ width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", color: N.colLabel, borderRadius: 6, transition: "color 0.12s" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#EF4444")}
              onMouseLeave={(e) => (e.currentTarget.style.color = N.colLabel)}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Importance slider row */}
        <div style={{ padding: "0 12px 10px", display: "flex", alignItems: "center", gap: 8 }}>
          <ImportanceSlider
            value={criterion.importance ?? 5}
            onChange={(v) => onChange({ ...criterion, importance: v })}
          />
        </div>
      </div>

      {/* Sub-criteria panel — attached below */}
      {showSubs && (
        <div style={{
          border: `1px solid ${N.border}`,
          borderTop: "none",
          borderRadius: "0 0 10px 10px",
          padding: "0 12px 12px",
          background: "#F7FAFD",
          marginBottom: 6,
        }}>
          <SubCriteriaEditor
            subCriteria={criterion.sub_criteria ?? null}
            onChange={(sub) => onChange({ ...criterion, sub_criteria: sub })}
          />
        </div>
      )}
    </div>
  );
};

// ─── Duplicate detection (unchanged logic) ────────────────────────────────────
const AMBIGUOUS_WORDS = new Set([
  "and","or","with","the","for","of","to","in","a","an",
  "required","preferred","qualification","qualifications",
  "experience","expertise","skill","skills","background","professional",
]);

function toComparableLabel(c: CriterionV2): string {
  return (c.display_name || snakeCaseToTitle(c.name) || "").trim().toLowerCase();
}
function tokenSet(text: string): Set<string> {
  return new Set(
    text.replace(/[^a-z0-9\s]/g, " ").split(/\s+/)
      .map((t) => t.trim()).filter((t) => t.length > 1 && !AMBIGUOUS_WORDS.has(t)),
  );
}
function isAmbiguousDuplicate(a: string, b: string): boolean {
  if (!a || !b) return false;
  if (a === b) return true;
  const aT = tokenSet(a); const bT = tokenSet(b);
  if (!aT.size || !bT.size) return false;
  let overlap = 0;
  for (const t of aT) if (bT.has(t)) overlap++;
  return overlap >= 2 && overlap / Math.min(aT.size, bT.size) >= 0.8;
}
function dedupeCriteriaAcrossSections(sections: RubricSectionV2[]): RubricSectionV2[] {
  const seen: string[] = [];
  return sections.map((section) => {
    const criteria: CriterionV2[] = [];
    for (const c of section.criteria ?? []) {
      const label = toComparableLabel(c);
      if (seen.some((s) => isAmbiguousDuplicate(label, s))) continue;
      seen.push(label);
      const subSeen = new Set<string>();
      const cleanedSub = (c.sub_criteria ?? [])
        .filter((s) => { const k = (s.display_name || s.name || "").trim().toLowerCase(); if (!k || subSeen.has(k)) return false; subSeen.add(k); return true; })
        .map((s) => ({ ...s, value: null }));
      criteria.push({ ...c, value: null, sub_criteria: cleanedSub.length ? cleanedSub : null });
    }
    return { ...section, criteria: normalizePriorities(criteria) };
  });
}

// ─── Main CriteriaManager ─────────────────────────────────────────────────────
const CriteriaManager = forwardRef(function CriteriaManager(
  { extractedJD, onUpdate, onNext }: CriteriaManagerProps,
  ref,
) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const lastDedupedCountRef = useRef(0);

  const normalizedSections = useMemo(() => {
    return dedupeCriteriaAcrossSections(ensureSections(extractedJD.sections || []));
  }, [extractedJD.sections]);

  const computedJDSections = useMemo(
    () => applyImportanceToSections(normalizedSections),
    [normalizedSections],
  );

  useEffect(() => {
    const current = JSON.stringify(ensureSections(extractedJD.sections || []));
    const normalized = JSON.stringify(normalizedSections);
    if (current !== normalized) {
      const before = ensureSections(extractedJD.sections || []).reduce((s, sec) => s + (sec.criteria?.length ?? 0), 0);
      const after  = normalizedSections.reduce((s, sec) => s + (sec.criteria?.length ?? 0), 0);
      const removed = Math.max(0, before - after);
      if (removed > 0 && removed !== lastDedupedCountRef.current) {
        toast.message(`${removed} overlapping rubric criterion removed for clarity`);
        lastDedupedCountRef.current = removed;
      }
      onUpdate({ ...extractedJD, sections: normalizedSections });
    }
  }, [normalizedSections, extractedJD, onUpdate]);

  const updateSection = (key: string, updater: (s: RubricSectionV2) => RubricSectionV2) => {
    const next = ensureSections(extractedJD.sections || []).map((s) => s.key === key ? updater(s) : s);
    onUpdate({ ...extractedJD, sections: next });
  };

  const addCriterion = (key: string, nameRaw: string) => {
    const name = titleToSnakeCase(nameRaw);
    if (!name) { toast.error("Enter a criterion name"); return; }
    updateSection(key, (s) => {
      const global = ensureSections(extractedJD.sections || []).flatMap((sec) => sec.criteria ?? []);
      if (global.some((c) => isAmbiguousDuplicate(nameRaw.trim().toLowerCase(), toComparableLabel(c)))) {
        toast.error("Similar criterion already exists in another section");
        return s;
      }
      return { ...s, criteria: normalizePriorities([...s.criteria, newCriterionFromName(nameRaw, s.criteria.length + 1)]) };
    });
  };

  const handleSubmit = () => {
    if (computedJDSections.reduce((s, sec) => s + sec.criteria.length, 0) === 0) {
      toast.error("Add at least one criterion before continuing.");
      return;
    }
    onUpdate({ ...extractedJD, sections: computedJDSections });
    onNext?.();
  };

  useImperativeHandle(ref, () => ({ submit: handleSubmit }));

  const totalCriteria = computedJDSections.reduce((s, sec) => s + sec.criteria.length, 0);
  const totalPct      = computedJDSections.flatMap((s) => s.criteria).reduce((s, c) => s + (c.weight ?? 0), 0);
  const maxWeight     = Math.max(...computedJDSections.flatMap((s) => s.criteria).map((c) => c.weight ?? 0), 1);

  return (
    <div style={{ background: N.page, minHeight: "100%" }}>
      <div className="w-full max-w-3xl mx-auto p-4 sm:p-6 space-y-5">

        {/* Header */}
        <div className="space-y-1">
          <h2 style={{ fontSize: 18, fontWeight: 700, color: N.nameText, margin: 0, letterSpacing: "-0.01em" }}>
            Set Job Rubric
          </h2>
          <p style={{ fontSize: 13, color: N.sectionSub, margin: 0 }}>
            Define what matters for this role. Each criterion's importance determines its share of the overall score.
          </p>
        </div>

        {/* Non-Negotiables */}
        {(() => {
          // Rubric pipeline returns non_negotiables; RRG pipeline returns gates_final
          const fromRubric: NonNegotiable[] = extractedJD.non_negotiables ?? [];
          const fromRRG = extractedJD.gates_final ?? [];
          const hasRubricNonNegs = fromRubric.length > 0;
          const hasGates = fromRRG.length > 0;
          if (!hasRubricNonNegs && !hasGates) return null;

          return (
            <div style={{
              background: "#FFF8F6",
              border: `1px solid #FECDCA`,
              borderLeft: `3px solid #F04438`,
              borderRadius: 10,
              padding: "14px 16px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#B42318" }}>Non-Negotiables</span>
                <span style={{
                  fontSize: 10, fontWeight: 600,
                  padding: "1px 7px", borderRadius: 8,
                  background: "#FEE4E2", color: "#912018",
                  border: `1px solid #FECDCA`,
                }}>
                  {hasRubricNonNegs ? fromRubric.length : fromRRG.length} hard requirement{(hasRubricNonNegs ? fromRubric.length : fromRRG.length) > 1 ? "s" : ""}
                </span>
              </div>
              <p style={{ fontSize: 11, color: "#912018", marginBottom: 10, opacity: 0.8 }}>
                Candidates must meet all of these to proceed — they are not scored, they screen out candidates who don't qualify.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>

                {/* Rubric-pipeline format */}
                {hasRubricNonNegs && fromRubric.map((nn, idx) => (
                  <div key={idx} style={{
                    background: "#FFFFFF",
                    border: `1px solid #FECDCA`,
                    borderRadius: 8,
                    padding: "8px 12px",
                    display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8,
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#B42318" }}>{nn.display_name}</span>
                      <p style={{ fontSize: 11, color: "#912018", marginTop: 2 }}>{nn.requirement}</p>
                      {nn.verification_question && (
                        <p style={{ fontSize: 10, color: "#912018", marginTop: 2, opacity: 0.7, fontStyle: "italic" }}>
                          ✓ {nn.verification_question}
                        </p>
                      )}
                    </div>
                    <span style={{
                      fontSize: 10, fontWeight: 500,
                      padding: "2px 6px", borderRadius: 8,
                      background: "#FEE4E2", color: "#912018",
                      border: `1px solid #FECDCA`,
                      textTransform: "capitalize",
                      flexShrink: 0,
                    }}>
                      {nn.category.replace(/_/g, " ")}
                    </span>
                  </div>
                ))}

                {/* RRG-pipeline format (gates_final) */}
                {!hasRubricNonNegs && hasGates && fromRRG.map((gate, idx) => (
                  <div key={idx} style={{
                    background: "#FFFFFF",
                    border: `1px solid #FECDCA`,
                    borderRadius: 8,
                    padding: "8px 12px",
                    display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8,
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#B42318" }}>{gate.canonical}</span>
                      {gate.evidence_span && (
                        <p style={{ fontSize: 11, color: "#912018", marginTop: 2, opacity: 0.7, fontStyle: "italic" }}>
                          "{gate.evidence_span}"
                        </p>
                      )}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
                      <span style={{
                        fontSize: 10, fontWeight: 500,
                        padding: "2px 6px", borderRadius: 8,
                        background: "#FEE4E2", color: "#912018",
                        border: `1px solid #FECDCA`,
                        textTransform: "capitalize",
                      }}>
                        {gate.policy_reason.replace(/_/g, " ")}
                      </span>
                      <span style={{
                        fontSize: 10, fontWeight: 600,
                        padding: "2px 6px", borderRadius: 8,
                        background: gate.confidence >= 0.8 ? "#DCFCE7" : "#FEF9C3",
                        color: gate.confidence >= 0.8 ? "#166534" : "#854D0E",
                        border: `1px solid ${gate.confidence >= 0.8 ? "#BBF7D0" : "#FEF08A"}`,
                      }}>
                        {Math.round(gate.confidence * 100)}% confidence
                      </span>
                      {gate.needs_review && (
                        <span style={{
                          fontSize: 10, fontWeight: 600,
                          padding: "2px 6px", borderRadius: 8,
                          background: "#FEF9C3", color: "#854D0E",
                          border: `1px solid #FEF08A`,
                        }}>
                          Needs review
                        </span>
                      )}
                    </div>
                  </div>
                ))}

              </div>
            </div>
          );
        })()}

        {/* Threshold card */}
        <div style={{
          background: N.card,
          border: `1px solid ${N.sectionBorder}`,
          borderLeft: `3px solid ${N.sliderAccent}`,
          borderRadius: 10,
          padding: "14px 16px",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Target style={{ width: 16, height: 16, color: N.sliderAccent }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: N.sectionText }}>Minimum Passing Score</span>
            </div>
            <span style={{ fontSize: 22, fontWeight: 700, color: N.sliderAccent, fontVariantNumeric: "tabular-nums" }}>
              {extractedJD.threshold_score}%
            </span>
          </div>
          <Slider
            value={[extractedJD.threshold_score]}
            onValueChange={(v) => onUpdate({ ...extractedJD, threshold_score: clampInt(v[0], 0, 100) })}
            min={0} max={100} step={1}
            className="cursor-pointer"
          />
          <p style={{ fontSize: 11, color: N.sectionSub, marginTop: 8 }}>
            Candidates above this score advance to the next stage.
          </p>
        </div>

        {/* Weight summary row */}
        {totalCriteria > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 2px" }}>
            <span style={{ fontSize: 11, color: N.colLabel }}>
              {totalCriteria} criteria · importance weights shown as %
            </span>
            <span style={{
              fontSize: 11, fontWeight: 600,
              padding: "3px 10px", borderRadius: 12,
              background: N.pillBg, color: N.pillText, border: `1px solid ${N.pillBorder}`,
            }}>
              {totalPct}% assigned
            </span>
          </div>
        )}

        {/* Sections */}
        {computedJDSections.map((section) => {
          const accent = sectionAccent(section.key);
          return (
            <div key={section.key} className="space-y-2">
              {/* Section header */}
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "7px 12px",
                background: N.sectionBg,
                border: `1px solid ${N.sectionBorder}`,
                borderLeft: `3px solid ${accent}`,
                borderRadius: 8,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: N.sectionText, letterSpacing: "0.01em" }}>
                    {section.label}
                  </span>
                  <span style={{
                    fontSize: 10, color: N.sectionSub,
                    background: N.card, border: `1px solid ${N.sectionBorder}`,
                    padding: "0 6px", borderRadius: 8,
                  }}>
                    {section.criteria.length} criteria
                  </span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: N.weightText }}>
                  {section.criteria.reduce((s, c) => s + (c.weight ?? 0), 0)}%
                </span>
              </div>

              {/* DnD criterion list */}
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={(event) => {
                  const { active, over } = event;
                  if (!over || active.id === over.id) return;
                  updateSection(section.key, (s) => {
                    const oldIdx = s.criteria.findIndex((c) => c.name === active.id);
                    const newIdx = s.criteria.findIndex((c) => c.name === over.id);
                    if (oldIdx < 0 || newIdx < 0) return s;
                    return { ...s, criteria: normalizePriorities(arrayMove(s.criteria, oldIdx, newIdx)) };
                  });
                }}
              >
                <SortableContext items={section.criteria.map((c) => c.name)} strategy={verticalListSortingStrategy}>
                  {section.criteria.map((c, idx) => (
                    <SortableCriterionRow
                      key={c.name}
                      criterion={c}
                      sectionKey={section.key}
                      maxWeight={maxWeight}
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
                    />
                  ))}

                  {section.criteria.length === 0 && (
                    <div style={{
                      textAlign: "center", padding: "28px 0",
                      border: `1.5px dashed ${N.sectionBorder}`,
                      borderRadius: 10, color: N.colLabel,
                      background: N.sectionBg, fontSize: 13,
                    }}>
                      No criteria yet — use the Add criterion panel below
                    </div>
                  )}
                </SortableContext>
              </DndContext>
            </div>
          );
        })}

        {/* Add criterion */}
        <div style={{
          background: N.card,
          border: `1px solid ${N.border}`,
          borderRadius: 10,
          padding: "14px 16px",
        }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: N.sectionText, marginBottom: 10 }}>Add criterion</p>
          <GlobalAddCriterionRow sections={computedJDSections} onAdd={addCriterion} />
        </div>

      </div>
    </div>
  );
});

export default CriteriaManager;

// ─── Add criterion row ────────────────────────────────────────────────────────
const GlobalAddCriterionRow: React.FC<{
  sections: RubricSectionV2[];
  onAdd: (sectionKey: string, name: string) => void;
}> = ({ sections, onAdd }) => {
  const [name, setName] = useState("");
  const [sectionKey, setSectionKey] = useState<string>(sections[0]?.key ?? "requirements");

  useEffect(() => {
    if (!sections.find((s) => s.key === sectionKey)) setSectionKey(sections[0]?.key ?? "requirements");
  }, [sections, sectionKey]);

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) { toast.error("Enter a criterion name"); return; }
    onAdd(sectionKey, trimmed);
    setName("");
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <Select value={sectionKey} onValueChange={setSectionKey}>
        <SelectTrigger className="sm:w-56" style={{ borderColor: N.border, color: N.sectionText }}>
          <SelectValue placeholder="Select section" />
        </SelectTrigger>
        <SelectContent>
          {sections.map((s) => (
            <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        placeholder="Add criterion e.g. Communication Skills, Python"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submit(); } }}
        className="h-9"
        style={{ borderColor: N.border }}
      />
      <Button
        type="button"
        onClick={submit}
        className="gap-1.5 h-9 shrink-0"
        style={{ background: N.sliderAccent, color: "#fff" } as React.CSSProperties}
      >
        <Plus className="w-4 h-4" /> Add
      </Button>
    </div>
  );
};
