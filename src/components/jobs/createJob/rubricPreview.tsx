import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronUp, Target } from "lucide-react";
import type { ExtractedJD } from "@/types/types";

// unused

export default function RubricPreview({ extractedJD }: { extractedJD: ExtractedJD }) {
  const [open, setOpen] = useState(true);

  const sections = useMemo(
    () => [...(extractedJD.sections || [])],
    [extractedJD.sections],
  );

  // Totals removed

  return (
    <Card className="border-2 border-primary/20 bg-linear-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              AI Rubric Preview
            </CardTitle>
            <CardDescription>
              Generated groups + weighted requirements. You can edit everything in the next step.
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setOpen((v) => !v)} className="gap-2">
            {open ? (
              <>
                Hide <ChevronUp className="w-4 h-4" />
              </>
            ) : (
              <>
                View <ChevronDown className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          <div>
            Domain:{" "}
            <Badge variant="secondary" className="text-sm">
              {extractedJD.domain || "other"}
            </Badge>{" "}
            <span className="text-muted-foreground">
              ({Math.round((extractedJD.domain_confidence || 0) * 100)}% confidence)
            </span>
          </div>
          <div className="text-muted-foreground">•</div>
          <div>
            Threshold: <span className="font-semibold">{extractedJD.threshold_score}%</span>
          </div>
        </div>
      </CardHeader>

      {open && (
        <CardContent className="space-y-4">
          {sections.map((section) => (
            <div key={section.key} className="rounded-lg border border-border/60 bg-background/60 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold">{section.label}</div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-semibold text-primary`}>
                    Variable
                  </div>
                  <div className="text-xs text-muted-foreground">Dynamic weights</div>
                </div>
              </div>

              <div className="mt-3 space-y-2">
                {(section.criteria || []).map((c) => (
                  <div key={c.name} className="rounded-md border border-border/60 bg-muted/10 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium truncate">{c.display_name}</div>
                        {c.value?.trim() ? (
                          <div className="text-xs text-muted-foreground mt-1">
                            Constraint: <span className="font-medium">{c.value}</span>
                          </div>
                        ) : null}
                        {Array.isArray(c.sub_criteria) && c.sub_criteria.length > 0 ? (
                          <div className="text-xs text-muted-foreground mt-1">
                            {c.sub_criteria.length} requirement(s) in this group
                          </div>
                        ) : null}
                      </div>
                      <Badge variant="outline" className="shrink-0 bg-primary/10">
                        Lv {c.importance ?? 5}/10
                      </Badge>
                    </div>

                    {Array.isArray(c.sub_criteria) && c.sub_criteria.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {c.sub_criteria.slice(0, 6).map((sc) => (
                          <div key={sc.name} className="flex items-start justify-between gap-3 text-xs">
                            <div className="text-muted-foreground min-w-0 truncate">
                              {sc.display_name}
                              {sc.value?.trim() ? ` (${sc.value})` : ""}
                            </div>
                            <div className="font-medium text-muted-foreground shrink-0 border rounded px-1 text-[10px]">Lv {sc.importance ?? 3}/5</div>
                          </div>
                        ))}
                        {c.sub_criteria.length > 6 && (
                          <div className="text-xs text-muted-foreground">…and {c.sub_criteria.length - 6} more</div>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {(section.criteria || []).length === 0 && (
                  <div className="text-sm text-muted-foreground">No criteria generated for this section.</div>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      )}
    </Card>
  );
}

