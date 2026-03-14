import React, { useEffect, useState } from "react";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, format } from "date-fns";
import axios from "@/axiosConfig";
import {
    CheckCircle2,
    Clock,
    ChevronRight,
    FileText,
    Mic,
    StickyNote,
    Calendar,
    User,
    Cpu,
    AlertCircle,
    CircleDot,
    Send,
    CalendarCheck,
    Link,
    BookOpen,
    RefreshCw,
    XCircle,
    ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type TimelineEventData = {
    actor: string;
    event_type: string;
    summary: string;
    created_at: string;
};

export type InterviewData = {
    id: string;
    round_number: number;
    status: string;
    is_complete: boolean;
    meet_link: string | null;
    interview_type: string;
    scheduled_at: string | null;
    is_notes_available: boolean;
    is_summary_available: boolean;
    is_transcript_available: boolean;
    notes: string | null;
    summary: string | null;
    transcript: string | null;
};

export type RoundConfigData = {
    title: string;
    duration_minutes: number;
};

export type RoundData = {
    interview: InterviewData;
    round_config: RoundConfigData;
    timeline_events: TimelineEventData[];
};

export type InterviewTabData = {
    current_round: RoundData | null;
    past_rounds: RoundData[];
};

// ─── Event Type Config ─────────────────────────────────────────────────────────

const EVENT_CONFIG: Record<string, { icon: React.ElementType; color: string; dot: string }> = {
    "Interview Created":                 { icon: BookOpen,     color: "text-blue-600 dark:text-blue-400",      dot: "bg-blue-500"     },
    "Booking Link Sent":                 { icon: Link,         color: "text-orange-600 dark:text-orange-400",  dot: "bg-orange-500"   },
    "Interview Scheduled":               { icon: CalendarCheck,color: "text-emerald-600 dark:text-emerald-400",dot: "bg-emerald-500"  },
    "Interview Rescheduled":             { icon: RefreshCw,    color: "text-amber-600 dark:text-amber-400",    dot: "bg-amber-500"    },
    "Interview Canceled":                { icon: XCircle,      color: "text-red-600 dark:text-red-400",        dot: "bg-red-500"      },
    "Candidate Requested for new slots": { icon: Send,         color: "text-violet-600 dark:text-violet-400",  dot: "bg-violet-500"   },
    DEFAULT:                             { icon: CircleDot,    color: "text-muted-foreground",                  dot: "bg-muted-foreground" },
};

// ─── Status Config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
    "Collecting Availability": { label: "Collecting Availability", className: "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800" },
    "Ready to Book":           { label: "Ready to Book",           className: "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/20 dark:border-cyan-800" },
    "Scheduled":               { label: "Scheduled",               className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800" },
    "Completed":               { label: "Completed",               className: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:border-green-800" },
    "Canceled":                { label: "Cancelled",               className: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:border-red-800" },
    "In Progress":             { label: "In Progress",             className: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/20 dark:border-purple-800" },
    "Awaiting Feedback":       { label: "Awaiting Feedback",       className: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/20 dark:border-orange-800" },
    "Feedback Collected":      { label: "Feedback Collected",      className: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/20 dark:border-teal-800" },
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function actorLabel(actor: string): { label: string; isSystem: boolean } {
    const lower = actor.toLowerCase();
    if (lower === "system") return { label: "System", isSystem: true };
    return { label: actor, isSystem: false };
}

// Renders text with \n as real line breaks, preserving font/spacing
function SummaryText({ text }: { text: string }) {
    const lines = text.split("\n");
    return (
        <span>
            {lines.map((line, i) => (
                <React.Fragment key={i}>
                    {line}
                    {i < lines.length - 1 && <br />}
                </React.Fragment>
            ))}
        </span>
    );
}

// ─── Skeleton Loaders ──────────────────────────────────────────────────────────

function RoundSkeleton() {
    return (
        <div className="border border-border/60 rounded-xl overflow-hidden bg-card">
            <div className="px-4 py-3.5 border-b border-border/40 bg-muted/10">
                <div className="flex items-center gap-3">
                    <Skeleton className="w-7 h-7 rounded-lg" />
                    <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3.5 w-40" />
                        <Skeleton className="h-2.5 w-20" />
                    </div>
                    <Skeleton className="h-5 w-20 rounded-full" />
                </div>
            </div>
            <div className="px-4 py-4 space-y-4">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-7 w-20 rounded-md" />
                    <Skeleton className="h-7 w-24 rounded-md" />
                    <Skeleton className="h-7 w-16 rounded-md" />
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-3 w-32" />
                    <div className="pl-5 space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex gap-3">
                                <div className="flex-1 border border-border/40 rounded-lg px-3 py-2.5 space-y-1.5">
                                    <Skeleton className="h-3 w-3/4" />
                                    <Skeleton className="h-2.5 w-24" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function PageSkeleton() {
    return (
        <div className="px-5 py-5 space-y-5">
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <Skeleton className="w-1.5 h-1.5 rounded-full" />
                    <Skeleton className="h-3 w-24" />
                </div>
                <RoundSkeleton />
            </div>
        </div>
    );
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

function TimelineView({ timeline }: { timeline: TimelineEventData[] }) {
    return (
        <div className="relative pl-5">
            <div className="absolute left-2.25 top-2 bottom-2 w-px bg-border/60" />
            <div className="space-y-0">
                {timeline.map((event, idx) => {
                    const cfg = EVENT_CONFIG[event.event_type] ?? EVENT_CONFIG.DEFAULT;
                    const Icon = cfg.icon;
                    const { label: actorName, isSystem } = actorLabel(event.actor);
                    const isLast = idx === timeline.length - 1;

                    return (
                        <div key={`${event.event_type}-${idx}`} className={cn("relative flex gap-3", !isLast && "pb-4")}>
                            <div className={cn(
                                "absolute -left-5 mt-0.75 w-4.5 h-4.5 rounded-full border-2 border-background flex items-center justify-center shrink-0",
                                cfg.dot
                            )}>
                                <Icon className="w-2.5 h-2.5 text-white" />
                            </div>

                            <div className="flex-1 min-w-0 bg-card border border-border/50 rounded-lg px-3 py-2.5 hover:border-border/80 transition-colors">
                                <div className="flex items-start justify-between gap-2">
                                    <p className="text-xs font-medium text-foreground leading-snug">
                                        <SummaryText text={event.summary} />
                                    </p>
                                    <span className="text-[10px] text-muted-foreground/60 shrink-0 tabular-nums mt-0.5">
                                        {format(new Date(event.created_at), "HH:mm")}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 mt-1.5">
                                    <div className={cn("flex items-center gap-1 text-[10px]", cfg.color)}>
                                        {isSystem ? <Cpu className="w-2.5 h-2.5" /> : <User className="w-2.5 h-2.5" />}
                                        <span className="font-medium">{actorName}</span>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground/40">·</span>
                                    <span className="text-[10px] text-muted-foreground/50">
                                        {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Availability Indicators ───────────────────────────────────────────────────

function AvailabilityIndicators({ interview, onOpen }: {
    interview: InterviewData;
    onOpen: (type: "summary" | "transcript" | "notes") => void;
}) {
    const indicators = [
        {
            key: "summary" as const,
            label: "Summary",
            icon: FileText,
            available: interview.is_summary_available,
            availableClass: "border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 dark:border-blue-800 dark:text-blue-400 dark:bg-blue-950/20 dark:hover:bg-blue-950/40",
            unavailableClass: "border-border/40 text-muted-foreground/40 bg-muted/20 cursor-not-allowed",
        },
        {
            key: "transcript" as const,
            label: "Transcript",
            icon: Mic,
            available: interview.is_transcript_available,
            availableClass: "border-violet-200 text-violet-700 bg-violet-50 hover:bg-violet-100 dark:border-violet-800 dark:text-violet-400 dark:bg-violet-950/20 dark:hover:bg-violet-950/40",
            unavailableClass: "border-border/40 text-muted-foreground/40 bg-muted/20 cursor-not-allowed",
        },
        {
            key: "notes" as const,
            label: "Notes",
            icon: StickyNote,
            available: interview.is_notes_available,
            availableClass: "border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 dark:border-amber-800 dark:text-amber-400 dark:bg-amber-950/20 dark:hover:bg-amber-950/40",
            unavailableClass: "border-border/40 text-muted-foreground/40 bg-muted/20 cursor-not-allowed",
        },
    ];

    return (
        <div className="flex items-center gap-2 flex-wrap">
            {indicators.map(({ key, label, icon: Icon, available, availableClass, unavailableClass }) => (
                <button
                    key={key}
                    disabled={!available}
                    onClick={() => available && onOpen(key)}
                    className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-medium transition-colors",
                        available ? availableClass : unavailableClass
                    )}
                >
                    <Icon className="w-3 h-3" />
                    {label}
                    {available ? (
                        <CheckCircle2 className="w-3 h-3 ml-0.5" />
                    ) : (
                        <span className="w-3 h-3 ml-0.5 rounded-full border border-current/30 inline-block" />
                    )}
                </button>
            ))}
        </div>
    );
}

// ─── Round Card Content ────────────────────────────────────────────────────────

function RoundContent({ round, onOpen }: {
    round: RoundData;
    onOpen: (type: "summary" | "transcript" | "notes") => void;
}) {
    const statusCfg = STATUS_CONFIG[round.interview.status] ?? {
        label: round.interview.status,
        className: "bg-muted text-muted-foreground border-border",
    };

    return (
        <div className="space-y-4">
            {/* Status + indicators row */}
            <div className="flex items-center gap-3 flex-wrap">
                <Badge variant="outline" className={cn("text-xs gap-1", statusCfg.className)}>
                    {round.interview.is_complete
                        ? <CheckCircle2 className="w-3 h-3" />
                        : <Clock className="w-3 h-3" />
                    }
                    {statusCfg.label}
                </Badge>
                {round.round_config.duration_minutes && (
                    <span className="text-xs text-muted-foreground/60 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {round.round_config.duration_minutes} min
                    </span>
                )}
                {
                    round.interview.interview_type && (
                        <span className="text-xs text-muted-foreground/60 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {round.interview.interview_type}
                        </span>
                    )
                }
                <div className="h-4 w-px bg-border/40" />
                <AvailabilityIndicators interview={round.interview} onOpen={onOpen} />
            </div>

            {/* Timeline */}
            {round.timeline_events && round.timeline_events.length > 0 ? (
                <div className="space-y-2">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <Calendar className="w-3 h-3" />
                        Activity Timeline
                    </p>
                    <TimelineView timeline={round.timeline_events} />
                </div>
            ) : (
                <div className="flex items-center gap-2 py-6 justify-center text-muted-foreground/40">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-xs">No timeline activity yet</span>
                </div>
            )}
        </div>
    );
}

// ─── Shared Round Accordion Trigger Content ────────────────────────────────────

function RoundTriggerContent({
    round,
    isCurrent,
}: {
    round: RoundData;
    isCurrent?: boolean;
}) {
    const statusCfg = STATUS_CONFIG[round.interview.status] ?? {
        label: round.interview.status,
        className: "bg-muted text-muted-foreground border-border",
    };

    return (
        <div className="flex items-center gap-3 w-full min-w-0">
            {/* Round number badge */}
            <div className={cn(
                "w-7 h-7 rounded-lg border flex items-center justify-center shrink-0",
                isCurrent
                    ? "bg-primary/10 border-primary/20"
                    : round.interview.is_complete
                        ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800"
                        : "bg-muted border-border/40"
            )}>
                {!isCurrent && round.interview.is_complete ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                ) : (
                    <span className={cn(
                        "text-xs font-bold",
                        isCurrent ? "text-primary" : "text-muted-foreground"
                    )}>
                        {round.interview.round_number}
                    </span>
                )}
            </div>

            {/* Title + subtitle */}
            <div className="flex-1 text-left min-w-0">
                <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground truncate">
                        {round.round_config.title}
                    </p>
                    {isCurrent && (
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shrink-0" />
                    )}
                </div>
                {/* Show schedule inline in trigger if available */}
                {isCurrent && round.interview.scheduled_at ? (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate flex items-center gap-1">
                        <Calendar className="w-3 h-3 shrink-0 text-blue-500" />
                        {round.interview.scheduled_at}
                    </p>
                ) : (
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Round {round.interview.round_number}
                    </p>
                )}
            </div>

            {/* Status badge + chevron */}
            <div className="flex items-center gap-2 shrink-0">
                <Badge variant="outline" className={cn("text-xs", statusCfg.className)}>
                    {statusCfg.label}
                </Badge>
                <ChevronRight className="w-4 h-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-90" />
            </div>
        </div>
    );
}

// ─── Dialog Content Renderer ───────────────────────────────────────────────────

function ContentDialog({
    open,
    onClose,
    type,
    round,
}: {
    open: boolean;
    onClose: () => void;
    type: "summary" | "transcript" | "notes" | null;
    round: RoundData | null;
}) {
    if (!type || !round) return null;

    const config = {
        summary: {
            title: "AI Summary",
            icon: FileText,
            content: round.interview.summary,
            iconColor: "text-blue-500",
        },
        transcript: {
            title: "Interview Transcript",
            icon: Mic,
            content: round.interview.transcript,
            iconColor: "text-violet-500",
        },
        notes: {
            title: "Interviewer Notes",
            icon: StickyNote,
            content: round.interview.notes,
            iconColor: "text-amber-500",
        },
    }[type];

    const Icon = config.icon;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col p-0 gap-0 overflow-hidden">
                <DialogHeader className="px-6 py-4 border-b bg-muted/20 shrink-0">
                    <DialogTitle className="flex items-center gap-2 text-base">
                        <Icon className={cn("w-4 h-4", config.iconColor)} />
                        {config.title}
                        <span className="text-muted-foreground font-normal text-sm ml-1">
                            — {round.round_config.title}
                        </span>
                    </DialogTitle>
                </DialogHeader>
                <ScrollArea className="flex-1">
                    <div className="px-6 py-5">
                        {config.content ? (
                            <p className="text-sm text-foreground/80 leading-relaxed bg-muted/30 rounded-lg p-4 border border-border/40">
                                <SummaryText text={config.content} />
                            </p>
                        ) : (
                            <div className="py-12 text-center text-muted-foreground/40 text-sm">
                                No content available
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function InterviewAnalysisSheet({ application_id }: {
    application_id: string;
}) {
    const [dialogType, setDialogType] = useState<"summary" | "transcript" | "notes" | null>(null);
    const [dialogRound, setDialogRound] = useState<RoundData | null>(null);
    const [data, setData] = useState<InterviewTabData | null>(null);
    const [loading, setLoading] = useState(true);

    const openDialog = (round: RoundData, type: "summary" | "transcript" | "notes") => {
        setDialogRound(round);
        setDialogType(type);
    };

    const closeDialog = () => {
        setDialogType(null);
        setDialogRound(null);
    };

    async function loadInterviewData() {
        try {
            setLoading(true);
            const res = await axios.get(`/interview/get-interview-details/${application_id}`);
            if (res.status === 200) {
                setData(res.data);
            } else {
                throw new Error(`Failed to load interview data: ${res.data.message}`);
            }
        } catch (error) {
            console.error("Error fetching interview data:", error);
            toast.error("Failed to load interview data. Please try again later.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadInterviewData();
    }, [application_id]);

    // ── Loading ──
    if (loading) {
        return (
            <div className="h-full overflow-hidden">
                <ScrollArea className="h-full">
                    <PageSkeleton />
                </ScrollArea>
            </div>
        );
    }

    const currentRound = data?.current_round ?? null;
    const pastRounds = data?.past_rounds ?? [];
    const hasPastRounds = pastRounds.length > 0;

    // ── Empty ──
    if (!currentRound && !hasPastRounds) {
        return (
            <div className="h-full flex items-center justify-center gap-3 text-muted-foreground/40 flex-col py-20">
                <AlertCircle className="w-10 h-10 opacity-30" />
                <p className="text-sm font-medium">No interview data available</p>
            </div>
        );
    }

    // Default open value for the current round accordion
    const currentRoundAccordionValue = currentRound ? `current-${currentRound.interview.id}` : undefined;

    return (
        // h-full + overflow-hidden lets ScrollArea control all scrolling
        <div className="h-full overflow-hidden">
            <ScrollArea className="h-full">
                <div className="px-5 py-5 space-y-5">

                    {/* ── Current Round ── */}
                    {currentRound && (
                        <section className="space-y-3">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                    Current Round
                                </p>
                            </div>

                            <Accordion
                                type="single"
                                collapsible
                                defaultValue={currentRoundAccordionValue}
                                className="border border-primary/20 rounded-xl overflow-hidden bg-primary/2 dark:bg-primary/4"
                            >
                                <AccordionItem value={currentRoundAccordionValue!} className="border-none">
                                    <AccordionTrigger className="px-4 py-3.5 hover:no-underline hover:bg-muted/20 transition-colors [&>svg]:hidden group">
                                        <RoundTriggerContent round={currentRound} isCurrent />
                                    </AccordionTrigger>

                                    <AccordionContent>
                                        <div className="border-t border-border/40">
                                            {/* Meet link banner — only in current round, inside expanded content */}
                                            {currentRound.interview.meet_link && (
                                                <div className="px-4 py-2.5 bg-emerald-50/60 dark:bg-emerald-950/20 border-b border-emerald-100 dark:border-emerald-900/40 flex items-center gap-2">
                                                    <ExternalLink className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                                                    <a
                                                        href={currentRound.interview.meet_link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
                                                    >
                                                        Join Meeting
                                                    </a>
                                                    <span className="text-muted-foreground/30 hidden sm:block">·</span>
                                                    <span className="text-[11px] text-muted-foreground/40 truncate hidden sm:block">
                                                        {currentRound.interview.meet_link}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="px-4 py-4">
                                                <RoundContent
                                                    round={currentRound}
                                                    onOpen={(type) => openDialog(currentRound, type)}
                                                />
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </section>
                    )}

                    {/* ── Past Rounds ── */}
                    {hasPastRounds && (
                        <section className="space-y-3">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
                                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                    Past Rounds
                                </p>
                                <Badge variant="secondary" className="ml-auto text-xs">
                                    {pastRounds.length}
                                </Badge>
                            </div>

                            <Accordion type="multiple" className="space-y-2">
                                {pastRounds.map((round) => (
                                    <AccordionItem
                                        key={round.interview.id}
                                        value={round.interview.id}
                                        className="border border-border/60 rounded-xl overflow-hidden bg-card"
                                    >
                                        <AccordionTrigger className="px-4 py-3.5 hover:no-underline hover:bg-muted/30 transition-colors [&>svg]:hidden group">
                                            <RoundTriggerContent round={round} isCurrent={false} />
                                        </AccordionTrigger>

                                        <AccordionContent>
                                            <div className="px-4 pb-4 pt-1 border-t border-border/40">
                                                <RoundContent
                                                    round={round}
                                                    onOpen={(type) => openDialog(round, type)}
                                                />
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </section>
                    )}

                    {/* bottom padding so last item isn't flush against edge */}
                    <div className="h-2" />
                </div>
            </ScrollArea>

            {/* ── Dialog ── */}
            <ContentDialog
                open={!!dialogType}
                onClose={closeDialog}
                type={dialogType}
                round={dialogRound}
            />
        </div>
    );
}