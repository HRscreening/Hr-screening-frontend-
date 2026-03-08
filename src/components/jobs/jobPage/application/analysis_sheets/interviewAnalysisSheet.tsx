import React, { useState } from "react";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, format } from "date-fns";
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
    CheckCheck,
    Send,
    CalendarCheck,
    Users,
    Link,
    BookOpen,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type TimelineData = {
    id: string;
    event_type: string;
    label: string;
    actor: string;
    details: object;
    summary: string;
    created_at: string;
};

export type RoundData = {
    id: string;
    round_number: number;
    title: string;
    is_completed: boolean;
    status: string;
    is_notes_available: boolean;
    is_summary_available: boolean;
    is_transcript_available: boolean;
    notes?: string | null;
    summary?: string | null;
    transcript?: string | null;
    timeline: TimelineData[] | null;
};

export type InterviewTabData = {
    currentRound: RoundData | null;
    pastRounds: RoundData[] | null;
};

// ─── Sample Data ───────────────────────────────────────────────────────────────

const SAMPLE_DATA: InterviewTabData = {
    currentRound: {
        id: "round-001",
        round_number: 2,
        title: "System Design Round",
        is_completed: false,
        status: "scheduled",
        is_notes_available: false,
        is_summary_available: false,
        is_transcript_available: false,
        notes: null,
        summary: null,
        transcript: null,
        timeline: [
            {
                id: "t4",
                event_type: "SLOT_BOOKING_LINK_SENT",
                label: "Booking link sent to candidate",
                actor: "system",
                details: { candidate_email: "candidate@email.com" },
                summary: "Booking link sent to candidate@email.com",
                created_at: "2026-03-05T12:00:00+00:00",
            },
            {
                id: "t3",
                event_type: "PANELIST_AVAILABILITY_SUBMITTED",
                label: "Panelist submitted availability",
                actor: "alice@company.com",
                details: { slots_count: 3, panelist_email: "alice@company.com" },
                summary: "alice@company.com submitted 3 availability slot(s)",
                created_at: "2026-03-05T11:30:00+00:00",
            },
            {
                id: "t2",
                event_type: "PANELIST_AVAILABILITY_REQUESTED",
                label: "Availability request sent to panelists",
                actor: "system",
                details: { panelist_count: 2, panelist_emails: ["alice@company.com", "bob@company.com"] },
                summary: "Availability request sent to 2 panelist(s)",
                created_at: "2026-03-05T10:01:00+00:00",
            },
            {
                id: "t1",
                event_type: "INTERVIEW_CREATED",
                label: "Interview round created",
                actor: "hr",
                details: { round_title: "System Design Round", round_number: 2 },
                summary: "Interview created for System Design Round (Round 2)",
                created_at: "2026-03-05T10:00:00+00:00",
            },
        ],
    },
    pastRounds: [
        {
            id: "round-000",
            round_number: 1,
            title: "Technical Round",
            is_completed: true,
            status: "completed",
            is_notes_available: true,
            is_summary_available: true,
            is_transcript_available: true,
            notes: `## Interview Notes — Technical Round\n\n**Candidate:** Strong problem-solving skills demonstrated throughout.\n\n### Data Structures & Algorithms\n- Solved two medium-level LeetCode problems correctly\n- Explained time/space complexity clearly\n- Minor issue with edge case handling in tree traversal\n\n### System Knowledge\n- Good understanding of REST APIs\n- Familiar with SQL and basic indexing\n- Could improve on distributed systems concepts\n\n**Overall Impression:** Solid candidate, recommend moving forward.`,
            summary: `The candidate performed well in the Technical Round. They demonstrated strong algorithmic thinking and were able to solve both coding problems within the allotted time. Communication was clear and they showed good understanding of trade-offs. Key strengths include data structures knowledge and clean code. Areas for improvement include distributed systems and edge case handling. Recommendation: Proceed to next round.`,
            transcript: `Interviewer: Good morning! Let's start with a quick introduction.\n\nCandidate: Hi, I'm excited to be here. I have 3 years of experience in backend development, primarily with Node.js and Python.\n\nInterviewer: Great. Let's dive into the first problem — implement a function to find the lowest common ancestor of two nodes in a binary tree.\n\nCandidate: Sure. So the key insight here is... [continued for 45 minutes]\n\nInterviewer: Excellent approach. One last question — how would you design a URL shortener?\n\nCandidate: I'd start with a hash function to generate a 6-character code, use a key-value store like Redis for fast lookups, and add a relational DB for persistence and analytics...\n\nInterviewer: That's a solid answer. Thanks for your time today.`,
            timeline: [
                {
                    id: "p1",
                    event_type: "INTERVIEW_CREATED",
                    label: "Interview round created",
                    actor: "hr",
                    details: { round_title: "Technical Round", round_number: 1 },
                    summary: "Interview created for Technical Round (Round 1)",
                    created_at: "2026-03-04T18:53:45+00:00",
                },
                {
                    id: "p2",
                    event_type: "PANELIST_AVAILABILITY_REQUESTED",
                    label: "Availability request sent to panelists",
                    actor: "system",
                    details: { panelist_count: 1, panelist_emails: ["keshavraj09898@gmail.com"] },
                    summary: "Availability request sent to 1 panelist(s)",
                    created_at: "2026-03-04T18:53:45+00:00",
                },
                {
                    id: "p3",
                    event_type: "PANELIST_AVAILABILITY_SUBMITTED",
                    label: "Panelist submitted availability",
                    actor: "keshavraj09898@gmail.com",
                    details: { slots_count: 2, panelist_email: "keshavraj09898@gmail.com" },
                    summary: "keshavraj09898@gmail.com submitted 2 availability slot(s)",
                    created_at: "2026-03-04T18:55:51+00:00",
                },
                {
                    id: "p4",
                    event_type: "SLOT_COMPUTATION_SUCCESS",
                    label: "Interview slots computed successfully",
                    actor: "system",
                    details: { panel_mode: "sequential", slot_count: 4, panelist_email: "keshavraj09898@gmail.com" },
                    summary: "4 interview slot(s) computed (sequential mode)",
                    created_at: "2026-03-04T18:55:51+00:00",
                },
                {
                    id: "p5",
                    event_type: "SLOT_BOOKING_LINK_SENT",
                    label: "Booking link sent to candidate",
                    actor: "system",
                    details: { candidate_email: "keshavraj09898@gmail.com" },
                    summary: "Booking link sent to keshavraj09898@gmail.com",
                    created_at: "2026-03-04T18:55:51+00:00",
                },
                {
                    id: "p6",
                    event_type: "SLOT_BOOKED",
                    label: "Candidate booked an interview slot",
                    actor: "keshavraj09898@gmail.com",
                    details: {
                        slots: [{ slot_id: "s1", slot_end: "2026-03-05T10:59:00+00:00", slot_start: "2026-03-05T09:30:00+00:00", panelist_email: "keshavraj09898@gmail.com" }],
                        panel_mode: "sequential",
                    },
                    summary: "Candidate booked 1 sequential slot(s)",
                    created_at: "2026-03-04T18:57:00+00:00",
                },
                {
                    id: "p7",
                    event_type: "INTERVIEW_COMPLETED",
                    label: "Interview marked as completed",
                    actor: "hr",
                    details: { duration_minutes: 62 },
                    summary: "Interview completed after 62 minutes",
                    created_at: "2026-03-05T11:01:00+00:00",
                },
            ],
        },
    ],
};

// ─── Event Type Config ─────────────────────────────────────────────────────────

const EVENT_CONFIG: Record<string, { icon: React.ElementType; color: string; dot: string }> = {
    INTERVIEW_CREATED: { icon: BookOpen, color: "text-blue-600 dark:text-blue-400", dot: "bg-blue-500" },
    PANELIST_AVAILABILITY_REQUESTED: { icon: Send, color: "text-violet-600 dark:text-violet-400", dot: "bg-violet-500" },
    PANELIST_AVAILABILITY_SUBMITTED: { icon: Users, color: "text-cyan-600 dark:text-cyan-400", dot: "bg-cyan-500" },
    SLOT_COMPUTATION_SUCCESS: { icon: Cpu, color: "text-amber-600 dark:text-amber-400", dot: "bg-amber-500" },
    SLOT_BOOKING_LINK_SENT: { icon: Link, color: "text-orange-600 dark:text-orange-400", dot: "bg-orange-500" },
    SLOT_BOOKED: { icon: CalendarCheck, color: "text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500" },
    INTERVIEW_COMPLETED: { icon: CheckCheck, color: "text-green-600 dark:text-green-400", dot: "bg-green-500" },
    DEFAULT: { icon: CircleDot, color: "text-muted-foreground", dot: "bg-muted-foreground" },
};

// ─── Status Config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
    completed: { label: "Completed", className: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:border-green-800" },
    scheduled: { label: "Scheduled", className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800" },
    pending: { label: "Pending", className: "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800" },
    cancelled: { label: "Cancelled", className: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:border-red-800" },
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function actorLabel(actor: string): { label: string; isSystem: boolean } {
    if (actor === "system") return { label: "System", isSystem: true };
    if (actor === "hr") return { label: "HR", isSystem: false };
    return { label: actor.split("@")[0], isSystem: false };
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

function TimelineView({ timeline }: { timeline: TimelineData[] }) {
    return (
        <div className="relative pl-5">
            {/* Vertical line */}
            <div className="absolute left-2.25 top-2 bottom-2 w-px bg-border/60" />

            <div className="space-y-0">
                {timeline.map((event, idx) => {
                    const cfg = EVENT_CONFIG[event.event_type] ?? EVENT_CONFIG.DEFAULT;
                    const Icon = cfg.icon;
                    const { label: actorName, isSystem } = actorLabel(event.actor);
                    const isLast = idx === timeline.length - 1;

                    return (
                        <div key={event.id} className={cn("relative flex gap-3", !isLast && "pb-4")}>
                            {/* Dot */}
                            <div className={cn("absolute -left-5 mt-0.75 w-4.5 h-4.5 rounded-full border-2 border-background flex items-center justify-center shrink-0", cfg.dot)}>
                                <Icon className="w-2.5 h-2.5 text-white" />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0 bg-card border border-border/50 rounded-lg px-3 py-2.5 hover:border-border/80 transition-colors">
                                <div className="flex items-start justify-between gap-2">
                                    <p className="text-xs font-medium text-foreground leading-snug">
                                        {event.summary}
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

function AvailabilityIndicators({ round, onOpen }: {
    round: RoundData;
    onOpen: (type: "summary" | "transcript" | "notes") => void;
}) {
    const indicators = [
        {
            key: "summary" as const,
            label: "Summary",
            icon: FileText,
            available: round.is_summary_available,
            availableClass: "border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 dark:border-blue-800 dark:text-blue-400 dark:bg-blue-950/20 dark:hover:bg-blue-950/40",
            unavailableClass: "border-border/40 text-muted-foreground/40 bg-muted/20 cursor-not-allowed",
        },
        {
            key: "transcript" as const,
            label: "Transcript",
            icon: Mic,
            available: round.is_transcript_available,
            availableClass: "border-violet-200 text-violet-700 bg-violet-50 hover:bg-violet-100 dark:border-violet-800 dark:text-violet-400 dark:bg-violet-950/20 dark:hover:bg-violet-950/40",
            unavailableClass: "border-border/40 text-muted-foreground/40 bg-muted/20 cursor-not-allowed",
        },
        {
            key: "notes" as const,
            label: "Notes",
            icon: StickyNote,
            available: round.is_notes_available,
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
    const statusCfg = STATUS_CONFIG[round.status] ?? STATUS_CONFIG.pending;

    return (
        <div className="space-y-4">
            {/* Status + indicators row */}
            <div className="flex items-center gap-3 flex-wrap">
                <Badge variant="outline" className={cn("text-xs gap-1", statusCfg.className)}>
                    {round.is_completed
                        ? <CheckCircle2 className="w-3 h-3" />
                        : <Clock className="w-3 h-3" />
                    }
                    {statusCfg.label}
                </Badge>
                <div className="h-4 w-px bg-border/40" />
                <AvailabilityIndicators round={round} onOpen={onOpen} />
            </div>

            {/* Timeline */}
            {round.timeline && round.timeline.length > 0 ? (
                <div className="space-y-2">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <Calendar className="w-3 h-3" />
                        Activity Timeline
                    </p>
                    <TimelineView timeline={round.timeline} />
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
            content: round.summary,
            iconColor: "text-blue-500",
        },
        transcript: {
            title: "Interview Transcript",
            icon: Mic,
            content: round.transcript,
            iconColor: "text-violet-500",
        },
        notes: {
            title: "Interviewer Notes",
            icon: StickyNote,
            content: round.notes,
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
                            — {round.title}
                        </span>
                    </DialogTitle>
                </DialogHeader>
                <ScrollArea className="flex-1">
                    <div className="px-6 py-5">
                        {config.content ? (
                            <div className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap font-mono bg-muted/30 rounded-lg p-4 border border-border/40">
                                {config.content}
                            </div>
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

export default function InterviewAnalysisSheet({
    data = SAMPLE_DATA,
}: {
    data?: InterviewTabData;
}) {
    const [dialogType, setDialogType] = useState<"summary" | "transcript" | "notes" | null>(null);
    const [dialogRound, setDialogRound] = useState<RoundData | null>(null);

    const openDialog = (round: RoundData, type: "summary" | "transcript" | "notes") => {
        setDialogRound(round);
        setDialogType(type);
    };

    const closeDialog = () => {
        setDialogType(null);
        setDialogRound(null);
    };

    const { currentRound, pastRounds } = data;
    const hasPastRounds = pastRounds && pastRounds.length > 0;

    if (!currentRound && !hasPastRounds) {
        return (
            <div className="flex flex-col h-full items-center justify-center gap-3 text-muted-foreground/40 py-20">
                <AlertCircle className="w-10 h-10 opacity-30" />
                <p className="text-sm font-medium">No interview data available</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            <ScrollArea className="flex-1 min-h-0">
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

                            <div className="border border-primary/20 rounded-xl overflow-hidden bg-primary/2 dark:bg-primary/4">
                                {/* Round header */}
                                <div className="px-4 py-3.5 border-b border-border/40 bg-muted/10">
                                    <div className="flex items-center gap-3">
                                        <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                                            <span className="text-xs font-bold text-primary">
                                                {currentRound.round_number}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-foreground">
                                                {currentRound.title}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                Round {currentRound.round_number}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Round body */}
                                <div className="px-4 py-4">
                                    <RoundContent
                                        round={currentRound}
                                        onOpen={(type) => openDialog(currentRound, type)}
                                    />
                                </div>
                            </div>
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
                                    {pastRounds!.length}
                                </Badge>
                            </div>

                            <Accordion type="multiple" className="space-y-2">
                                {pastRounds!.map((round) => {
                                    const statusCfg = STATUS_CONFIG[round.status] ?? STATUS_CONFIG.pending;

                                    return (
                                        <AccordionItem
                                            key={round.id}
                                            value={round.id}
                                            className="border border-border/60 rounded-xl overflow-hidden bg-card"
                                        >
                                            <AccordionTrigger className="px-4 py-3.5 hover:no-underline hover:bg-muted/30 transition-colors [&>svg]:hidden group">
                                                <div className="flex items-center gap-3 w-full">
                                                    <div className={cn(
                                                        "w-7 h-7 rounded-lg border flex items-center justify-center shrink-0",
                                                        round.is_completed
                                                            ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800"
                                                            : "bg-muted border-border/40"
                                                    )}>
                                                        {round.is_completed
                                                            ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                                                            : <span className="text-xs font-bold text-muted-foreground">{round.round_number}</span>
                                                        }
                                                    </div>
                                                    <div className="flex-1 text-left min-w-0">
                                                        <p className="text-sm font-medium text-foreground truncate">
                                                            {round.title}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground mt-0.5">
                                                            Round {round.round_number}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <Badge variant="outline" className={cn("text-xs", statusCfg.className)}>
                                                            {statusCfg.label}
                                                        </Badge>
                                                        <ChevronRight className="w-4 h-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-90" />
                                                    </div>
                                                </div>
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
                                    );
                                })}
                            </Accordion>
                        </section>
                    )}
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