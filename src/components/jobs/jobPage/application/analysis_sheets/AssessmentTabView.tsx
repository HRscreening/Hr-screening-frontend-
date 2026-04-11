import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
    Brain, 
    UserCheck, 
    Star, 
    MessageSquare, 
    CheckCircle2, 
    XCircle, 
    AlertCircle,
    Quote
} from "lucide-react";
import type { CriteriaRating } from "@/types/interviewAssessmentType";
import { cn } from "@/lib/utils";
import { useApplicationAssessment } from "@/hooks/job_hooks/useApplicationAssessment";

interface AssessmentTabViewProps {
    interviewId: string;
}

const RatingStars = ({ rating }: { rating: number }) => {
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
                <Star
                    key={s}
                    className={cn(
                        "w-3 h-3",
                        s <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/20"
                    )}
                />
            ))}
        </div>
    );
};

const CriteriaSection = ({ ratings }: { ratings: CriteriaRating[] }) => {
    if (!ratings || ratings.length === 0) return null;

    return (
        <div className="space-y-3 mt-4">
            <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Criteria Ratings</h4>
            <div className="grid gap-3">
                {ratings.map((item, idx) => (
                    <div key={idx} className="bg-muted/30 rounded-lg p-3 border border-border/40">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-foreground">{item.criteria}</span>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-muted-foreground">{item.rating}/5</span>
                                <RatingStars rating={item.rating} />
                            </div>
                        </div>
                        { (item.comment) && (
                            <p className="text-xs text-muted-foreground leading-relaxed italic">
                                "{item.comment}"
                            </p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export function AssessmentTabView({ interviewId }: AssessmentTabViewProps) {
    const { data: assessment, isLoading, isError } = useApplicationAssessment(interviewId, true);


    if (isLoading) {
        return (
            <div className="space-y-4 py-2">
                <Skeleton className="h-20 w-full rounded-xl" />
                <Skeleton className="h-20 w-full rounded-xl" />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
                <AlertCircle className="w-8 h-8 opacity-20" />
                <p className="text-xs">Failed to load assessment data</p>
            </div>
        );
    }

    if (!assessment || (!assessment.ai_assessment && !assessment.panelist_assessment)) {
        return (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
                <MessageSquare className="w-8 h-8 opacity-20" />
                <p className="text-xs font-medium">No assessment data available for this round</p>
            </div>
        );
    }

    const getAvgRating = (ratings: CriteriaRating[]) => {
        if (!ratings || ratings.length === 0) return 0;
        const sum = ratings.reduce((acc, curr) => acc + curr.rating, 0);
        return (sum / ratings.length).toFixed(1);
    };

    return (
        <div className="space-y-3 py-2">
            <Accordion type="multiple" className="space-y-2">
                {/* AI Assessment */}
                {assessment.ai_assessment && (
                    <AccordionItem value="ai" className="border border-border/60 rounded-xl overflow-hidden bg-card">
                        <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/10 transition-colors group">
                            <div className="flex items-center justify-between w-full pr-4 text-left">
                                <div className="flex items-center gap-3">
                                    <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400">
                                        <Brain className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold">AI Assessment</h3>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <Badge variant="outline" className="text-[10px] py-0 h-4 bg-blue-50/50 border-blue-200 text-blue-700">AI Analysis</Badge>
                                            <span className="text-[10px] text-muted-foreground font-medium">
                                                Avg Rating: {getAvgRating(assessment.ai_assessment.criteria_ratings)}/5
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="hidden sm:flex items-center gap-2">
                                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/5 border border-primary/10">
                                        <span className="text-[10px] font-bold text-primary uppercase">Verdict: {assessment.ai_assessment.final_recommendation || "N/A"}</span>
                                    </div>
                                </div>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4 border-t border-border/40 bg-muted/5">
                            <div className="pt-4 space-y-4">
                                {assessment.ai_assessment.justification && (
                                    <div className="bg-card border border-border/40 rounded-lg p-4 relative">
                                        <Quote className="absolute -top-2 -left-2 w-6 h-6 text-primary/10 rotate-180" />
                                        <p className="text-xs text-foreground/80 leading-relaxed italic">
                                            {assessment.ai_assessment.justification}
                                        </p>
                                    </div>
                                )}
                                
                                <div className="grid grid-cols-1 gap-3">
                                    <div className="bg-card border border-border/40 rounded-lg p-3">
                                        <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">Recommendation</span>
                                        <span className="text-xs font-semibold text-foreground">
                                            {assessment.ai_assessment.final_recommendation || "Not specified"}
                                        </span>
                                    </div>
                                </div>

                                <CriteriaSection ratings={assessment.ai_assessment.criteria_ratings} />
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                )}

                {/* Panelist Assessment */}
                {assessment.panelist_assessment && (
                    <AccordionItem value="panelist" className="border border-border/60 rounded-xl overflow-hidden bg-card">
                        <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/10 transition-colors group">
                            <div className="flex items-center justify-between w-full pr-4 text-left">
                                <div className="flex items-center gap-3">
                                    <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400">
                                        <UserCheck className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold">Panel Assessment</h3>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <Badge variant="outline" className="text-[10px] py-0 h-4 bg-emerald-50/50 border-emerald-200 text-emerald-700">Team Verdict</Badge>
                                            <span className="text-[10px] text-muted-foreground font-medium">
                                                Avg Rating: {getAvgRating(assessment.panelist_assessment.response?.criteria_ratings || [])}/5
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="hidden sm:flex items-center gap-2">
                                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-100/50 border border-emerald-200">
                                        <span className="text-[10px] font-bold text-emerald-700 uppercase">Verdict: {assessment.panelist_assessment.final_verdict || "N/A"}</span>
                                    </div>
                                </div>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4 border-t border-border/40 bg-muted/5">
                            <div className="pt-4 space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-card border border-border/40 rounded-lg p-3">
                                        <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">Final Verdict</span>
                                        <div className="flex items-center gap-2">
                                            {assessment.panelist_assessment.final_verdict === "Hire" ? (
                                                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                            ) : (
                                                <XCircle className="w-3 h-3 text-red-500" />
                                            )}
                                            <span className="text-xs font-semibold text-foreground">
                                                {assessment.panelist_assessment.final_verdict || "Not specified"}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="bg-card border border-border/40 rounded-lg p-3">
                                        <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">Submitted At</span>
                                        <span className="text-xs font-semibold text-foreground">
                                            {assessment.panelist_assessment.submitted_at 
                                                ? new Date(assessment.panelist_assessment.submitted_at).toLocaleDateString() 
                                                : "N/A"}
                                        </span>
                                    </div>
                                </div>

                                <CriteriaSection ratings={assessment.panelist_assessment.response?.criteria_ratings || []} />
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                )}
            </Accordion>
        </div>
    );
}
