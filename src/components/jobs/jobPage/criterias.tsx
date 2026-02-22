import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { snakeCaseToTitle } from "@/utils/snakeCaseToTitle";
import type { Criteria } from "@/types/jobTypes";
import { normalizeCriteriaJsonb } from "@/utils/normalizeRubric";
import { Button } from "@/components/ui/button";

export default function Criterias({
  criterias,
  defaultCollapsed = true,
  sectionsOnly = false,
}: {
  criterias: Criteria;
  defaultCollapsed?: boolean;
  sectionsOnly?: boolean;
}) {
  const [expanded, setExpanded] = useState(!defaultCollapsed);
  const criteriaJsonb = normalizeCriteriaJsonb(criterias.criteria);

  const sections = (
    <>
      {criteriaJsonb.sections.map((section) => (
        <Card key={section.key}>
          <CardHeader>
            <CardTitle>{section.label}</CardTitle>
            <CardDescription>
              Total weight: {section.criteria.reduce((s, c) => s + (c.weight || 0), 0)}%
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {section.criteria.length > 0 && <Separator />}

            {section.criteria.map((c) => (
              <div key={c.name} className="rounded-lg border border-border p-4">
                <div className="text-xs text-muted-foreground">#{c.priority}</div>
                <div className="font-semibold">{c.display_name || snakeCaseToTitle(c.name)}</div>
                <div className="text-sm text-muted-foreground">
                  Weight: {c.weight}%
                  {c.value?.trim() ? ` • Constraint: ${c.value}` : ""}
                </div>

                {c.sub_criteria && c.sub_criteria.length > 0 && (
                  <div className="mt-3 pl-3 border-l space-y-2">
                    <div className="text-sm font-medium">Sub-criteria</div>
                    {c.sub_criteria.map((sc) => (
                      <div key={sc.name} className="text-sm text-muted-foreground">
                        {sc.display_name || snakeCaseToTitle(sc.name)} — {sc.weight}%
                        {sc.value?.trim() ? ` (${sc.value})` : ""}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {section.criteria.length === 0 && (
              <div className="text-sm text-muted-foreground">No criteria in this section.</div>
            )}
          </CardContent>
        </Card>
      ))}
    </>
  );

  if (sectionsOnly) {
    return <div className="space-y-6">{sections}</div>;
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      <Card className="border-2 border-primary/20 bg-linear-to-br from-primary/5 to-transparent">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle>Rubric</CardTitle>
            <CardDescription>View the active rubric criteria for this job.</CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? "Hide rubric" : "View rubric"}
          </Button>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">Threshold</div>
          <div className="text-3xl font-bold text-primary">{criterias.threshold_score}%</div>
        </CardContent>
      </Card>

      {expanded && sections}
    </div>
  );
}

