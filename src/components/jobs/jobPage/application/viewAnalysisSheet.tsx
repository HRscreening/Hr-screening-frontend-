import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetTrigger,
    SheetHeader,
} from "@/components/ui/sheet";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Eye,
    FileText,
    CheckCircle2,
    XCircle,
    ExternalLink,
    AlertCircle,
    Loader2,
    TrendingUp,
    ShieldCheck,
    Sparkles,
    ChevronRight,
} from "lucide-react";
import type { Breakdown, AIAnalysis, Resume } from "@/types/applicationTypes";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import React from "react";


// ─── Score Ring ────────────────────────────────────────────────────────────────

function ScoreRing({
    score,
    size = 56,
    strokeWidth = 5,
    className,
}: {
    score: number | undefined;
    size?: number;
    strokeWidth?: number;
    className?: string;
}) {
    const r = (size - strokeWidth) / 2;
    const circ = 2 * Math.PI * r;

    if (score === undefined || score === null) score = 0;
    const pct = Math.min(Math.max(score, 0), 100) / 100;
    const offset = circ * (1 - pct);

    const color =
        score >= 75
            ? { stroke: "#16a34a", text: "text-green-600 dark:text-green-400" }
            : score >= 50
                ? { stroke: "#ca8a04", text: "text-yellow-600 dark:text-yellow-400" }
                : { stroke: "#dc2626", text: "text-red-600 dark:text-red-400" };

    return (
        <div
            className={cn("relative flex items-center justify-center shrink-0", className)}
            style={{ width: size, height: size }}
        >
            <svg width={size} height={size} className="-rotate-90">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    className="text-muted/40"
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    fill="none"
                    stroke={color.stroke}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circ}
                    strokeDashoffset={offset}
                    style={{ transition: "stroke-dashoffset 0.6s ease" }}
                />
            </svg>
            <span className={cn("absolute text-xs font-bold tabular-nums", color.text)}>
                {score}
            </span>
        </div>
    );
}

// ─── Score Bar ─────────────────────────────────────────────────────────────────

function ScoreBar({ score, label }: { score: number; label?: string }) {
    const color =
        score >= 75
            ? "bg-green-500 dark:bg-green-400"
            : score >= 50
                ? "bg-yellow-500 dark:bg-yellow-400"
                : "bg-red-500 dark:bg-red-400";

    return (
        <div className="flex items-center gap-3">
            {label && (
                <span className="text-xs text-muted-foreground w-28 shrink-0 truncate">
                    {label}
                </span>
            )}
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                    className={cn("h-full rounded-full transition-all duration-500", color)}
                    style={{ width: `${score}%` }}
                />
            </div>
            <span className="text-xs font-semibold tabular-nums w-6 text-right">{score}</span>
        </div>
    );
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function scoreLabel(score: number | undefined): string {
    if (score === undefined || score === null) return "No score";
    if (score >= 85) return "Excellent";
    if (score >= 70) return "Good";
    if (score >= 50) return "Moderate";
    if (score >= 30) return "Weak";
    return "Poor";
}

function scoreBadgeClass(score: number | undefined): string {
    if (score === undefined || score === null) return "bg-muted/40 text-muted-foreground border-muted/40";

    if (score >= 75)
        return "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:border-green-800";
    if (score >= 50)
        return "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800";
    return "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:border-red-800";
}

// ─── Component ─────────────────────────────────────────────────────────────────
interface ViewAnalysisSheetProps {
    breakdown?: Breakdown | null;
    aiAnalysis?: AIAnalysis | null;
    resume: Resume;
    overallScore: number | undefined;
    openSheet: boolean;
    setOpenSheet: (open: boolean) => void;

}


export default function ViewAnalysisSheet({
    breakdown,
    aiAnalysis,
    resume,
    overallScore,
    openSheet,
    setOpenSheet,
}: ViewAnalysisSheetProps) {
    // ── Type guards ────────────────────────────────────────────────────────────

    const isStringArray = (value: unknown): value is string[] =>
        Array.isArray(value) &&
        value.every((item) => typeof item === "string" && item.trim().length > 0);

    const isEvidenceObjectArray = (
        value: unknown
    ): value is Array<{ evidence: string; criterion?: string }> =>
        Array.isArray(value) &&
        value.length > 0 &&
        value.every(
            (item) =>
                typeof item === "object" &&
                item !== null &&
                "evidence" in item &&
                typeof (item as Record<string, unknown>).evidence === "string"
        );

    // const isPlainObject = (value: unknown): value is Record<string, unknown> =>
    //     value !== null && typeof value === "object" && !Array.isArray(value);

    const hasContent = (data: unknown): boolean => {
        if (!data) return false;
        if (typeof data === "object" && Object.keys(data as object).length === 0) return false;
        return true;
    };

    const normalizeToStringArray = (value: unknown): string[] | null => {
        if (isStringArray(value)) return value;
        if (isEvidenceObjectArray(value)) return value.map((item) => item.evidence);
        return null;
    };

    const formatSectionTitle = (key: string) =>
        key.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

    // ── Status badge ───────────────────────────────────────────────────────────

    const getStatusBadge = (status: string) => {
        const config: Record<string, { label: string; className: string; icon: React.ElementType }> = {
            parsed: {
                label: "Parsed",
                className: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:border-green-800",
                icon: CheckCircle2,
            },
            scored: {
                label: "Scored",
                className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800",
                icon: CheckCircle2,
            },
            pending: {
                label: "Pending",
                className: "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800",
                icon: Loader2,
            },
            failed: {
                label: "Failed",
                className: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:border-red-800",
                icon: XCircle,
            },
            error: {              
                label: "Error",
                className: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/20 dark:border-orange-800",
                icon: AlertCircle,
            },
        };
        const s = config[status] ?? config.pending;
        const Icon = s.icon;
        return (
            <Badge variant="outline" className={cn("gap-1.5 text-xs", s.className)}>
                <Icon className={cn("h-3 w-3", status === "pending" && "animate-spin")} />
                {s.label}
            </Badge>
        );
    };

    // ── Compute overall score ──────────────────────────────────────────────────

    // const computeOverallScore = (): number | null => {
    //     if (!breakdown) return null;
    //     const allScores: number[] = [];

    //     const collect = (obj: Record<string, unknown>) => {
    //         Object.values(obj).forEach((v) => {
    //             if (isPlainObject(v)) {
    //                 const rec = v as Record<string, unknown>;
    //                 if (typeof rec.score === "number") allScores.push(rec.score);
    //                 if (isPlainObject(rec.sub_criteria))
    //                     collect(rec.sub_criteria as Record<string, unknown>);
    //             }
    //         });
    //     };

    //     if (breakdown.mandatory_criteria)
    //         collect(breakdown.mandatory_criteria as unknown as Record<string, unknown>);
    //     if (breakdown.screening_criteria)
    //         collect(breakdown.screening_criteria as unknown as Record<string, unknown>);

    //     if (!allScores.length) return null;
    //     return Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length);
    // };

    // ── AI analysis categorisation ─────────────────────────────────────────────

    const getAIAnalysisSections = () => {
        if (!aiAnalysis || !Object.keys(aiAnalysis).length)
            return { strengths: [], improvements: [], other: {} as Record<string, string[]> };

        const strengths: string[] = [];
        const improvements: string[] = [];
        const other: Record<string, string[]> = {};

        Object.entries(aiAnalysis).forEach(([key, value]) => {
            if (!isStringArray(value)) return;
            const lk = key.toLowerCase();
            if (/good|strength|positive|pro|highlight|advantage/.test(lk)) strengths.push(...value);
            else if (/bad|improvement|weakness|concern|gap|con|issue|area/.test(lk)) improvements.push(...value);
            else other[key] = value;
        });

        return { strengths, improvements, other };
    };

    const { strengths, improvements, other } = getAIAnalysisSections();

    const hasAnyAnalysis = hasContent(aiAnalysis);
    const hasAnyGrounding = hasContent(breakdown);
    const hasAnyData = hasAnyAnalysis || hasAnyGrounding;
    const isParsedOrScored = resume.status === "parsed" || resume.status === "scored";
    const isPending = resume.status === "pending";
    const isFailed = resume.status === "failed";

    // ── Criterion card ─────────────────────────────────────────────────────────

    const renderCriterionCard = (
        key: string,
        criterion: {
            score: number;
            reason?: string | null;
            evidence?: unknown;
            sub_criteria?: Record<string, { score: number; reason?: string | null; evidence?: unknown }>;
        }
    ) => {
        const hasSubCriteria =
            criterion.sub_criteria && Object.keys(criterion.sub_criteria).length > 0;
        const normalizedEvidence = normalizeToStringArray(criterion.evidence);

        return (
            <AccordionItem
                key={key}
                value={key}
                className="border border-border/60 rounded-lg overflow-hidden bg-card"
            >
                <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/30 transition-colors [&>svg]:hidden group">
                    <div className="flex items-center gap-3 w-full">
                        <ScoreRing score={criterion.score} size={44} strokeWidth={4} />
                        <div className="flex-1 text-left min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                                {formatSectionTitle(key)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {scoreLabel(criterion.score)}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <Badge
                                variant="outline"
                                className={cn("text-xs tabular-nums", scoreBadgeClass(criterion.score))}
                            >
                                {criterion.score}/100
                            </Badge>
                            <ChevronRight className="w-4 h-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-90" />
                        </div>
                    </div>
                </AccordionTrigger>

                <AccordionContent>
                    <div className="px-4 pb-4 pt-2 space-y-4 border-t border-border/40">
                        {/* Reason */}
                        {criterion.reason && (
                            <div className="rounded-md bg-muted/40 px-3 py-2.5 border border-border/40">
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    {criterion.reason}
                                </p>
                            </div>
                        )}

                        {/* Sub-criteria bars */}
                        {hasSubCriteria && (
                            <div className="space-y-2.5">
                                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                    Breakdown
                                </p>
                                <div className="space-y-2.5">
                                    {Object.entries(criterion.sub_criteria!).map(([subKey, sub]) => (
                                        <div key={subKey} className="space-y-1">
                                            <ScoreBar
                                                score={sub?.score}
                                                label={formatSectionTitle(subKey)}
                                            />
                                            {sub?.reason && (
                                                <p className="text-xs text-muted-foreground/60 pl-30 leading-relaxed">
                                                    {sub.reason}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Evidence */}
                        {normalizedEvidence && normalizedEvidence.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                    Evidence
                                </p>
                                <ul className="space-y-1.5">
                                    {normalizedEvidence.map((item, idx) => (
                                        <li
                                            key={idx}
                                            className="flex items-start gap-2 text-xs text-muted-foreground"
                                        >
                                            <span className="text-primary mt-0.5 shrink-0 text-sm leading-tight">
                                                ›
                                            </span>
                                            <span className="leading-relaxed">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </AccordionContent>
            </AccordionItem>
        );
    };

    // ── Compute section averages ───────────────────────────────────────────────

    const sectionAvg = (criteria: Record<string, { score: number }> | undefined) => {
        if (!criteria) return 0;
        const scores = Object.values(criteria).map((c) => c.score);
        if (!scores.length) return 0;
        return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    };

    const mandatoryAvg = sectionAvg(breakdown?.mandatory_criteria);
    const screeningAvg = sectionAvg(breakdown?.screening_criteria);

    // ── Render ─────────────────────────────────────────────────────────────────

    return (
        <Sheet open={openSheet} onOpenChange={(open) => setOpenSheet(open)}>
            <SheetTrigger asChild >
                <Button variant="ghost" size="sm" className="h-8 gap-2">
                    <Eye className="h-4 w-4" />
                </Button>
            </SheetTrigger>

            <SheetContent className="w-full sm:max-w-xl lg:max-w-2xl flex flex-col p-0 gap-0">
                <SheetHeader className="sr-only">
                    <SheetDescription>AI-powered resume analysis</SheetDescription>
                </SheetHeader>

                {/* ── Header panel ── */}
                <div className="px-6 pt-5 pb-4 border-b bg-muted/20 space-y-4">
                    {/* Top row: score hero + meta */}
                    <div className="flex items-start gap-4">
                        {overallScore !== null && (
                            <ScoreRing score={overallScore} size={72} strokeWidth={6} />
                        )}
                        <div className="flex-1 min-w-0 pt-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h2 className="text-base font-semibold text-foreground">
                                    Resume Analysis
                                </h2>
                                {getStatusBadge(resume.status)}
                            </div>

                            {overallScore !== null ? (
                                <p className="text-sm text-muted-foreground mt-0.5">
                                    Overall{" "}
                                    <span className="font-semibold text-foreground">
                                        {overallScore}/100
                                    </span>
                                    <span className="mx-1.5 text-muted-foreground/50">·</span>
                                    <span>{scoreLabel(overallScore)}</span>
                                </p>
                            ) : (
                                <p className="text-sm text-muted-foreground mt-0.5">
                                    AI-powered analysis
                                </p>
                            )}

                            <div className="flex items-center gap-3 mt-3 flex-wrap">
                                {resume.page_count > 0 && (
                                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <FileText className="w-3 h-3" />
                                        {resume.page_count}p
                                    </span>
                                )}
                                {resume.uploaded_at && (
                                    <span className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(new Date(resume.uploaded_at), {
                                            addSuffix: true,
                                        })}
                                    </span>
                                )}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-6 gap-1 text-xs ml-auto"
                                    onClick={() => window.open(resume.raw_file_url, "_blank")}
                                    disabled={!resume.raw_file_url}
                                >
                                    View PDF
                                    <ExternalLink className="w-3 h-3" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Section score pills */}
                    {(breakdown?.mandatory_criteria || breakdown?.screening_criteria) && (
                        <div className="flex gap-2">
                            {breakdown.mandatory_criteria &&
                                Object.keys(breakdown.mandatory_criteria).length > 0 && (
                                    <div
                                        className={cn(
                                            "flex items-center gap-2 px-3 py-2 rounded-lg border text-xs flex-1",
                                            scoreBadgeClass(mandatoryAvg)
                                        )}
                                    >
                                        <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                                        <span className="font-medium">Mandatory</span>
                                        <span className="ml-auto font-bold tabular-nums">
                                            {mandatoryAvg}/100
                                        </span>
                                    </div>
                                )}
                            {breakdown.screening_criteria &&
                                Object.keys(breakdown.screening_criteria).length > 0 && (
                                    <div
                                        className={cn(
                                            "flex items-center gap-2 px-3 py-2 rounded-lg border text-xs flex-1",
                                            scoreBadgeClass(screeningAvg)
                                        )}
                                    >
                                        <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                                        <span className="font-medium">Screening</span>
                                        <span className="ml-auto font-bold tabular-nums">
                                            {screeningAvg}/100
                                        </span>
                                    </div>
                                )}
                        </div>
                    )}
                </div>

                {/* ── Scrollable body ── */}
                <ScrollArea className="flex-1">
                    <div className="px-6 py-5 space-y-6">

                        {/* Status banners */}
                        {isPending && (
                            <div className="flex items-start gap-3 p-4 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800">
                                <Loader2 className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 shrink-0 animate-spin" />
                                <div>
                                    <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                                        Analysis in Progress
                                    </p>
                                    <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-0.5">
                                        We're processing this resume. Check back shortly.
                                    </p>
                                </div>
                            </div>
                        )}

                        {isFailed && (
                            <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-red-900 dark:text-red-100">
                                        Analysis Failed
                                    </p>
                                    <p className="text-xs text-red-700 dark:text-red-300 mt-0.5">
                                        Please re-upload or contact support.
                                    </p>
                                </div>
                            </div>
                        )}

                        {isParsedOrScored && hasAnyData && (
                            <div className="space-y-6">

                                {/* ─── AI Insights ─── */}
                                {hasAnyAnalysis &&
                                    (strengths.length > 0 ||
                                        improvements.length > 0 ||
                                        Object.keys(other).length > 0) && (
                                        <section className="space-y-3">
                                            <div className="flex items-center gap-2">
                                                <Sparkles className="w-4 h-4 text-primary" />
                                                <h3 className="text-sm font-semibold text-foreground">
                                                    AI Insights
                                                </h3>
                                            </div>

                                            <div className="space-y-2">
                                                {strengths.length > 0 && (
                                                    <Accordion type="single" collapsible
                                                        defaultValue="strengths"
                                                    >
                                                        <AccordionItem

                                                            value="strengths"
                                                            className="border border-green-200 dark:border-green-900 rounded-lg overflow-hidden"
                                                        >
                                                            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-green-50/60 dark:hover:bg-green-950/20 transition-colors [&>svg]:hidden group">
                                                                <div className="flex items-center gap-2.5 w-full">
                                                                    <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center shrink-0">
                                                                        <CheckCircle2 className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                                                                    </div>
                                                                    <span className="text-sm font-medium text-green-800 dark:text-green-300">
                                                                        Strengths
                                                                    </span>
                                                                    <Badge className="ml-auto bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 border-0 text-xs">
                                                                        {strengths.length}
                                                                    </Badge>
                                                                    <ChevronRight className="w-4 h-4 text-green-500/50 transition-transform duration-200 group-data-[state=open]:rotate-90 shrink-0" />
                                                                </div>
                                                            </AccordionTrigger>
                                                            <AccordionContent className="px-4 pt-0 pb-4">
                                                                <ul className="space-y-2 pt-3 border-t border-green-100 dark:border-green-900/50">
                                                                    {strengths.map((point, idx) => (
                                                                        <li
                                                                            key={idx}
                                                                            className="flex items-start gap-2 text-sm text-green-900 dark:text-green-200"
                                                                        >
                                                                            <span className="text-green-500 mt-0.5 shrink-0 text-base leading-tight">
                                                                                ›
                                                                            </span>
                                                                            <span className="leading-relaxed">{point}</span>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </AccordionContent>
                                                        </AccordionItem>
                                                    </Accordion>
                                                )}

                                                {improvements.length > 0 && (
                                                    <Accordion type="single" collapsible
                                                    //  defaultValue="improvements"
                                                    >
                                                        <AccordionItem

                                                            value="improvements"
                                                            className="border border-red-200 dark:border-red-900 rounded-lg overflow-hidden"
                                                        >
                                                            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-red-50/60 dark:hover:bg-red-950/20 transition-colors [&>svg]:hidden group">
                                                                <div className="flex items-center gap-2.5 w-full">
                                                                    <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center shrink-0">
                                                                        <XCircle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                                                                    </div>
                                                                    <span className="text-sm font-medium text-red-800 dark:text-red-300">
                                                                        Missing Elements
                                                                    </span>
                                                                    <Badge className="ml-auto bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 border-0 text-xs">
                                                                        {improvements.length}
                                                                    </Badge>
                                                                    <ChevronRight className="w-4 h-4 text-red-500/50 transition-transform duration-200 group-data-[state=open]:rotate-90 shrink-0" />
                                                                </div>
                                                            </AccordionTrigger>
                                                            <AccordionContent className="px-4 pt-0 pb-4">
                                                                <ul className="space-y-2 pt-3 border-t border-red-100 dark:border-red-900/50">
                                                                    {improvements.map((point, idx) => (
                                                                        <li
                                                                            key={idx}
                                                                            className="flex items-start gap-2 text-sm text-red-900 dark:text-red-200"
                                                                        >
                                                                            <span className="text-red-500 mt-0.5 shrink-0 text-base leading-tight">
                                                                                ›
                                                                            </span>
                                                                            <span className="leading-relaxed">{point}</span>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </AccordionContent>
                                                        </AccordionItem>
                                                    </Accordion>
                                                )}

                                                {Object.entries(other).map(([key, values]) => (
                                                    <Accordion key={key} type="single" collapsible>
                                                        <AccordionItem
                                                            value={key}
                                                            className="border rounded-lg overflow-hidden"
                                                        >
                                                            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/30 [&>svg]:hidden group">
                                                                <div className="flex items-center gap-2 w-full">
                                                                    <span className="text-sm font-medium">
                                                                        {formatSectionTitle(key)}
                                                                    </span>
                                                                    <Badge
                                                                        variant="secondary"
                                                                        className="ml-auto text-xs"
                                                                    >
                                                                        {values.length}
                                                                    </Badge>
                                                                    <ChevronRight className="w-4 h-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-90 shrink-0" />
                                                                </div>
                                                            </AccordionTrigger>
                                                            <AccordionContent className="px-4 pt-0 pb-4">
                                                                <ul className="space-y-1.5 pt-3 border-t border-border/40">
                                                                    {values.map((item, idx) => (
                                                                        <li
                                                                            key={idx}
                                                                            className="flex items-start gap-2 text-sm text-muted-foreground"
                                                                        >
                                                                            <span className="text-primary mt-0.5 shrink-0 text-base leading-tight">
                                                                                ›
                                                                            </span>
                                                                            <span>{item}</span>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </AccordionContent>
                                                        </AccordionItem>
                                                    </Accordion>
                                                ))}
                                            </div>
                                        </section>
                                    )}

                                {hasAnyAnalysis && hasAnyGrounding && <Separator />}

                                {/* ─── Criteria Breakdown ─── */}
                                {hasAnyGrounding && breakdown && (
                                    <div className="space-y-6">
                                        {/* Mandatory */}
                                        {breakdown.mandatory_criteria &&
                                            Object.keys(breakdown.mandatory_criteria).length > 0 && (
                                                <section className="space-y-3">
                                                    <div className="flex items-center gap-2">
                                                        <ShieldCheck className="w-4 h-4 text-primary" />
                                                        <h3 className="text-sm font-semibold text-foreground">
                                                            Mandatory Criteria
                                                        </h3>
                                                        <Badge variant="secondary" className="ml-auto text-xs">
                                                            {Object.keys(breakdown.mandatory_criteria).length}
                                                        </Badge>
                                                    </div>
                                                    <Accordion type="multiple" className="space-y-2">
                                                        {Object.entries(breakdown.mandatory_criteria).map(
                                                            ([key, criterion]) =>
                                                                renderCriterionCard(key, criterion)
                                                        )}
                                                    </Accordion>
                                                </section>
                                            )}

                                        {/* Screening */}
                                        {breakdown.screening_criteria &&
                                            Object.keys(breakdown.screening_criteria).length > 0 && (
                                                <section className="space-y-3">
                                                    <div className="flex items-center gap-2">
                                                        <TrendingUp className="w-4 h-4 text-primary" />
                                                        <h3 className="text-sm font-semibold text-foreground">
                                                            Screening Criteria
                                                        </h3>
                                                        <Badge variant="secondary" className="ml-auto text-xs">
                                                            {Object.keys(breakdown.screening_criteria).length}
                                                        </Badge>
                                                    </div>
                                                    <Accordion type="multiple" className="space-y-2">
                                                        {Object.entries(breakdown.screening_criteria).map(
                                                            ([key, criterion]) =>
                                                                renderCriterionCard(key, criterion)
                                                        )}
                                                    </Accordion>
                                                </section>
                                            )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Empty state */}
                        {isParsedOrScored && !hasAnyData && (
                            <div className="py-20 text-center space-y-3">
                                <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto opacity-30" />
                                <p className="text-sm font-medium">No Analysis Available</p>
                                <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
                                    The resume was processed but analysis data isn't ready yet. This may take a moment.
                                </p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}