import type { CriterionV2, SubCriterionV2, RubricSectionV2 } from "@/types/types";

export function computeWeightsFromImportance(items: CriterionV2[], maxImp: number): CriterionV2[];
export function computeWeightsFromImportance(items: SubCriterionV2[], maxImp: number): SubCriterionV2[];
export function computeWeightsFromImportance(items: any[], maxImp: number = 10): any[] {
    if (!items || items.length === 0) return items;

    const totalImp = items.reduce((sum, item) => sum + (item.importance ?? (Math.floor(maxImp / 2) || 1)), 0);

    if (totalImp === 0) {
        const equalWeight = Math.floor(100 / items.length);
        const remainder = 100 - (equalWeight * items.length);
        return items.map((item, i) => ({
            ...item,
            weight: equalWeight + (i < remainder ? 1 : 0),
        }));
    }

    const factor = 100.0 / totalImp;
    const newWeights = items.map(item => Math.round((item.importance ?? (Math.floor(maxImp / 2) || 1)) * factor));

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

export function applyImportanceToSections(sections: RubricSectionV2[]): RubricSectionV2[] {
    return sections.map(section => {
        const criteriaWithSubWeights = section.criteria.map(c => {
            if (c.sub_criteria && c.sub_criteria.length > 0) {
                return { ...c, sub_criteria: computeWeightsFromImportance(c.sub_criteria, 5) };
            }
            return c;
        });
        return {
            ...section,
            criteria: computeWeightsFromImportance(criteriaWithSubWeights, 10),
        };
    });
}
