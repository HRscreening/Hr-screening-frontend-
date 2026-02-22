import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, Briefcase, CheckCircle, FileText, Lock, MapPin, Target } from 'lucide-react';
import type { RRGFinal } from '@/types/types';

interface ParsedJdViewerProps {
  parsedJd: RRGFinal;
}

export default function ParsedJdViewer({ parsedJd }: ParsedJdViewerProps) {
  const { metadata, requirements, context } = parsedJd;
  const gates = requirements.gates_final || [];
  const needsReviewCount = requirements.needs_review_count || 0;
  const needsClarification = metadata.needs_clarification || false;

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">Parsed Job Description</h2>
        <p className="text-muted-foreground">
          Review the extracted information from your job description
        </p>
      </div>

      {/* Warnings/Alerts */}
      {(needsClarification || needsReviewCount > 0) && (
        <Card className="border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              Review Required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {needsClarification && (
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>Years of experience or role type may need clarification</span>
              </div>
            )}
            {needsReviewCount > 0 && (
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>{needsReviewCount} requirement(s) have low confidence and need review</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Panel A: Metadata */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            Job Metadata
          </CardTitle>
          <CardDescription>High-level information extracted from the JD</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Role Family */}
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Role Family</div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-sm">
                  {metadata.role_family?.value || 'Unknown'}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {Math.round((metadata.role_family?.confidence || 0) * 100)}% confidence
                </span>
              </div>
              {metadata.role_family?.evidence_span && (
                <div className="text-xs text-muted-foreground mt-1 italic">
                  "{metadata.role_family.evidence_span}"
                </div>
              )}
            </div>

            {/* Seniority */}
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Seniority</div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-sm">
                  {metadata.seniority?.value || 'Unknown'}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {Math.round((metadata.seniority?.confidence || 0) * 100)}% confidence
                </span>
              </div>
              {metadata.seniority?.evidence_span && (
                <div className="text-xs text-muted-foreground mt-1 italic">
                  "{metadata.seniority.evidence_span}"
                </div>
              )}
            </div>

            {/* Role Type */}
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Role Type</div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-sm">
                  {metadata.role_type || 'Unknown'}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {Math.round((metadata.role_type_confidence || 0) * 100)}% confidence
                </span>
              </div>
            </div>

            {/* Years Experience */}
            {metadata.years_experience_candidates && metadata.years_experience_candidates.length > 0 && (
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Years of Experience</div>
                {metadata.years_experience_candidates.map((yec, idx) => (
                  <div key={idx} className="flex items-center gap-2 mb-1">
                    <Badge className="text-sm">{yec.value} years</Badge>
                    <span className="text-xs text-muted-foreground">
                      {Math.round(yec.confidence * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Education */}
          {metadata.education_requirements && metadata.education_requirements.length > 0 && (
            <>
              <Separator />
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-2">Education Requirements</div>
                <div className="space-y-2">
                  {metadata.education_requirements.map((edu: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <div>
                        <span className="font-medium capitalize">{edu.degree}</span>
                        {edu.field && <span className="text-muted-foreground"> in {edu.field}</span>}
                        {edu.required && <Badge variant="destructive" className="ml-2 text-xs">Required</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Panel B: Requirements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Requirements
          </CardTitle>
          <CardDescription>Must-haves and nice-to-haves from the JD</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Must Have */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-sm font-semibold">Must-Have Requirements</h3>
              <Badge variant="destructive" className="text-xs">
                {requirements.must_have?.length || 0}
              </Badge>
            </div>
            <div className="space-y-3">
              {requirements.must_have && requirements.must_have.length > 0 ? (
                requirements.must_have.map((req, idx) => (
                  <div key={idx} className="border-l-2 border-primary/30 pl-3 py-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{req.canonical}</div>
                        <div className="text-xs text-muted-foreground mt-1">{req.raw}</div>
                        {req.evidence_span && (
                          <div className="text-xs text-muted-foreground mt-1 italic">
                            Evidence: "{req.evidence_span.slice(0, 80)}..."
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{req.category}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {Math.round(req.extraction_confidence * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground">No must-have requirements extracted</div>
              )}
            </div>
          </div>

          <Separator />

          {/* Nice to Have */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-sm font-semibold">Nice-to-Have / Preferred</h3>
              <Badge variant="secondary" className="text-xs">
                {requirements.nice_to_have?.length || 0}
              </Badge>
            </div>
            <div className="space-y-3">
              {requirements.nice_to_have && requirements.nice_to_have.length > 0 ? (
                requirements.nice_to_have.map((req, idx) => (
                  <div key={idx} className="border-l-2 border-muted-foreground/20 pl-3 py-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{req.canonical}</div>
                        <div className="text-xs text-muted-foreground mt-1">{req.raw}</div>
                      </div>
                      <Badge variant="outline" className="text-xs">{req.category}</Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground">No nice-to-have requirements extracted</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Panel C: Gates (Hard Requirements) */}
      {gates.length > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              Gates (Hard Requirements)
            </CardTitle>
            <CardDescription>
              These are hard blockers derived from the JD — candidates must meet all gates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {gates.map((gate, idx) => (
                <div
                  key={idx}
                  className={`border-l-4 ${
                    gate.needs_review ? 'border-amber-500' : 'border-primary'
                  } pl-4 py-3 rounded-r bg-background/50`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">{gate.canonical}</span>
                        {gate.needs_review && (
                          <Badge variant="outline" className="text-xs text-amber-600 border-amber-600">
                            Needs Review
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mb-2">{gate.raw}</div>
                      {gate.evidence_span && (
                        <div className="text-xs text-muted-foreground italic">
                          Evidence: "{gate.evidence_span.slice(0, 100)}"
                        </div>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        <Badge variant="secondary" className="text-xs">
                          {gate.policy_reason.replace(/_/g, ' ')}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {Math.round(gate.confidence * 100)}% confidence
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Context: Responsibilities & Constraints */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Responsibilities */}
        {context.responsibilities && context.responsibilities.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Responsibilities</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {context.responsibilities.map((resp, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>{resp.text}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Constraints */}
        {context.constraints && context.constraints.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Constraints</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {context.constraints.map((con, idx) => (
                  <li key={idx} className="text-sm">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                      <div>
                        <span className="font-medium capitalize">{con.type.replace(/_/g, ' ')}: </span>
                        <span className="text-muted-foreground">{con.value}</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Outcomes/Metrics */}
      {context.outcomes_metrics && context.outcomes_metrics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="w-5 h-5" />
              Success Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {context.outcomes_metrics.map((metric, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                  <span>{metric.metric}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
