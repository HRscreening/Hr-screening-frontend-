"use client";

import { useEffect, useState, useMemo } from "react";
import { format, parseISO, isToday, isTomorrow } from "date-fns";
import { useLocation } from "react-router-dom";
import axios from "@/axiosConfig";

// shadcn/ui
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

// Icons
import {
    Clock,
    Video,
    AlertCircle,
    CheckCircle2,
    Timer,
    CalendarDays,
    CalendarCheck,
    Loader2,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface Slot {
    id: string;
    slot_start: string;
    slot_end: string;
}

interface PanelFormData {
    title: string;
    interview_type: string | null;
    duration_minutes: number;
    slots: Slot[];
}

interface SequentialFormData {
    title: string;
    interview_type: string | null;
    duration_minutes: number;
    panelist_slots: Record<string, Slot[]>;
}

type BookingResponse =
    | { status: "open"; panel_mode: "panel"; data: PanelFormData }
    | { status: "open"; panel_mode: "sequential"; data: SequentialFormData }
    | { status: "already_booked"; message: string; scheduled_start?: string; scheduled_end?: string }
    | { status: "expired"; message: string }
    | { status: "unavailable"; message: string };

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatTime(isoStr: string): string {
    const d = parseISO(isoStr);
    return format(d, "hh:mm a");
}

function formatDateLabel(dateKey: string): string {
    const d = parseISO(dateKey);
    if (isToday(d)) return "Today";
    if (isTomorrow(d)) return "Tomorrow";
    return format(d, "EEEE, MMM d");
}

/** Group slots by date (YYYY-MM-DD) */
function groupByDate(slots: Slot[]): Record<string, Slot[]> {
    const groups: Record<string, Slot[]> = {};
    for (const slot of slots) {
        const dateKey = slot.slot_start.substring(0, 10);
        if (!groups[dateKey]) groups[dateKey] = [];
        groups[dateKey].push(slot);
    }
    // Sort within each group
    for (const key of Object.keys(groups)) {
        groups[key].sort((a, b) => a.slot_start.localeCompare(b.slot_start));
    }
    return groups;
}

// ─────────────────────────────────────────────────────────────────────────────
// StatusScreen
// ─────────────────────────────────────────────────────────────────────────────

function StatusScreen({
    icon,
    iconBg,
    title,
    message,
    extra,
}: {
    icon: React.ReactNode;
    iconBg: string;
    title: string;
    message?: string;
    extra?: React.ReactNode;
}) {
    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="max-w-sm w-full text-center space-y-4">
                <div
                    className={`h-16 w-16 rounded-full ${iconBg} flex items-center justify-center mx-auto`}
                >
                    {icon}
                </div>
                <div className="space-y-1">
                    <h2 className="text-base font-semibold">{title}</h2>
                    {message && (
                        <p className="text-sm text-muted-foreground">{message}</p>
                    )}
                </div>
                {extra}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// SlotCard — a single selectable time slot
// ─────────────────────────────────────────────────────────────────────────────

function SlotCard({
    slot,
    selected,
    onSelect,
}: {
    slot: Slot;
    selected: boolean;
    onSelect: () => void;
    duration: number;
}) {
    return (
        <button
            type="button"
            onClick={onSelect}
            className={`
                group relative w-full text-left rounded-lg border px-3 py-2.5
                transition-all duration-150 cursor-pointer
                ${
                    selected
                        ? "border-primary bg-primary/5 ring-1 ring-primary/30 shadow-sm"
                        : "border-border/60 bg-background hover:border-primary/40 hover:bg-muted/30"
                }
            `}
        >
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                    {/* Radio indicator */}
                    <div
                        className={`
                            h-4 w-4 rounded-full border-2 shrink-0 transition-all duration-150
                            flex items-center justify-center
                            ${
                                selected
                                    ? "border-primary bg-primary"
                                    : "border-muted-foreground/30 group-hover:border-primary/50"
                            }
                        `}
                    >
                        {selected && (
                            <div className="h-1.5 w-1.5 rounded-full bg-white" />
                        )}
                    </div>

                    {/* Time display */}
                    <div className="min-w-0">
                        <p
                            className={`text-sm font-medium ${
                                selected ? "text-primary" : "text-foreground"
                            }`}
                        >
                            {formatTime(slot.slot_start)} — {formatTime(slot.slot_end)}
                        </p>
                    </div>
                </div>

                {/* Duration badge */}
                {/* <Badge
                    variant="secondary"
                    className={`text-[10px] px-1.5 py-0 shrink-0 ${
                        selected
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                    }`}
                >
                    {duration}m
                </Badge> */}
            </div>
        </button>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// DateGroup — slots under a date heading
// ─────────────────────────────────────────────────────────────────────────────

function DateGroup({
    dateKey,
    slots,
    selectedId,
    onSelect,
    duration,
}: {
    dateKey: string;
    slots: Slot[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    duration: number;
}) {
    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-center gap-2 mb-2.5">
                <CalendarDays className="h-3.5 w-3.5 text-muted-foreground/50" />
                <h3 className="text-xs font-semibold text-foreground/70 uppercase tracking-wide">
                    {formatDateLabel(dateKey)}
                </h3>
                <span className="text-[10px] text-muted-foreground/40">
                    {slots.length} {slots.length === 1 ? "slot" : "slots"}
                </span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
                {slots.map((slot) => (
                    <SlotCard
                        key={slot.id}
                        slot={slot}
                        selected={selectedId === slot.id}
                        onSelect={() => onSelect(slot.id)}
                        duration={duration}
                    />
                ))}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// SessionPicker — one "session" in SEQUENTIAL mode (no panelist info shown)
// ─────────────────────────────────────────────────────────────────────────────

function SessionPicker({
    sessionIndex,
    total,
    slots,
    selectedId,
    onSelect,
    duration,
}: {
    sessionIndex: number;
    total: number;
    slots: Slot[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    duration: number;
}) {
    const grouped = useMemo(() => groupByDate(slots), [slots]);
    const sortedDates = Object.keys(grouped).sort();

    return (
        <div className="animate-in fade-in slide-in-from-bottom-3 duration-250">
            {/* Session header */}
            <div className="flex items-center gap-3 mb-4">
                <div
                    className={`
                        flex items-center justify-center h-7 w-7 rounded-full text-xs font-bold shrink-0 transition-colors
                        ${selectedId ? "bg-emerald-500/15 text-emerald-600" : "bg-primary/10 text-primary"}
                    `}
                >
                    {selectedId ? (
                        <CheckCircle2 className="h-4 w-4" />
                    ) : (
                        sessionIndex + 1
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-foreground/80">
                        Pick a time slot
                    </h3>
                    <p className="text-[11px] text-muted-foreground/50">
                        {selectedId ? "Done" : `Step ${sessionIndex + 1} of ${total}`}
                    </p>
                </div>
            </div>

            <div className="space-y-5 pl-4 border-l-2 border-border/30 ml-3.5">
                {sortedDates.map((dateKey) => (
                    <DateGroup
                        key={dateKey}
                        dateKey={dateKey}
                        slots={grouped[dateKey]}
                        selectedId={selectedId}
                        onSelect={onSelect}
                        duration={duration}
                    />
                ))}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// SelectionSummary — desktop sidebar + mobile bottom bar
// ─────────────────────────────────────────────────────────────────────────────

function SelectionSummary({
    panelMode,
    selections,
    allSlots,
    sessionLabels,
    submitting,
    onSubmit,
    compact,
}: {
    panelMode: "panel" | "sequential";
    selections: Record<string, string>; // key → slot_id
    allSlots: Slot[];
    sessionLabels: string[];
    duration: number;
    submitting: boolean;
    onSubmit: () => void;
    compact?: boolean;
}) {
    const selectedCount = Object.values(selections).filter(Boolean).length;
    const requiredCount = sessionLabels.length;
    const canSubmit = selectedCount === requiredCount && selectedCount > 0;

    // Resolve selected slot details
    const selectedDetails = sessionLabels
        .map((label, i) => {
            const key = panelMode === "panel" ? "panel" : sessionLabels[i];
            const slotId = selections[key];
            const slot = slotId ? allSlots.find((s) => s.id === slotId) : null;
            return { label, slot };
        })
        .filter((d) => d.slot);

    if (compact) {
        return (
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="text-center shrink-0">
                        <p className="text-lg font-bold tabular-nums leading-none">
                            {selectedCount}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                            {selectedCount === 1 ? "selected" : "selected"}
                        </p>
                    </div>
                    {panelMode === "sequential" && selectedCount < requiredCount && (
                        <p className="text-[10px] text-muted-foreground/60 shrink-0">
                            {requiredCount - selectedCount} left
                        </p>
                    )}
                    {selectedDetails.length > 0 && (
                        <p className="text-xs text-muted-foreground truncate flex-1 ml-1">
                            {selectedDetails
                                .map((d) => formatTime(d.slot!.slot_start))
                                .join(", ")}
                        </p>
                    )}
                </div>
                <Button
                    type="button"
                    className="h-10 px-6 font-medium text-sm shrink-0"
                    disabled={!canSubmit || submitting}
                    onClick={onSubmit}
                >
                    {submitting ? (
                        <span className="flex items-center gap-2">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Booking…
                        </span>
                    ) : (
                        "Confirm Booking"
                    )}
                </Button>
            </div>
        );
    }

    // Desktop sidebar
    return (
        <div className="space-y-4">
            {/* Stats */}
            <div className="rounded-lg bg-muted/50 px-3 py-2.5 text-center">
                <p className="text-2xl font-bold tabular-nums leading-none">
                    {selectedCount}{panelMode === "sequential" && (
                        <span className="text-base font-normal text-muted-foreground"> / {requiredCount}</span>
                    )}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Selected</p>
            </div>

            {/* Selected slots list */}
            {selectedDetails.length > 0 ? (
                <div className="space-y-3">
                    {selectedDetails.map((d, i) => (
                        <div key={i} className="space-y-1">
                            {panelMode === "sequential" && (
                                <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider">
                                    Slot {i + 1}
                                </p>
                            )}
                            <div className="flex items-center gap-2 rounded-md bg-primary/5 border border-primary/15 px-3 py-2">
                                <Clock className="h-3 w-3 text-primary/60 shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-xs font-medium text-foreground truncate">
                                        {formatTime(d.slot!.slot_start)} —{" "}
                                        {formatTime(d.slot!.slot_end)}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">
                                        {formatDateLabel(
                                            d.slot!.slot_start.substring(0, 10)
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="py-5 text-center">
                    <CalendarCheck className="h-6 w-6 text-muted-foreground/15 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground/40">
                        Select a slot to continue
                    </p>
                </div>
            )}

            <Separator className="opacity-40" />

            {!canSubmit && selectedCount > 0 && panelMode === "sequential" && (
                <Alert className="py-2.5 border-amber-500/30 bg-amber-500/5">
                    <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                    <AlertDescription className="text-xs text-amber-700">
                        Pick a slot for each step to continue.
                    </AlertDescription>
                </Alert>
            )}

            <Button
                type="button"
                className="w-full h-9 font-medium text-sm"
                disabled={!canSubmit || submitting}
                onClick={onSubmit}
            >
                {submitting ? (
                    <span className="flex items-center gap-2">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Booking…
                    </span>
                ) : (
                    "Confirm Booking"
                )}
            </Button>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// CandidateSlotBooking — main component
// Route: /interview/book?token=<jwt>
// ─────────────────────────────────────────────────────────────────────────────

export default function CandidateSlotBooking() {
    const location = useLocation();
    const token = new URLSearchParams(location.search).get("token");

    const [response, setResponse] = useState<BookingResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [bookingResult, setBookingResult] = useState<{
        scheduled_start: string;
        scheduled_end: string;
        meet_link?: string;
    } | null>(null);

    // selections: key → slot_id
    // For PANEL mode: { "panel": "slot-uuid" }
    // For SEQUENTIAL mode: { "panelist@email.com": "slot-uuid", ... }
    const [selections, setSelections] = useState<Record<string, string>>({});

    // ── Fetch booking form ───────────────────────────────────────────────
    useEffect(() => {
        if (!token) {
            setFetchError(
                "No token found. Please use the link from your email."
            );
            setLoading(false);
            return;
        }
        (async () => {
            try {
                const res = await axios.get(
                    `/interview/booking/form?token=${token}`
                );
                setResponse(res.data);
            } catch (err: any) {
                setFetchError(
                    err?.response?.data?.detail ||
                        err?.response?.data?.message ||
                        "Failed to load booking form. Please try again or contact HR."
                );
            } finally {
                setLoading(false);
            }
        })();
    }, [token]);

    // ── Derived data ─────────────────────────────────────────────────────

    const panelMode =
        response?.status === "open" ? response.panel_mode : null;

    // All slots flattened (for lookup in summary)
    const allSlots: Slot[] = useMemo(() => {
        if (response?.status !== "open") return [];
        if (response.panel_mode === "panel") {
            return response.data.slots;
        }
        return Object.values(response.data.panelist_slots).flat();
    }, [response]);

    // Session keys & labels for sequential mode
    const sessionKeys: string[] = useMemo(() => {
        if (response?.status !== "open" || response.panel_mode !== "sequential")
            return [];
        return Object.keys(response.data.panelist_slots);
    }, [response]);

    // For summary: labels are "panel" (panel mode) or email keys (sequential)
    const sessionLabels: string[] = useMemo(() => {
        if (!panelMode) return [];
        if (panelMode === "panel") return ["panel"];
        return sessionKeys;
    }, [panelMode, sessionKeys]);

    // PANEL mode: group flat slots by date
    const panelGrouped = useMemo(() => {
        if (response?.status !== "open" || response.panel_mode !== "panel") return {};
        return groupByDate(response.data.slots);
    }, [response]);

    const panelDateKeys = Object.keys(panelGrouped).sort();

    // ── Handlers ─────────────────────────────────────────────────────────

    const handleSelect = (key: string, slotId: string) => {
        setSelections((prev) => ({
            ...prev,
            [key]: prev[key] === slotId ? "" : slotId, // toggle
        }));
    };

    const handleSubmit = async () => {
        if (!token || response?.status !== "open") return;
        setSubmitting(true);
        try {
            if (response.panel_mode === "panel") {
                const slotId = selections["panel"];
                if (!slotId) {
                    toast.error("Please select a time slot.");
                    setSubmitting(false);
                    return;
                }
                const res = await axios.post(
                    `/interview/booking/book-panel?token=${token}`,
                    { slot_id: slotId }
                );
                setBookingResult(res.data);
                toast.success("Interview booked successfully!");
            } else {
                // Sequential
                const bookings = sessionKeys.map((email) => ({
                    panelist_email: email,
                    slot_id: selections[email],
                }));
                const missing = bookings.filter((b) => !b.slot_id);
                if (missing.length > 0) {
                    toast.error(
                        `Please pick a slot for all ${sessionKeys.length} steps.`
                    );
                    setSubmitting(false);
                    return;
                }
                const res = await axios.post(
                    `/interview/booking/book-sequential?token=${token}`,
                    { bookings }
                );
                setBookingResult(res.data);
                toast.success("Interview booked successfully!");
            }
        } catch (err: any) {
            toast.error(
                err?.response?.data?.detail ||
                    err?.response?.data?.message ||
                    "Something went wrong. Please try again."
            );
        } finally {
            setSubmitting(false);
        }
    };

    // ── Loading ──────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-7 w-7 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    <p className="text-sm text-muted-foreground">
                        Loading your booking…
                    </p>
                </div>
            </div>
        );
    }

    // ── Fetch error ──────────────────────────────────────────────────────
    if (fetchError) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="max-w-sm w-full">
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{fetchError}</AlertDescription>
                    </Alert>
                </div>
            </div>
        );
    }

    // ── Non-open statuses ────────────────────────────────────────────────
    if (response && response.status !== "open") {
        if (response.status === "already_booked") {
            return (
                <StatusScreen
                    icon={
                        <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                    }
                    iconBg="bg-emerald-500/10"
                    title="Already Booked"
                    message={response.message}
                    extra={
                        response.scheduled_start ? (
                            <div className="inline-flex items-center gap-2 rounded-lg bg-muted/50 border border-border/50 px-4 py-2.5 text-sm">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">
                                    {formatTime(response.scheduled_start)}
                                </span>
                                <span className="text-muted-foreground">—</span>
                                <span className="font-medium">
                                    {formatTime(response.scheduled_end!)}
                                </span>
                            </div>
                        ) : undefined
                    }
                />
            );
        }

        const screens: Record<
            string,
            { icon: React.ReactNode; bg: string; title: string }
        > = {
            expired: {
                icon: (
                    <AlertCircle className="h-8 w-8 text-destructive" />
                ),
                bg: "bg-destructive/10",
                title: "Link Expired",
            },
            unavailable: {
                icon: <Timer className="h-8 w-8 text-amber-500" />,
                bg: "bg-amber-500/10",
                title: "Not Available Yet",
            },
        };
        const s = screens[response.status] ?? {
            icon: null,
            bg: "bg-muted",
            title: response.status,
        };
        return (
            <StatusScreen
                icon={s.icon}
                iconBg={s.bg}
                title={s.title}
                message={response.message}
            />
        );
    }

    // ── Booking success ──────────────────────────────────────────────────
    if (bookingResult) {
        return (
            <StatusScreen
                icon={<CheckCircle2 className="h-8 w-8 text-emerald-500" />}
                iconBg="bg-emerald-500/10"
                title="Interview Booked!"
                message="You're all set. A confirmation email is on its way."
                extra={
                    <div className="space-y-3">
                        <div className="inline-flex items-center gap-2 rounded-lg bg-muted/50 border border-border/50 px-4 py-2.5 text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                                {formatTime(bookingResult.scheduled_start)}
                            </span>
                            <span className="text-muted-foreground">—</span>
                            <span className="font-medium">
                                {formatTime(bookingResult.scheduled_end)}
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {formatDateLabel(
                                bookingResult.scheduled_start.substring(0, 10)
                            )}
                        </p>
                        {bookingResult.meet_link && (
                            <a
                                href={bookingResult.meet_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                            >
                                <Video className="h-4 w-4" />
                                Join Meeting Link
                            </a>
                        )}
                    </div>
                }
            />
        );
    }

    // guard: only "open" status from here
    if (response?.status !== "open") return null;

    const data = response.data;

    // ── Main render ──────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-background">
            {/* ── Top header bar ─────────────────────────────────────────── */}
            <div className="border-b border-border/50 bg-background/95 backdrop-blur sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-base font-bold tracking-tight truncate">
                                    {data.title}
                                </h1>
                                {data.interview_type && (
                                    <Badge
                                        variant="secondary"
                                        className="flex items-center gap-1 text-[11px] px-2 py-0.5 shrink-0"
                                    >
                                        <Video className="h-2.5 w-2.5" />
                                        {data.interview_type}
                                    </Badge>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Choose your preferred interview time
                                {response.panel_mode === "sequential" &&
                                    sessionKeys.length > 1 &&
                                    ` — ${sessionKeys.length} slots needed`}
                            </p>
                        </div>

                        {/* Duration badge */}
                        <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                            <Badge
                                variant="outline"
                                className="flex items-center gap-1 text-[11px] font-normal px-2 py-0.5"
                            >
                                <Timer className="h-2.5 w-2.5 text-muted-foreground" />
                                {data.duration_minutes} min / slot
                            </Badge>
                        </div>
                    </div>

                    {/* Mobile meta row */}
                    <div className="flex sm:hidden items-center gap-2 mt-2 flex-wrap">
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Timer className="h-3 w-3" />
                            {data.duration_minutes} min / slot
                        </span>
                        {response.panel_mode === "sequential" && (
                            <>
                                <span className="text-muted-foreground/30 text-xs">
                                    ·
                                </span>
                                <span className="text-[11px] text-muted-foreground">
                                    {sessionKeys.length} slots needed
                                </span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Body ────────────────────────────────────────────────────── */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-28 lg:pb-10">
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8 items-start">
                    {/* ── LEFT: Slot picker ──────────────────────────────── */}
                    <div>
                        {response.panel_mode === "panel" ? (
                            // ── PANEL MODE ──────────────────────────────
                            <div>
                                <p className="text-sm font-medium text-foreground/70 mb-5">
                                    Select an available time slot
                                </p>

                                {panelDateKeys.length === 0 ? (
                                    <div className="py-16 text-center border border-dashed border-border/40 rounded-xl">
                                        <CalendarCheck className="h-8 w-8 text-muted-foreground/15 mx-auto mb-3" />
                                        <p className="text-sm font-medium text-muted-foreground/50 mb-0.5">
                                            No slots available
                                        </p>
                                        <p className="text-xs text-muted-foreground/35">
                                            All slots may have been booked.
                                            Please contact HR.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {panelDateKeys.map((dateKey) => (
                                            <DateGroup
                                                key={dateKey}
                                                dateKey={dateKey}
                                                slots={panelGrouped[dateKey]}
                                                selectedId={
                                                    selections["panel"] || null
                                                }
                                                onSelect={(id) =>
                                                    handleSelect("panel", id)
                                                }
                                                duration={data.duration_minutes}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            // ── SEQUENTIAL MODE ─────────────────────────
                            <div>
                                <p className="text-sm font-medium text-foreground/70 mb-5">
                                    Choose your preferred times
                                </p>

                                {sessionKeys.length === 0 ? (
                                    <div className="py-16 text-center border border-dashed border-border/40 rounded-xl">
                                        <CalendarCheck className="h-8 w-8 text-muted-foreground/15 mx-auto mb-3" />
                                        <p className="text-sm font-medium text-muted-foreground/50">
                                            No sessions available
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-8">
                                        {sessionKeys.map((email, i) => (
                                            <SessionPicker
                                                key={email}
                                                sessionIndex={i}
                                                total={sessionKeys.length}
                                                slots={
                                                    (
                                                        data as SequentialFormData
                                                    ).panelist_slots[email]
                                                }
                                                selectedId={
                                                    selections[email] || null
                                                }
                                                onSelect={(id) =>
                                                    handleSelect(email, id)
                                                }
                                                duration={data.duration_minutes}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* ── RIGHT: Sticky desktop summary ──────────────────── */}
                    <div className="hidden lg:block lg:sticky lg:top-[4.6rem]">
                        <Card className="border-border/50">
                            <CardContent className="p-5">
                                <p className="text-sm font-semibold mb-4 text-foreground/80">
                                    Your Selection
                                </p>
                                <SelectionSummary
                                    panelMode={response.panel_mode}
                                    selections={selections}
                                    allSlots={allSlots}
                                    sessionLabels={sessionLabels}
                                    duration={data.duration_minutes}
                                    submitting={submitting}
                                    onSubmit={handleSubmit}
                                />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* ── Mobile sticky bottom bar ────────────────────────────────── */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 z-20 bg-background/95 backdrop-blur border-t border-border/50 px-4 py-3 safe-area-bottom">
                <SelectionSummary
                    panelMode={response.panel_mode}
                    selections={selections}
                    allSlots={allSlots}
                    sessionLabels={sessionLabels}
                    duration={data.duration_minutes}
                    submitting={submitting}
                    onSubmit={handleSubmit}
                    compact
                />
            </div>
        </div>
    );
}
