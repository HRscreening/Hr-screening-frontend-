"use client";

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
    format,
    parseISO,
    isToday,
    isTomorrow,
    formatDistanceToNow,
} from "date-fns";
import axios from "@/axiosConfig";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";

import {
    Video,
    Phone,
    MapPin,
    Clock,
    Timer,
    CalendarDays,
    CalendarX2,
    CalendarCheck,
    RefreshCw,
    Loader2,
    AlertCircle,
    Wifi,
    WifiOff,
    CheckCircle2,
    XCircle,
    Users,
    Send,
    CircleDot,
    Hourglass,
    ArrowRight,
    BellRing,
    Inbox,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface AvailableSlot {
    start_time: string;
    end_time: string;
    is_booked: boolean;
}

interface Panelist {
    id: string;
    name: string;
    role: string;
    response_status: "Not Requested" | "Pending" | "Submitted" | "Expired";
    last_requested_at: string | null;
    times_requested: number;
    is_calendar_connected: boolean;
    available_slots: AvailableSlot[];
}

interface RoundData {
    title: string;
    round_number: number;
    timezone: string;
    start_date: string;
    end_date: string;
    interview_type: "In Person" | "Phone" | "Video Call";
    duration_minutes: number;
}

interface ApiResponse {
    round_data: RoundData;
    panelists: Panelist[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function extractErrorMessage(err: any): string {
    const detail = err?.response?.data?.detail;
    if (!detail)
        return err?.response?.data?.message || "Something went wrong. Please try again.";
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail))
        return detail.map((d: any) => d?.msg ?? JSON.stringify(d)).join("; ");
    return JSON.stringify(detail);
}

function initials(name: string): string {
    return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function formatSlotDate(isoStr: string): string {
    const d = parseISO(isoStr);
    if (isToday(d)) return "Today";
    if (isTomorrow(d)) return "Tomorrow";
    return format(d, "EEE, MMM d");
}

function formatSlotTime(isoStr: string): string {
    return format(parseISO(isoStr), "h:mm a");
}

function formatDateRange(start: string, end: string): string {
    return `${format(parseISO(start), "MMM d")} – ${format(parseISO(end), "MMM d, yyyy")}`;
}

function formatLastRequested(isoStr: string | null): string {
    if (!isoStr) return "Never";
    return formatDistanceToNow(parseISO(isoStr), { addSuffix: true });
}

function canRequest(status: Panelist["response_status"]): boolean {
    return status !== "Pending";
}

const AVATAR_PALETTES = [
    { bg: "bg-blue-100 dark:bg-blue-950", text: "text-blue-700 dark:text-blue-300" },
    { bg: "bg-violet-100 dark:bg-violet-950", text: "text-violet-700 dark:text-violet-300" },
    { bg: "bg-emerald-100 dark:bg-emerald-950", text: "text-emerald-700 dark:text-emerald-300" },
    { bg: "bg-amber-100 dark:bg-amber-950", text: "text-amber-700 dark:text-amber-300" },
    { bg: "bg-rose-100 dark:bg-rose-950", text: "text-rose-700 dark:text-rose-300" },
    { bg: "bg-cyan-100 dark:bg-cyan-950", text: "text-cyan-700 dark:text-cyan-300" },
    { bg: "bg-indigo-100 dark:bg-indigo-950", text: "text-indigo-700 dark:text-indigo-300" },
    { bg: "bg-teal-100 dark:bg-teal-950", text: "text-teal-700 dark:text-teal-300" },
];

function avatarPalette(name: string) {
    const idx =
        name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % AVATAR_PALETTES.length;
    return AVATAR_PALETTES[idx];
}

// ─────────────────────────────────────────────────────────────────────────────
// Status config
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
    "Not Requested": {
        label: "Not Requested",
        badgeCn: "border-border/50 bg-muted/50 text-muted-foreground",
        icon: <CircleDot className="h-2.5 w-2.5" />,
        description: "No request has been sent yet",
    },
    Pending: {
        label: "Awaiting Reply",
        badgeCn: "border-amber-400/40 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
        icon: <Hourglass className="h-2.5 w-2.5" />,
        description: "Request sent — waiting for panelist to respond",
    },
    Submitted: {
        label: "Slots Submitted",
        badgeCn: "border-emerald-400/40 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
        icon: <CheckCircle2 className="h-2.5 w-2.5" />,
        description: "Panelist has submitted their availability",
    },
    Expired: {
        label: "Link Expired",
        badgeCn: "border-red-400/30 bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400",
        icon: <XCircle className="h-2.5 w-2.5" />,
        description: "Request link expired — re-send to collect slots",
    },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Atoms
// ─────────────────────────────────────────────────────────────────────────────

function InterviewTypeIcon({ type }: { type: RoundData["interview_type"] }) {
    if (type === "Video Call") return <Video className="h-3 w-3" />;
    if (type === "Phone") return <Phone className="h-3 w-3" />;
    return <MapPin className="h-3 w-3" />;
}

function Skeleton({ className }: { className?: string }) {
    return <div className={`animate-pulse rounded-md bg-muted/60 ${className ?? ""}`} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// Stat card
// ─────────────────────────────────────────────────────────────────────────────

function StatCard({
    icon,
    label,
    value,
    sub,
    accent = "default",
}: {
    icon: React.ReactNode;
    label: string;
    value: number | string;
    sub?: string;
    accent?: "default" | "amber" | "emerald" | "red";
}) {
    const accentMap = {
        default: "text-foreground",
        amber: "text-amber-600 dark:text-amber-400",
        emerald: "text-emerald-600 dark:text-emerald-400",
        red: "text-red-600 dark:text-red-400",
    };
    return (
        <Card className="border-border/50">
            <CardContent className="px-4 py-4">
                <div className="flex items-center gap-1.5 mb-2.5">
                    <span className="text-muted-foreground/50">{icon}</span>
                    <span className="text-[10px] font-semibold text-muted-foreground/55 uppercase tracking-wider">
                        {label}
                    </span>
                </div>
                <p className={`text-[28px] font-bold tabular-nums leading-none tracking-tight ${accentMap[accent]}`}>
                    {value}
                </p>
                {sub && (
                    <p className="text-[11px] text-muted-foreground/50 mt-1.5 leading-tight">{sub}</p>
                )}
            </CardContent>
        </Card>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Slot pills — compact inline chips grouped by date
// ─────────────────────────────────────────────────────────────────────────────

function SlotPillRow({ slots }: { slots: AvailableSlot[] }) {
    if (slots.length === 0) return null;

    const groups: Record<string, AvailableSlot[]> = {};
    for (const s of slots) {
        const key = s.start_time.substring(0, 10);
        if (!groups[key]) groups[key] = [];
        groups[key].push(s);
    }

    return (
        <div className="flex flex-col gap-1.5">
            {Object.entries(groups)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([date, daySlots]) => (
                    <div key={date} className="flex items-center gap-2 min-w-0">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/45 shrink-0 w-15 text-right leading-none">
                            {formatSlotDate(date + "T00:00:00")}
                        </span>
                        <div className="flex flex-wrap gap-1 flex-1 min-w-0">
                            {daySlots.map((s, i) =>
                                s.is_booked ? (
                                    <Tooltip key={i} delayDuration={150}>
                                        <TooltipTrigger asChild>
                                            <span className="inline-flex items-center whitespace-nowrap text-[11px] font-medium px-2 py-0.5 rounded border border-destructive/20 bg-destructive/5 text-destructive/50 line-through cursor-default select-none shrink-0">
                                                {formatSlotTime(s.start_time)} – {formatSlotTime(s.end_time)}
                                            </span>
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="text-xs">
                                            Booked
                                        </TooltipContent>
                                    </Tooltip>
                                ) : (
                                    <Tooltip key={i} delayDuration={150}>
                                        <TooltipTrigger asChild>
                                            <span className="inline-flex items-center whitespace-nowrap text-[11px] font-medium px-2 py-0.5 rounded border border-emerald-400/30 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 cursor-default select-none shrink-0">
                                                {formatSlotTime(s.start_time)} – {formatSlotTime(s.end_time)}
                                            </span>
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="text-xs">
                                            Available
                                        </TooltipContent>
                                    </Tooltip>
                                )
                            )}
                        </div>
                    </div>
                ))}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Panelist row — full-width horizontal card
// ─────────────────────────────────────────────────────────────────────────────

function PanelistRow({
    panelist,
    onRequest,
    requesting,
}: {
    panelist: Panelist;
    onRequest: (id: string) => void;
    requesting: boolean;
}) {
    const palette = avatarPalette(panelist.name);
    const sc = STATUS_CONFIG[panelist.response_status];
    const slotCount = panelist.available_slots.length;
    const availableCount = panelist.available_slots.filter((s) => !s.is_booked).length;
    const bookedCount = panelist.available_slots.filter((s) => s.is_booked).length;
    const hasSlots = slotCount > 0;
    const isRequestable = canRequest(panelist.response_status);

    return (
        <Card className="border-border/50 overflow-hidden">
            <div className="flex items-stretch">

                {/* ── COLUMN 1: Identity — fixed 200px ── */}
                <div className="flex flex-col justify-between gap-3 px-4 py-4 border-r border-border/40 w-50 shrink-0">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div
                            className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${palette.bg} ${palette.text}`}
                        >
                            {initials(panelist.name)}
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground leading-tight truncate">
                                {panelist.name}
                            </p>
                            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{panelist.role}</p>
                        </div>
                    </div>
                    <Tooltip delayDuration={200}>
                        <TooltipTrigger asChild>
                            <Badge
                                variant="outline"
                                className={`flex items-center gap-1 text-[11px] px-2 py-0.5 w-fit font-medium cursor-default ${sc.badgeCn}`}
                            >
                                {sc.icon}
                                {sc.label}
                            </Badge>
                        </TooltipTrigger>
                        <TooltipContent className="text-xs">{sc.description}</TooltipContent>
                    </Tooltip>
                </div>

                {/* ── COLUMN 2: Meta — fixed 210px ── */}
                <div className="flex flex-col justify-center gap-3 px-4 py-4 border-r border-border/40 w-52.5 shrink-0">
                    <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/45 mb-0.5">
                                Last asked
                            </p>
                            <p className="text-xs text-foreground/70 leading-tight">
                                {formatLastRequested(panelist.last_requested_at)}
                            </p>
                        </div>
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/45 mb-0.5">
                                Times sent
                            </p>
                            <p className="text-xs font-semibold tabular-nums text-foreground/70">
                                {panelist.times_requested}
                                <span className="font-normal text-muted-foreground/40 ml-0.5">×</span>
                            </p>
                        </div>
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/45 mb-0.5">
                                Calendar
                            </p>
                            <div className="flex items-center gap-1">
                                {panelist.is_calendar_connected ? (
                                    <>
                                        <Wifi className="h-3 w-3 text-emerald-500 shrink-0" />
                                        <span className="text-xs text-emerald-600 dark:text-emerald-400">Linked</span>
                                    </>
                                ) : (
                                    <>
                                        <WifiOff className="h-3 w-3 text-muted-foreground/40 shrink-0" />
                                        <span className="text-xs text-muted-foreground/55">Not linked</span>
                                    </>
                                )}
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/45 mb-0.5">
                                Slots
                            </p>
                            {hasSlots ? (
                                <p className="text-xs tabular-nums">
                                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                        {availableCount}
                                    </span>
                                    <span className="text-muted-foreground/40"> / {slotCount}</span>
                                </p>
                            ) : (
                                <span className="text-xs text-muted-foreground/40">—</span>
                            )}
                        </div>
                    </div>
                    {hasSlots && (
                        <div>
                            <Progress
                                value={(availableCount / slotCount) * 100}
                                className="h-1"
                            />
                            <div className="flex items-center gap-2.5 mt-1">
                                {availableCount > 0 && (
                                    <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                        {availableCount} open
                                    </span>
                                )}
                                {bookedCount > 0 && (
                                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground/50 font-medium">
                                        <span className="h-1.5 w-1.5 rounded-full bg-destructive/50" />
                                        {bookedCount} booked
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* ── COLUMN 3: Slots — fills remaining space ── */}
                <div className="flex-1 min-w-0 py-4 px-5">
                    {hasSlots ? (
                        <Accordion type="single" collapsible defaultValue="slots">
                            <AccordionItem value="slots" className="border-0">
                                <AccordionTrigger className="py-0 pb-2.5 text-[11px] font-semibold text-muted-foreground/50 uppercase tracking-wider hover:text-foreground hover:no-underline data-[state=open]:text-foreground transition-colors gap-2 [&>svg]:h-3.5 [&>svg]:w-3.5 [&>svg]:text-muted-foreground/40">
                                    <span className="flex items-center gap-1.5">
                                        <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                                        {slotCount} slot{slotCount !== 1 ? "s" : ""}
                                        {availableCount > 0 && (
                                            <span className="font-normal normal-case tracking-normal text-emerald-600 dark:text-emerald-400">
                                                · {availableCount} open
                                            </span>
                                        )}
                                        {bookedCount > 0 && (
                                            <span className="font-normal normal-case tracking-normal text-muted-foreground/40">
                                                · {bookedCount} booked
                                            </span>
                                        )}
                                    </span>
                                </AccordionTrigger>
                                <AccordionContent className="pb-0 pt-0">
                                    <SlotPillRow slots={panelist.available_slots} />
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    ) : (
                        <div className="h-full flex items-center py-1">
                            <div className="flex items-center gap-3 py-2.5 px-3.5 rounded-lg border border-dashed border-border/50 bg-muted/10 w-full">
                                <CalendarX2 className="h-5 w-5 text-muted-foreground/25 shrink-0" />
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground/60 leading-tight">
                                        No availability yet
                                    </p>
                                    <p className="text-[11px] text-muted-foreground/40 mt-0.5">
                                        {panelist.response_status === "Pending"
                                            ? "Request sent — awaiting their response"
                                            : panelist.response_status === "Expired"
                                            ? "Request expired — send a new one"
                                            : "Send a request to collect availability"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── COLUMN 4: Action — fixed 130px ── */}
                <div className="flex flex-col items-center justify-center gap-2 px-4 py-4 border-l border-border/40 w-32.5 shrink-0">
                    <Button
                        size="sm"
                        variant={isRequestable ? "default" : "outline"}
                        className="h-8 text-xs gap-1.5 w-full justify-center"
                        disabled={!isRequestable || requesting}
                        onClick={() => onRequest(panelist.id)}
                    >
                        {requesting ? (
                            <>
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Sending…
                            </>
                        ) : isRequestable ? (
                            <>
                                <Send className="h-3 w-3" />
                                {panelist.response_status === "Expired" ? "Re-request" : "Request"}
                            </>
                        ) : (
                            <>
                                <Clock className="h-3 w-3" />
                                Awaiting
                            </>
                        )}
                    </Button>
                    {hasSlots && isRequestable && (
                        <button
                            className="text-[10px] text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors flex items-center gap-1 mt-0.5"
                            onClick={() => onRequest(panelist.id)}
                            disabled={requesting}
                        >
                            <BellRing className="h-2.5 w-2.5" />
                            Send reminder
                        </button>
                    )}
                </div>
            </div>
        </Card>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Loading skeleton
// ─────────────────────────────────────────────────────────────────────────────

function RowSkeleton() {
    return (
        <Card className="border-border/50 overflow-hidden">
            <div className="flex items-stretch h-22">
                <div className="flex items-center gap-2.5 px-4 py-4 border-r border-border/40 w-50 shrink-0">
                    <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                    <div className="space-y-1.5 flex-1 min-w-0">
                        <Skeleton className="h-3.5 w-24" />
                        <Skeleton className="h-3 w-16" />
                    </div>
                </div>
                <div className="flex items-center px-4 py-4 border-r border-border/40 w-52.5 shrink-0">
                    <div className="grid grid-cols-2 gap-2.5 w-full">
                        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-7" />)}
                    </div>
                </div>
                <div className="flex-1 px-5 py-4 flex items-center gap-1.5 flex-wrap">
                    {[80, 72, 68, 76, 70].map((w, i) => (
                        // @ts-ignore
                        <Skeleton key={i} className="h-6 rounded" style={{ width: w }} />
                    ))}
                </div>
                <div className="px-4 py-4 border-l border-border/40 w-32.5 shrink-0 flex items-center">
                    <Skeleton className="h-8 w-full rounded-md" />
                </div>
            </div>
        </Card>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

export default function ViewSlots() {
    const { round_config_id } = useParams<{ round_config_id: string }>();

    const [data, setData] = useState<ApiResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [requestingIds, setRequestingIds] = useState<Set<string>>(new Set());
    const [requestingAll, setRequestingAll] = useState(false);

    useEffect(() => {
        if (!round_config_id) return;
        (async () => {
            try {
                const res = await axios.get(`/round/${round_config_id}/slots`);
                setData(res.data);
            } catch (err: any) {
                setFetchError(extractErrorMessage(err));
            } finally {
                setLoading(false);
            }
        })();
    }, [round_config_id]);

    const handleRequestSingle = async (panelistId: string) => {
        setRequestingIds((prev) => new Set(prev).add(panelistId));
        try {
            await axios.post(`/round/request-panelists-for-slots/${round_config_id}`, {
                panelist_ids: [panelistId],
            });
            toast.success("Request sent successfully.");
            setData((prev) =>
                prev
                    ? {
                          ...prev,
                          panelists: prev.panelists.map((p) =>
                              p.id === panelistId
                                  ? {
                                        ...p,
                                        response_status: "Pending",
                                        last_requested_at: new Date().toISOString(),
                                        times_requested: p.times_requested + 1,
                                    }
                                  : p
                          ),
                      }
                    : prev
            );
        } catch (err: any) {
            toast.error(extractErrorMessage(err));
        } finally {
            setRequestingIds((prev) => {
                const next = new Set(prev);
                next.delete(panelistId);
                return next;
            });
        }
    };

    const handleRequestAll = async () => {
        if (!data) return;
        const eligible = data.panelists.filter((p) => canRequest(p.response_status));
        if (eligible.length === 0) return;
        setRequestingAll(true);
        try {
            await axios.post(`/round/request-all-panelists-for-slots/${round_config_id}`);
            toast.success(
                `Requested slots from ${eligible.length} panelist${eligible.length > 1 ? "s" : ""}.`
            );
            setData((prev) =>
                prev
                    ? {
                          ...prev,
                          panelists: prev.panelists.map((p) =>
                              canRequest(p.response_status)
                                  ? {
                                        ...p,
                                        response_status: "Pending",
                                        last_requested_at: new Date().toISOString(),
                                        times_requested: p.times_requested + 1,
                                    }
                                  : p
                          ),
                      }
                    : prev
            );
        } catch (err: any) {
            toast.error(extractErrorMessage(err));
        } finally {
            setRequestingAll(false);
        }
    };

    const panelists = data?.panelists ?? [];
    const eligibleCount = panelists.filter((p) => canRequest(p.response_status)).length;
    const allPending = eligibleCount === 0 && panelists.length > 0;
    const respondedCount = panelists.filter((p) => p.available_slots.length > 0).length;
    const awaitingCount = panelists.filter((p) => p.response_status === "Pending").length;
    const expiredCount = panelists.filter((p) => p.response_status === "Expired").length;
    const notRequestedCount = panelists.filter((p) => p.response_status === "Not Requested").length;
    const needsActionCount = expiredCount + notRequestedCount;
    const totalSlots = panelists.reduce((acc, p) => acc + p.available_slots.length, 0);
    const totalAvailable = panelists.reduce(
        (acc, p) => acc + p.available_slots.filter((s) => !s.is_booked).length,
        0
    );

    const round_data = data?.round_data;

    // ── Always render the shell so bg is immediate — no white flash ──────────
    return (
        <TooltipProvider>
            <div className="min-h-screen bg-background">

                {/* ── Sticky header ──────────────────────────────────────── */}
                <div className="border-b border-border/50 bg-background/95 backdrop-blur sticky top-0 z-10">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
                        {loading || !round_data ? (
                            <div className="flex items-center justify-between gap-4">
                                <div className="space-y-2">
                                    <Skeleton className="h-5 w-44" />
                                    <div className="flex gap-2">
                                        <Skeleton className="h-5 w-16 rounded-full" />
                                        <Skeleton className="h-5 w-20 rounded-full" />
                                        <Skeleton className="h-5 w-14 rounded-full" />
                                    </div>
                                </div>
                                <Skeleton className="h-8 w-32 rounded-md" />
                            </div>
                        ) : (
                            <div className="flex items-start justify-between gap-3 flex-wrap">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h1 className="text-base font-bold tracking-tight truncate">
                                            {round_data.title}
                                        </h1>
                                        <Badge variant="secondary" className="text-[11px] px-2 py-0.5 shrink-0">
                                            Round {round_data.round_number}
                                        </Badge>
                                        <Badge
                                            variant="outline"
                                            className="flex items-center gap-1 text-[11px] px-2 py-0.5 shrink-0"
                                        >
                                            <InterviewTypeIcon type={round_data.interview_type} />
                                            {round_data.interview_type}
                                        </Badge>
                                        <Badge
                                            variant="outline"
                                            className="flex items-center gap-1 text-[11px] px-2 py-0.5 shrink-0 font-normal"
                                        >
                                            <Timer className="h-2.5 w-2.5 text-muted-foreground" />
                                            {round_data.duration_minutes} min
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {formatDateRange(round_data.start_date, round_data.end_date)}
                                        {" · "}
                                        {round_data.timezone}
                                    </p>
                                </div>
                                <Button
                                    size="sm"
                                    className="h-8 text-xs gap-1.5 shrink-0"
                                    disabled={allPending || requestingAll}
                                    onClick={handleRequestAll}
                                >
                                    {requestingAll ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                        <RefreshCw className="h-3.5 w-3.5" />
                                    )}
                                    {requestingAll
                                        ? "Requesting…"
                                        : allPending
                                        ? "All requested"
                                        : `Request all (${eligibleCount})`}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Body ────────────────────────────────────────────────── */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 pb-12 space-y-5">

                    {/* ── Error ── */}
                    {fetchError && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{fetchError}</AlertDescription>
                        </Alert>
                    )}

                    {/* ── Skeleton body ── */}
                    {loading && (
                        <>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {[1, 2, 3, 4].map((i) => (
                                    <Card key={i} className="border-border/50">
                                        <CardContent className="px-4 py-4 space-y-3">
                                            <Skeleton className="h-3 w-24" />
                                            <Skeleton className="h-8 w-12" />
                                            <Skeleton className="h-3 w-32" />
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                            <div className="space-y-2.5">
                                {[1, 2, 3].map((i) => <RowSkeleton key={i} />)}
                            </div>
                        </>
                    )}

                    {/* ── Real content ── */}
                    {!loading && data && (
                        <>
                            {/* Stats row */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <StatCard
                                    icon={<Users className="h-3.5 w-3.5" />}
                                    label="Panelists"
                                    value={panelists.length}
                                    sub={respondedCount > 0 ? `${respondedCount} shared availability` : "None responded yet"}
                                />
                                <StatCard
                                    icon={<Inbox className="h-3.5 w-3.5" />}
                                    label="Slots collected"
                                    value={totalSlots}
                                    sub={
                                        totalSlots === 0
                                            ? "Pending availability"
                                            : `From ${respondedCount} panelist${respondedCount !== 1 ? "s" : ""}`
                                    }
                                    accent={totalSlots > 0 ? "default" : "amber"}
                                />
                                <StatCard
                                    icon={<CalendarCheck className="h-3.5 w-3.5" />}
                                    label="Available"
                                    value={totalAvailable}
                                    sub={totalAvailable > 0 ? "Ready to schedule" : "No open slots yet"}
                                    accent={totalAvailable > 0 ? "emerald" : "default"}
                                />
                                <StatCard
                                    icon={<Hourglass className="h-3.5 w-3.5" />}
                                    label="Awaiting"
                                    value={awaitingCount + notRequestedCount}
                                    sub={
                                        expiredCount > 0
                                            ? `${expiredCount} expired — needs action`
                                            : notRequestedCount > 0
                                            ? `${notRequestedCount} not asked yet`
                                            : awaitingCount > 0
                                            ? "Requests sent"
                                            : "All responded"
                                    }
                                    accent={
                                        expiredCount > 0
                                            ? "red"
                                            : awaitingCount + notRequestedCount > 0
                                            ? "amber"
                                            : "default"
                                    }
                                />
                            </div>

                            {/* Action banner */}
                            {needsActionCount > 0 && (
                                <Alert className="border-amber-400/30 bg-amber-50/40 dark:bg-amber-950/20">
                                    <AlertCircle className="h-4 w-4 text-amber-500" />
                                    <AlertDescription className="flex items-center justify-between gap-3 flex-wrap">
                                        <span className="text-sm text-amber-700 dark:text-amber-400">
                                            {notRequestedCount > 0 && (
                                                <>
                                                    <strong>
                                                        {notRequestedCount} panelist{notRequestedCount > 1 ? "s" : ""}
                                                    </strong>{" "}
                                                    haven't been asked yet.{" "}
                                                </>
                                            )}
                                            {expiredCount > 0 && (
                                                <>
                                                    <strong>
                                                        {expiredCount} request{expiredCount > 1 ? "s" : ""}
                                                    </strong>{" "}
                                                    expired and need re-sending.
                                                </>
                                            )}
                                        </span>
                                        <button
                                            className="flex items-center gap-1 text-sm font-semibold text-amber-700 dark:text-amber-400 hover:underline underline-offset-2 shrink-0 disabled:opacity-50"
                                            onClick={handleRequestAll}
                                            disabled={requestingAll}
                                        >
                                            Send now <ArrowRight className="h-3.5 w-3.5" />
                                        </button>
                                    </AlertDescription>
                                </Alert>
                            )}

                            {/* Panelists section */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2.5 flex-wrap">
                                        <p className="text-[11px] font-semibold text-muted-foreground/55 uppercase tracking-wider">
                                            Panelists · {panelists.length}
                                        </p>
                                        <div className="hidden sm:flex items-center gap-1.5">
                                            {respondedCount > 0 && (
                                                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300/30">
                                                    {respondedCount} with slots
                                                </span>
                                            )}
                                            {awaitingCount > 0 && (
                                                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-300/30">
                                                    {awaitingCount} pending
                                                </span>
                                            )}
                                            {needsActionCount > 0 && (
                                                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/40">
                                                    {needsActionCount} need action
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="hidden sm:flex items-center gap-3 text-[11px] text-muted-foreground/45">
                                        <span className="flex items-center gap-1.5">
                                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                            Available
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <span className="h-1.5 w-1.5 rounded-full bg-destructive/60" />
                                            Booked
                                        </span>
                                    </div>
                                </div>

                                {panelists.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 gap-3 border border-dashed border-border/40 rounded-xl">
                                        <Users className="h-10 w-10 text-muted-foreground/15" />
                                        <p className="text-sm font-medium text-muted-foreground/50">No panelists assigned</p>
                                        <p className="text-xs text-muted-foreground/35">
                                            Add panelists to this round to get started.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-2.5">
                                        {panelists.map((p) => (
                                            <PanelistRow
                                                key={p.id}
                                                panelist={p}
                                                onRequest={handleRequestSingle}
                                                requesting={requestingIds.has(p.id)}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </TooltipProvider>
    )}