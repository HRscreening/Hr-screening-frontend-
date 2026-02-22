import type {
  CriterionV2,
  ExtractedJD,
  GateFinal,
  RRGFinal,
  RubricCriteriaJsonbV2,
  RubricSectionV2,
  SubCriterionV2,
} from "@/types/types";
import { snakeCaseToTitle, titleToSnakeCase } from "@/utils/snakeCaseToTitle";

function isRRGFinal(data: any): data is RRGFinal {
  return (
    data &&
    typeof data.metadata === "object" &&
    typeof data.requirements === "object" &&
    typeof data.context === "object" &&
    Array.isArray(data.requirements?.must_have)
  );
}

function isBasicJDAnalysis(data: any): boolean {
  return (
    data &&
    typeof data === "object" &&
    typeof data.job_data === "object" &&
    typeof data.domain === "string" &&
    typeof data.domain_confidence === "number" &&
    typeof data.raw_jd_text === "string" &&
    !Array.isArray(data.sections)
  );
}

/** Build ExtractedJD from backend rrg_final + raw_jd_text so create-job flow works */
function rrgFinalToExtractedJD(rrg: RRGFinal, rawJdText: string | null | undefined): ExtractedJD {
  const meta = rrg.metadata || {};
  const req = rrg.requirements || {};
  const roleFamily = meta.role_family?.value ?? "other";
  const seniority = meta.seniority?.value ?? "";
  const title = [seniority, roleFamily].filter(Boolean).map(snakeCaseToTitle).join(" ") || "Extracted Role";
  const responsibilities = (rrg.context?.responsibilities || []).map((r) => r.text).filter(Boolean);
  const description = responsibilities.length > 0 ? responsibilities.slice(0, 5).join(". ") : "Role extracted from job description.";

  const mandatoryCriteria: CriterionV2[] = [];
  let priority = 1;
  const gates = req.gates_final || [];
  for (const g of gates) {
    const name = (g.canonical || "requirement").replace(/\s+/g, "_").toLowerCase();
    mandatoryCriteria.push({
      name,
      display_name: snakeCaseToTitle(g.canonical || name),
      weight: Math.max(5, Math.min(45, Math.round((g.confidence || 0.5) * 40))),
      importance: 7, // Default high importance
      priority: priority++,
      value: null,
      value_type: "none",
      sub_criteria: null,
    });
  }
  for (const m of req.must_have || []) {
    const name = (m.canonical || "requirement").replace(/\s+/g, "_").toLowerCase();
    if (mandatoryCriteria.some((c) => c.name === name)) continue;
    mandatoryCriteria.push({
      name,
      display_name: snakeCaseToTitle(m.canonical || name),
      weight: Math.max(5, Math.min(45, Math.round((m.extraction_confidence ?? 0.5) * 40))),
      importance: 5,
      priority: priority++,
      value: null,
      value_type: "none",
      sub_criteria: null,
    });
  }
  const mandatoryWeightSum = mandatoryCriteria.reduce((s, c) => s + c.weight, 0);
  if (mandatoryCriteria.length > 0 && mandatoryWeightSum !== 100) {
    const scale = 100 / mandatoryWeightSum;
    mandatoryCriteria.forEach((c) => (c.weight = Math.round(c.weight * scale)));
  }

  const screeningCriteria: CriterionV2[] = [];
  let spri = 1;
  for (const n of req.nice_to_have || []) {
    const name = (n.canonical || "requirement").replace(/\s+/g, "_").toLowerCase();
    screeningCriteria.push({
      name,
      display_name: snakeCaseToTitle(n.canonical || name),
      weight: Math.max(5, Math.min(45, Math.round((n.extraction_confidence ?? 0.5) * 40))),
      importance: 3,
      priority: spri++,
      value: null,
      value_type: "none",
      sub_criteria: null,
    });
  }
  const screeningWeightSum = screeningCriteria.reduce((s, c) => s + c.weight, 0);
  if (screeningCriteria.length > 0 && screeningWeightSum !== 100) {
    const scale = 100 / screeningWeightSum;
    screeningCriteria.forEach((c) => (c.weight = Math.round(c.weight * scale)));
  }

  return {
    domain: roleFamily,
    domain_confidence: meta.role_family?.confidence ?? 0.5,
    job_data: {
      title,
      description,
      target_headcount: 1,
      location: null,
      salary: null,
    },
    threshold_score: 60,
    raw_jd_text: rawJdText ?? null,
    sections: [
      { key: "mandatory_criteria", label: "Must-Have Requirements", criteria: mandatoryCriteria },
      { key: "screening_criteria", label: "Preferred Qualifications", criteria: screeningCriteria },
    ],
    gates_final: req.gates_final as GateFinal[] | undefined,
    needs_review_count: req.needs_review_count,
    needs_clarification: meta.needs_clarification,
    _rrg: rrg,  // Keep raw RRG for viewer
  };
}

type LegacySubCriterion = { weight: number; value?: string | null };
type LegacyCriterion = {
  weight: number;
  value?: string | null;
  sub_criteria?: Record<string, LegacySubCriterion> | null;
};
type LegacyCriteria = {
  mandatory_criteria: Record<string, LegacyCriterion>;
  screening_criteria: Record<string, LegacyCriterion>;
};

function legacyCriterionToV2(name: string, c: LegacyCriterion, priority: number): CriterionV2 {
  const sub: SubCriterionV2[] | null =
    c.sub_criteria && Object.keys(c.sub_criteria).length > 0
      ? Object.entries(c.sub_criteria).map(([subName, subC]) => ({
        name: subName,
        display_name: snakeCaseToTitle(subName),
        weight: subC.weight ?? 0,
        importance: 3,
        value: subC.value ?? null,
        value_type: "none",
      }))
      : null;

  return {
    name,
    display_name: snakeCaseToTitle(name),
    weight: c.weight ?? 0,
    importance: Math.max(1, Math.min(10, Math.round((c.weight ?? 30) / 10))),
    priority,
    value: c.value ?? null,
    value_type: "none",
    sub_criteria: sub,
  };
}

export function normalizeExtractedJDResponse(data: any): ExtractedJD {
  // New pipeline: rrg_final (metadata + requirements + context)
  if (isRRGFinal(data)) {
    return rrgFinalToExtractedJD(data, (data as any).raw_jd_text);
  }

  // Step 1 upload: basic analysis only (no sections yet)
  if (isBasicJDAnalysis(data)) {
    return {
      domain: data.domain ?? "other",
      domain_confidence: typeof data.domain_confidence === "number" ? data.domain_confidence : 0.5,
      job_data: {
        ...(data.job_data || {}),
        target_headcount: data.job_data?.target_headcount ?? 1,
        location: data.job_data?.location ?? null,
        salary: data.job_data?.salary ?? null,
      },
      threshold_score: 60,
      raw_jd_text: data.raw_jd_text ?? null,
      sections: [],
    };
  }

  // Already v2 (sections array)
  if (data && Array.isArray(data.sections)) {
    return data as ExtractedJD;
  }

  // Legacy v1 from older backend
  const legacy: LegacyCriteria | undefined = data?.criteria;
  const mkSection = (
    key: RubricSectionV2["key"],
    label: string,
    dict: Record<string, LegacyCriterion> | undefined,
  ): RubricSectionV2 => {
    const entries = Object.entries(dict || {});
    const criteria = entries.map(([name, c], idx) => legacyCriterionToV2(name, c, idx + 1));
    return { key, label, criteria };
  };

  return {
    domain: data?.domain ?? "other",
    domain_confidence: typeof data?.domain_confidence === "number" ? data.domain_confidence : 0.5,
    job_data: data?.job_data,
    threshold_score: data?.threshold_score ?? 60,
    raw_jd_text: data?.raw_jd_text ?? null,
    sections: [
      mkSection("mandatory_criteria", "Must-Have Requirements", legacy?.mandatory_criteria),
      mkSection("screening_criteria", "Preferred Qualifications", legacy?.screening_criteria),
    ],
  };
}

export function normalizeCriteriaJsonb(criteria: any): RubricCriteriaJsonbV2 {
  if (criteria?.schema_version === 2 && Array.isArray(criteria.sections)) {
    return criteria as RubricCriteriaJsonbV2;
  }

  // If backend ever sends legacy shape here, convert
  const legacy: LegacyCriteria = criteria || { mandatory_criteria: {}, screening_criteria: {} };
  const extracted = normalizeExtractedJDResponse({ job_data: { title: "", description: "", target_headcount: 1 }, threshold_score: 0, criteria: legacy });
  return { schema_version: 2, sections: extracted.sections };
}

export function newCriterionFromName(nameRaw: string, priority: number): CriterionV2 {
  const name = titleToSnakeCase(nameRaw);
  return {
    name,
    display_name: snakeCaseToTitle(name),
    weight: 0,
    importance: 5,
    priority,
    value: null,
    sub_criteria: null,
  };
}

