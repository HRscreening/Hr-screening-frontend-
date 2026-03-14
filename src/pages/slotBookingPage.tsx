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
    RefreshCw,
} from "lucide-react";


// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface Slot {
    id: string;
    slot_start: string;
    slot_end: string;
}

// current_slot comes from backend with a typo key "id:" — we normalize it on read
interface CurrentSlot {
    "id:"?: string; // backend typo
    id?: string;
    slot_start: string | null;
    slot_end: string | null;
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
    | { status: "open"; panel_mode: "panel"; current_slot?: CurrentSlot | null; data: PanelFormData }
    | { status: "open"; panel_mode: "sequential"; current_slot?: CurrentSlot | null; data: SequentialFormData }
    | { status: "already_booked"; message: string; scheduled_start?: string; scheduled_end?: string }
    | { status: "expired"; message: string }
    | { status: "unavailable"; message: string };

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Safely extract a human-readable message from any axios error.
 *  FastAPI 422 returns detail as an array of {loc, msg, type, input} objects. */
function extractErrorMessage(err: any): string {
    const detail = err?.response?.data?.detail;
    if (!detail) return err?.response?.data?.message || "Something went wrong. Please try again.";
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
        return detail.map((d: any) => d?.msg ?? JSON.stringify(d)).join("; ");
    }
    return JSON.stringify(detail);
}

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
    for (const key of Object.keys(groups)) {
        groups[key].sort((a, b) => a.slot_start.localeCompare(b.slot_start));
    }
    return groups;
}

// ─────────────────────────────────────────────────────────────────────────────
// CancellationModal
// ─────────────────────────────────────────────────────────────────────────────

function CancellationModal({
    open,
    reason,
    onReasonChange,
    onConfirm,
    onClose,
    loading,
}: {
    open: boolean;
    reason: string;
    onReasonChange: (v: string) => void;
    onConfirm: () => void;
    onClose: () => void;
    loading: boolean;
}) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-background rounded-xl border border-border/60 shadow-xl w-full max-w-sm p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
                <div className="space-y-1">
                    <h2 className="text-base font-semibold">Cancel Interview</h2>
                    <p className="text-sm text-muted-foreground">
                        Please let us know why you're cancelling (optional).
                    </p>
                </div>
                <textarea
                    className="w-full rounded-lg border border-border/60 bg-muted/30 px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary/40 placeholder:text-muted-foreground/40"
                    rows={3}
                    placeholder="e.g. Accepted another offer, schedule conflict…"
                    value={reason}
                    onChange={(e) => onReasonChange(e.target.value)}
                    disabled={loading}
                />
                <div className="flex gap-2 justify-end">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Back
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={onConfirm}
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                Cancelling…
                            </span>
                        ) : (
                            "Confirm Cancellation"
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
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
// SlotCard
// ─────────────────────────────────────────────────────────────────────────────

function SlotCard({
    slot,
    selected,
    isCurrent,
    onSelect,
}: {
    slot: Slot;
    selected: boolean;
    isCurrent: boolean;
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
                ${selected
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
                            ${selected
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
                            className={`text-sm font-medium ${selected ? "text-primary" : "text-foreground"}`}
                        >
                            {formatTime(slot.slot_start)} — {formatTime(slot.slot_end)}
                        </p>
                    </div>
                </div>

                {/* Current slot badge */}
                {isCurrent && (
                    <Badge
                        variant="secondary"
                        className="text-[10px] px-1.5 py-0 shrink-0 bg-amber-500/10 text-amber-600 border-amber-500/20"
                    >
                        Current
                    </Badge>
                )}
            </div>
        </button>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// DateGroup
// ─────────────────────────────────────────────────────────────────────────────

function DateGroup({
    dateKey,
    slots,
    selectedId,
    currentSlotId,
    onSelect,
    duration,
}: {
    dateKey: string;
    slots: Slot[];
    selectedId: string | null;
    currentSlotId?: string | null;
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
                        isCurrent={currentSlotId === slot.id}
                        onSelect={() => onSelect(slot.id)}
                        duration={duration}
                    />
                ))}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// SessionPicker
// ─────────────────────────────────────────────────────────────────────────────

function SessionPicker({
    sessionIndex,
    total,
    slots,
    selectedId,
    currentSlotId,
    onSelect,
    duration,
}: {
    sessionIndex: number;
    total: number;
    slots: Slot[];
    selectedId: string | null;
    currentSlotId?: string | null;
    onSelect: (id: string) => void;
    duration: number;
}) {
    const grouped = useMemo(() => groupByDate(slots), [slots]);
    const sortedDates = Object.keys(grouped).sort();

    return (
        <div className="animate-in fade-in slide-in-from-bottom-3 duration-250">
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
                        currentSlotId={currentSlotId}
                        onSelect={onSelect}
                        duration={duration}
                    />
                ))}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// SelectionSummary
// ─────────────────────────────────────────────────────────────────────────────

function SelectionSummary({
    panelMode,
    selections,
    initialSelections,
    allSlots,
    sessionLabels,
    submitting,
    canceling,
    requesting,
    onSubmit,
    onRequest,
    onCancelClick,
    compact,
}: {
    panelMode: "panel" | "sequential";
    selections: Record<string, string>;
    initialSelections: Record<string, string>; // original slot IDs from backend
    allSlots: Slot[];
    sessionLabels: string[];
    duration: number;
    submitting: boolean;
    canceling: boolean;
    requesting: boolean;
    onSubmit: () => void;
    onRequest: () => void;
    onCancelClick: () => void;
    compact?: boolean;
}) {
    const selectedCount = Object.values(selections).filter(Boolean).length;
    // const requiredCount = 1; // backend only accepts one slot at a time
    const canSubmit = selectedCount >= 1 && Object.values(selections).some(Boolean);

    // The single active slot ID and its previous value
    const activeKey = panelMode === "panel"
        ? "panel"
        : (Object.keys(selections).find(k => !!selections[k]) ?? sessionLabels[0]);
    const currentSlotId = selections[activeKey];
    const previousSlotId = Object.values(initialSelections).find(Boolean);
    const isReschedule = !!previousSlotId;
    const hasChanged = !!currentSlotId && currentSlotId !== previousSlotId;
    const submitLabel = isReschedule && hasChanged ? "Reschedule" : "Confirm Booking";

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
                        <p className="text-[10px] text-muted-foreground">selected</p>
                    </div>
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
                    variant="outline"
                    className="h-10 px-4 font-medium text-sm shrink-0"
                    disabled={canceling || requesting || submitting}
                    onClick={onRequest}
                >
                    {requesting ? (
                        <span className="flex items-center gap-2">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        </span>
                    ) : (
                        "Request Slots"
                    )}
                </Button>
                {/* <Button
                    type="button"
                    variant="destructive"
                    className="h-10 px-4 font-medium text-sm shrink-0"
                    disabled={canceling || requesting || submitting}
                    onClick={onCancelClick}
                >
                    {canceling ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                        "Cancel"
                    )}
                </Button> */}
                <Button
                    type="button"
                    className="h-10 px-4 font-medium text-sm shrink-0"
                    disabled={!canSubmit || submitting || canceling || requesting}
                    onClick={onSubmit}
                >
                    {submitting ? (
                        <span className="flex items-center gap-2">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        </span>
                    ) : isReschedule && hasChanged ? (
                        <span className="flex items-center gap-1.5">
                            <RefreshCw className="h-3.5 w-3.5" />
                            Reschedule
                        </span>
                    ) : (
                        "Confirm"
                    )}
                </Button>
            </div>
        );
    }

    // Desktop sidebar
    return (
        <div className="space-y-4">
            <div className="rounded-lg bg-muted/50 px-3 py-2.5 text-center">
                <p className="text-2xl font-bold tabular-nums leading-none">
                    {selectedCount}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Selected</p>
            </div>

            {selectedDetails.length > 0 ? (
                <div className="space-y-3">
                    {selectedDetails.map((d, i) => {
                        const changed = !!previousSlotId && d.slot!.id !== previousSlotId;
                        return (
                            <div key={i} className="space-y-1">
                                {panelMode === "sequential" && (
                                    <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider">
                                        Slot {i + 1}
                                    </p>
                                )}
                                <div className={`flex items-center gap-2 rounded-md border px-3 py-2 ${changed ? "bg-amber-500/5 border-amber-500/20" : "bg-primary/5 border-primary/15"}`}>
                                    {changed ? (
                                        <RefreshCw className="h-3 w-3 text-amber-500/70 shrink-0" />
                                    ) : (
                                        <Clock className="h-3 w-3 text-primary/60 shrink-0" />
                                    )}
                                    <div className="min-w-0">
                                        <p className="text-xs font-medium text-foreground truncate">
                                            {formatTime(d.slot!.slot_start)} —{" "}
                                            {formatTime(d.slot!.slot_end)}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground">
                                            {formatDateLabel(d.slot!.slot_start.substring(0, 10))}
                                            {changed && <span className="text-amber-600 ml-1">· Rescheduled</span>}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
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

            <div className="flex flex-col justify-center items-center gap-2 w-full">
                <Button
                    type="button"
                    className="w-full h-9 font-medium text-sm"
                    disabled={!canSubmit || canceling || requesting || submitting}
                    onClick={onSubmit}
                >
                    {submitting ? (
                        <span className="flex items-center gap-2">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            {isReschedule && hasChanged ? "Rescheduling…" : "Booking…"}
                        </span>
                    ) : isReschedule && hasChanged ? (
                        <span className="flex items-center gap-2">
                            <RefreshCw className="h-3.5 w-3.5" />
                            {submitLabel}
                        </span>
                    ) : (
                        submitLabel
                    )}
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    className="h-9 font-medium text-sm w-full"
                    disabled={canceling || requesting || submitting}
                    onClick={onRequest}
                >
                    {requesting ? (
                        <span className="flex items-center gap-2">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Requesting…
                        </span>
                    ) : (
                        "Request New Slots"
                    )}
                </Button>
                {/* <Button
                    type="button"
                    variant="destructive"
                    className="h-9 font-medium text-sm w-full"
                    disabled={canceling || requesting || submitting}
                    onClick={onCancelClick}
                >
                    {canceling ? (
                        <span className="flex items-center gap-2">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Cancelling…
                        </span>
                    ) : (
                        "Cancel Meeting"
                    )}
                </Button> */}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// CandidateSlotBooking — main component
// Route: /interview/book?token=<jwt>
// ─────────────────────────────────────────────────────────────────────────────

export default function CandidateSlotBooking({ is_reschedule = false }: { is_reschedule?: boolean }) {
    const location = useLocation();
    const token = new URLSearchParams(location.search).get("token");
    // Pre-encode once so all API calls use the safe version
    const encodedToken = token ? encodeURIComponent(token) : "";

    const [response, setResponse] = useState<BookingResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [cancelingReason, setCancelingReason] = useState<string>("");
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [requesting, setRequesting] = useState(false);
    const [canceling, setCanceling] = useState(false);
    const [bookingResult, setBookingResult] = useState<{
        scheduled_start: string;
        scheduled_end: string;
        meet_link?: string;
    } | null>(null);

    // selections: key → slot_id
    const [selections, setSelections] = useState<Record<string, string>>({});
    // initialSelections: the pre-selected slots from backend (current_slot)
    const [initialSelections, setInitialSelections] = useState<Record<string, string>>({});

    // ── Fetch booking form ───────────────────────────────────────────────
    useEffect(() => {
        if (!token) {
            setFetchError("No token found. Please use the link from your email.");
            setLoading(false);
            return;
        }
        (async () => {
            try {
                const res = await axios.get(`/interview/booking/form?token=${encodedToken}&is_reschedule=${is_reschedule}`);
                const data: BookingResponse = res.data;
                console.log(data);
                
                setResponse(data);

                // Pre-populate selections from top-level current_slot
                if (data.status === "open" && data.current_slot) {
                    const cs = data.current_slot;
                    // Backend has a typo: "id:" instead of "id" — handle both
                    const slotId = cs["id:"] || cs["id"];
                    if (slotId && cs.slot_start) {
                        if (data.panel_mode === "panel") {
                            const init = { panel: slotId };
                            setSelections(init);
                            setInitialSelections(init);
                        } else {
                            // Sequential: find which panelist email owns this slot
                            const allPanelistSlots = data.data.panelist_slots;
                            let ownerEmail: string | null = null;
                            for (const [email, slots] of Object.entries(allPanelistSlots)) {
                                if (slots.some((s) => s.id === slotId)) {
                                    ownerEmail = email;
                                    break;
                                }
                            }
                            const key = ownerEmail ?? Object.keys(allPanelistSlots)[0];
                            const init = { [key]: slotId };
                            setSelections(init);
                            setInitialSelections(init);
                        }
                    }
                }
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

    const panelMode = response?.status === "open" ? response.panel_mode : null;

    const allSlots: Slot[] = useMemo(() => {
        if (response?.status !== "open") return [];
        if (response.panel_mode === "panel") return response.data.slots;
        return Object.values(response.data.panelist_slots).flat();
    }, [response]);

    const sessionKeys: string[] = useMemo(() => {
        if (response?.status !== "open" || response.panel_mode !== "sequential") return [];
        return Object.keys(response.data.panelist_slots);
    }, [response]);

    const sessionLabels: string[] = useMemo(() => {
        if (!panelMode) return [];
        if (panelMode === "panel") return ["panel"];
        return sessionKeys;
    }, [panelMode, sessionKeys]);

    const panelGrouped = useMemo(() => {
        if (response?.status !== "open" || response.panel_mode !== "panel") return {};
        return groupByDate(response.data.slots);
    }, [response]);

    const panelDateKeys = Object.keys(panelGrouped).sort();

    // ── Handlers ─────────────────────────────────────────────────────────

    const handleSelect = (key: string, slotId: string) => {
        // Only one slot allowed at a time — replace the entire selection
        setSelections({ [key]: slotId });
    };

    const handleSubmit = async () => {
        if (!token || response?.status !== "open") return;

        // Find whichever key has a selected slot (only one allowed at a time)
        const selectedEntry = Object.entries(selections).find(([, v]) => !!v);
        const slotId = selectedEntry?.[1];

        if (!slotId) {
            toast.error("Please select a time slot.");
            return;
        }

        // Reschedule if backend gave us a pre-existing slot AND candidate picked a different one
        const previousSlotId = Object.values(initialSelections).find(Boolean);
        const isRescheduling = !!previousSlotId && slotId !== previousSlotId;

        // All three endpoints accept the same flat body: { slot_id }
        const body = { slot_id: slotId };

        setSubmitting(true);
        try {
            if (isRescheduling) {
                await axios.post(
                    `/interview/booking/reschedule-to-new-slot?token=${encodedToken}`,
                    body
                );
                toast.success("Interview rescheduled successfully!");
            } else if (response.panel_mode === "panel") {
                const res = await axios.post(
                    `/interview/booking/book-panel?token=${encodedToken}`,
                    body
                );
                setBookingResult(res.data);
                toast.success("Interview booked successfully!");
            } else {
                const res = await axios.post(
                    `/interview/booking/book-sequential?token=${encodedToken}`,
                    body
                );
                setBookingResult(res.data);
                toast.success("Interview booked successfully!");
            }
        } catch (err: any) {
            toast.error(extractErrorMessage(err));
        } finally {
            setSubmitting(false);
        }
    };

    /** Request new slots — does NOT require a slot to be selected */
    const handleRequest = async () => {
        if (!token || response?.status !== "open") return;
        setRequesting(true);
        try {
            const res = await axios.post(
                `/interview/booking/ask-for-slots?token=${encodedToken}`,
                {}
            );
            if (res.status === 200) {
                toast.success("Your request has been sent to HR. They will get back to you soon.");
                window.close(); // close the booking page since they requested new slots
            }
        } catch (err: any) {
            toast.error(extractErrorMessage(err));
        } finally {
            setRequesting(false);
        }
    };

    /** Open cancellation modal */
    const handleCancelClick = () => {
        setCancelingReason("");
        setShowCancelModal(true);
    };

    /** Confirm cancellation after modal */
    const handleCancelConfirm = async () => {
        if (!token || response?.status !== "open") return;
        setCanceling(true);
        try {
            const res = await axios.post(
                `/interview/booking/cancel-interview?token=${encodedToken}`,
                // Backend expects: cancellation_reason as an embedded string body
                { cancellation_reason: cancelingReason || "" }
            );
            if (res.status === 200) {
                setShowCancelModal(false);
                toast.success("Your interview has been cancelled. We wish you the best in your job search.");
            }
        } catch (err: any) {
            toast.error(extractErrorMessage(err));
        } finally {
            setCanceling(false);
        }
    };

    // ── Loading ──────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-7 w-7 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    <p className="text-sm text-muted-foreground">Loading your booking…</p>
                </div>
            </div>
        );
    }

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

    if (response && response.status !== "open") {
        if (response.status === "already_booked") {
            return (
                <StatusScreen
                    icon={<CheckCircle2 className="h-8 w-8 text-emerald-500" />}
                    iconBg="bg-emerald-500/10"
                    title="Already Booked"
                    message={response.message}
                    extra={
                        response.scheduled_start ? (
                            <div className="inline-flex items-center gap-2 rounded-lg bg-muted/50 border border-border/50 px-4 py-2.5 text-sm">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{formatTime(response.scheduled_start)}</span>
                                <span className="text-muted-foreground">—</span>
                                <span className="font-medium">{formatTime(response.scheduled_end!)}</span>
                            </div>
                        ) : undefined
                    }
                />
            );
        }

        const screens: Record<string, { icon: React.ReactNode; bg: string; title: string }> = {
            expired: {
                icon: <AlertCircle className="h-8 w-8 text-destructive" />,
                bg: "bg-destructive/10",
                title: "Link Expired",
            },
            unavailable: {
                icon: <Timer className="h-8 w-8 text-amber-500" />,
                bg: "bg-amber-500/10",
                title: "Not Available Yet",
            },
        };
        const s = screens[response.status] ?? { icon: null, bg: "bg-muted", title: response.status };
        return <StatusScreen icon={s.icon} iconBg={s.bg} title={s.title} message={response.message} />;
    }

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
                            <span className="font-medium">{formatTime(bookingResult.scheduled_start)}</span>
                            <span className="text-muted-foreground">—</span>
                            <span className="font-medium">{formatTime(bookingResult.scheduled_end)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {formatDateLabel(bookingResult.scheduled_start.substring(0, 10))}
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

    if (response?.status !== "open") return null;

    const data = response.data;
    const isRescheduleMode = Object.values(initialSelections).some(Boolean);

    // ── Main render ──────────────────────────────────────────────────────
    return (
        <>
            <CancellationModal
                open={showCancelModal}
                reason={cancelingReason}
                onReasonChange={setCancelingReason}
                onConfirm={handleCancelConfirm}
                onClose={() => setShowCancelModal(false)}
                loading={canceling}
            />

            <div className="min-h-screen bg-background">
                {/* ── Top header bar ─────────────────────────────────────── */}
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
                                    {isRescheduleMode && (
                                        <Badge
                                            variant="outline"
                                            className="flex items-center gap-1 text-[11px] px-2 py-0.5 shrink-0 border-amber-500/30 text-amber-600 bg-amber-500/5"
                                        >
                                            <RefreshCw className="h-2.5 w-2.5" />
                                            Reschedule
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {isRescheduleMode
                                        ? "Select a new time to reschedule your interview"
                                        : "Choose your preferred interview time"}
                                    {`, 1 slots needed`}
                                </p>
                            </div>

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

                        <div className="flex sm:hidden items-center gap-2 mt-2 flex-wrap">
                            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                <Timer className="h-3 w-3" />
                                {data.duration_minutes} min / slot
                            </span>
                            {response.panel_mode === "sequential" && (
                                <>
                                    <span className="text-muted-foreground/30 text-xs">·</span>
                                    <span className="text-[11px] text-muted-foreground">
                                        {sessionKeys.length} slots needed
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Body ─────────────────────────────────────────────── */}
                <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-28 lg:pb-10">
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8 items-start">
                        {/* ── LEFT: Slot picker ──────────────────────────── */}
                        <div>
                            {response.panel_mode === "panel" ? (
                                <div>
                                    <p className="text-sm font-medium text-foreground/70 mb-5">
                                        {isRescheduleMode
                                            ? "Select a new time slot"
                                            : "Select an available time slot"}
                                    </p>

                                    {panelDateKeys.length === 0 ? (
                                        <div className="py-16 text-center border border-dashed border-border/40 rounded-xl">
                                            <CalendarCheck className="h-8 w-8 text-muted-foreground/15 mx-auto mb-3" />
                                            <p className="text-sm font-medium text-muted-foreground/50 mb-0.5">
                                                No slots available
                                            </p>
                                            <p className="text-xs text-muted-foreground/35">
                                                All slots may have been booked. Please contact HR.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            {panelDateKeys.map((dateKey) => (
                                                <DateGroup
                                                    key={dateKey}
                                                    dateKey={dateKey}
                                                    slots={panelGrouped[dateKey]}
                                                    selectedId={selections["panel"] || null}
                                                    currentSlotId={initialSelections["panel"] || null}
                                                    onSelect={(id) => handleSelect("panel", id)}
                                                    duration={data.duration_minutes}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
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
                                                    slots={(data as SequentialFormData).panelist_slots[email]}
                                                    selectedId={selections[email] || null}
                                                    currentSlotId={initialSelections[email] || null}
                                                    onSelect={(id) => handleSelect(email, id)}
                                                    duration={data.duration_minutes}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* ── RIGHT: Sticky desktop summary ──────────────── */}
                        <div className="hidden lg:block lg:sticky lg:top-[4.6rem]">
                            <Card className="border-border/50">
                                <CardContent className="p-5">
                                    <p className="text-sm font-semibold mb-4 text-foreground/80">
                                        Your Selection
                                    </p>
                                    <SelectionSummary
                                        panelMode={response.panel_mode}
                                        selections={selections}
                                        initialSelections={initialSelections}
                                        allSlots={allSlots}
                                        sessionLabels={sessionLabels}
                                        duration={data.duration_minutes}
                                        submitting={submitting}
                                        canceling={canceling}
                                        requesting={requesting}
                                        onSubmit={handleSubmit}
                                        onRequest={handleRequest}
                                        onCancelClick={handleCancelClick}
                                    />
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>

                {/* ── Mobile sticky bottom bar ─────────────────────────── */}
                <div className="lg:hidden fixed bottom-0 left-0 right-0 z-20 bg-background/95 backdrop-blur border-t border-border/50 px-4 py-3 safe-area-bottom">
                    <SelectionSummary
                        panelMode={response.panel_mode}
                        selections={selections}
                        initialSelections={initialSelections}
                        allSlots={allSlots}
                        sessionLabels={sessionLabels}
                        duration={data.duration_minutes}
                        submitting={submitting}
                        canceling={canceling}
                        requesting={requesting}
                        onSubmit={handleSubmit}
                        onRequest={handleRequest}
                        onCancelClick={handleCancelClick}
                        compact
                    />
                </div>
            </div>
        </>
    );
}