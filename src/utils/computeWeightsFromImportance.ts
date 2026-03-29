import type { CriterionV2, SubCriterionV2, RubricSectionV2 } from "@/types/types";

/**
 * Compute sub-criteria weights from their importance values (1-5 scale).
 * Sub-criteria are display-only; their weights sum to 100 within each criterion.
 */
export function computeSubCriteriaWeights(items: SubCriterionV2[]): SubCriterionV2[] {
    if (!items || items.length === 0) return items;

    const totalImp = items.reduce((sum, item) => sum + (item.importance ?? 3), 0);

    if (totalImp === 0) {
        const equalWeight = Math.floor(100 / items.length);
        const remainder = 100 - equalWeight * items.length;
        return items.map((item, i) => ({
            ...item,
            weight: equalWeight + (i < remainder ? 1 : 0),
        }));
    }

    const factor = 100.0 / totalImp;
    const newWeights = items.map(item => Math.round((item.importance ?? 3) * factor));

    const diff = 100 - newWeights.reduce((a, b) => a + b, 0);
    if (diff !== 0) {
        const maxIdx = newWeights.indexOf(Math.max(...newWeights));
        newWeights[maxIdx] += diff;
    }

    return items.map((item, i) => ({
        ...item,
        weight: Math.max(0, newWeights[i]),
    }));
}

/**
 * Apply flat global importance weighting across all sections.
 *
 * Flat model:
 * - Sections have NO weight (UI grouping only).
 * - Each criterion's 'weight' = its global % of the overall score,
 *   computed by normalising importance (1-10) across ALL criteria across ALL sections.
 * - Sub-criteria get per-criterion weights (display only).
 */
export function applyImportanceToSections(sections: RubricSectionV2[]): RubricSectionV2[] {
    if (!sections || sections.length === 0) return sections;

    // Collect all criteria across sections to compute total importance globally
    const allCriteria: CriterionV2[] = sections.flatMap(s => s.criteria ?? []);
    const totalImp = allCriteria.reduce((sum, c) => sum + (c.importance ?? 5), 0);

    // Compute global weight for each criterion
    let globalWeights: number[];
    if (totalImp === 0 || allCriteria.length === 0) {
        const eq = Math.floor(100 / Math.max(allCriteria.length, 1));
        const rem = 100 - eq * allCriteria.length;
        globalWeights = allCriteria.map((_, i) => eq + (i < rem ? 1 : 0));
    } else {
        const factor = 100.0 / totalImp;
        globalWeights = allCriteria.map(c => Math.round((c.importance ?? 5) * factor));
        const diff = 100 - globalWeights.reduce((a, b) => a + b, 0);
        if (diff !== 0) {
            const maxIdx = globalWeights.indexOf(Math.max(...globalWeights));
            globalWeights[maxIdx] += diff;
        }
    }

    // Write global weights back into sections, removing section-level weight
    let criterionIdx = 0;
    return sections.map(section => ({
        ...section,
        weight: undefined,  // sections have no weight in the flat model
        criteria: (section.criteria ?? []).map(c => {
            const globalWeight = Math.max(0, globalWeights[criterionIdx++]);
            const updatedSubs = c.sub_criteria && c.sub_criteria.length > 0
                ? computeSubCriteriaWeights(c.sub_criteria)
                : c.sub_criteria;
            return { ...c, weight: globalWeight, sub_criteria: updatedSubs };
        }),
    }));
}
