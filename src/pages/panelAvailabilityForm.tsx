"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { set, z } from "zod";
import {
    format,
    isAfter,
    isBefore,
    startOfDay,
    parseISO,
    addMinutes,
} from "date-fns";
import { useLocation } from "react-router-dom";
import axios from "@/axiosConfig";

// shadcn/ui
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Form, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";

// Icons
import {
    CalendarDays, Clock, Plus, Trash2, Video,
    AlertCircle, CheckCircle2, ChevronDown, Timer,
    CalendarCheck, X,
} from "lucide-react";

import { ClockTimePicker } from "@/components/helpers/Clocktimepicker";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface FormConfig {
    status: "open" | "closed" | "expired" | "submitted" | "not_started";
    message?: string;
    data?: {
        title: string;              // ← new field from backend
        start_date: string;
        end_date: string;
        duration_minutes: number;
        interview_type: string;
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Zod Schema
// ─────────────────────────────────────────────────────────────────────────────

const timeSlotSchema = z
    .object({
        start_time: z.string().min(1, "Start time required"),
        end_time: z.string().min(1, "End time required"),
    })
    .refine((s) => s.start_time < s.end_time, {
        message: "End time must be after start time",
        path: ["end_time"],
    });

const dateEntrySchema = z.object({
    date: z.date({ error: "Please select a date" }),
    slots: z.array(timeSlotSchema).min(1, "Add at least one time slot"),
});

const formSchema = z.object({
    entries: z.array(dateEntrySchema).min(1, "Add at least one date"),
});

type TimeSlot = z.infer<typeof timeSlotSchema>;
type DateEntry = z.infer<typeof dateEntrySchema>;
type FormValues = z.infer<typeof formSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function timeToMinutes(t: string): number {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
}

function to12Display(t: string): string {
    if (!t) return "";
    const [h, m] = t.split(":").map(Number);
    const period = h >= 12 ? "PM" : "AM";
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period}`;
}

function slotsOverlap(slots: TimeSlot[]): boolean {
    const ranges = slots
        .filter((s) => s.start_time && s.end_time)
        .map((s) => ({ s: timeToMinutes(s.start_time), e: timeToMinutes(s.end_time) }))
        .sort((a, b) => a.s - b.s);
    for (let i = 1; i < ranges.length; i++) {
        if (ranges[i].s < ranges[i - 1].e) return true;
    }
    return false;
}

function suggestEndTime(startTime: string, duration: number): string {
    if (!startTime) return "";
    const [h, m] = startTime.split(":").map(Number);
    const end = addMinutes(new Date(2000, 0, 1, h, m), duration);
    return `${end.getHours().toString().padStart(2, "0")}:${end.getMinutes().toString().padStart(2, "0")}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// TimeSlotRow
// ─────────────────────────────────────────────────────────────────────────────

interface TimeSlotRowProps {
    entryIndex: number;
    slotIndex: number;
    duration: number;
    control: any;
    remove: () => void;
    setValue: any;
    isOnly: boolean;
}

function TimeSlotRow({ entryIndex, slotIndex, duration, control, remove, setValue, isOnly }: TimeSlotRowProps) {
    const startPath = `entries.${entryIndex}.slots.${slotIndex}.start_time` as const;
    const endPath = `entries.${entryIndex}.slots.${slotIndex}.end_time` as const;

    const endTimeValue: string = useWatch({ control, name: endPath }) ?? "";

    const handleStartChange = (val: string) => {
        setValue(startPath, val, { shouldValidate: true });
        setValue(endPath, suggestEndTime(val, duration), { shouldValidate: true });
    };

    return (
        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-150">
            {/* From — clock picker */}
            <FormField
                control={control}
                name={startPath}
                render={({ field, fieldState }) => (
                    <FormItem className="flex-1 space-y-0">
                        <ClockTimePicker
                            value={field.value}
                            onChange={(val) => { field.onChange(val); handleStartChange(val); }}
                            placeholder="From"
                            error={!!fieldState.error}
                        />
                        <FormMessage className="text-xs mt-0.5" />
                    </FormItem>
                )}
            />

            <span className="text-muted-foreground/30 text-sm shrink-0">—</span>

            {/* To — read-only computed */}
            <div className="flex-1">
                <div className="flex items-center gap-2 h-8 px-3 rounded-md border text-sm bg-muted/40 border-border/50 text-muted-foreground select-none">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                    {endTimeValue
                        ? <span>{to12Display(endTimeValue)}</span>
                        : <span className="text-muted-foreground/40">To</span>
                    }
                </div>
            </div>

            <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-muted-foreground/25 hover:text-destructive hover:bg-destructive/10 transition-colors"
                onClick={remove}
                disabled={isOnly}
            >
                <X className="h-3.5 w-3.5" />
            </Button>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// DateSlotSection
// ─────────────────────────────────────────────────────────────────────────────

interface DateSlotSectionProps {
    entryIndex: number;
    control: any;
    setValue: any;
    clearErrors: any;
    removeEntry: () => void;
    config: NonNullable<FormConfig["data"]>;
}

function DateSlotSection({ entryIndex, control, setValue, clearErrors, removeEntry, config }: DateSlotSectionProps) {
    const [calOpen, setCalOpen] = useState(false);

    const { fields: slotFields, append: appendSlot, remove: removeSlot } =
        useFieldArray({ control, name: `entries.${entryIndex}.slots` });

    const handleRemoveSlot = (slotIndex: number) => {
        removeSlot(slotIndex);
        clearErrors(`entries.${entryIndex}.slots.${slotIndex}` as any);
        setTimeout(() => clearErrors(`entries.${entryIndex}.slots` as any), 0);
    };

    const currentSlots: TimeSlot[] = useWatch({ control, name: `entries.${entryIndex}.slots` }) ?? [];
    const hasOverlap = slotsOverlap(currentSlots);

    const minDate = new Date(Math.max(startOfDay(new Date()).getTime(), parseISO(config.start_date).getTime()));
    const maxDate = parseISO(config.end_date);
    const isDateDisabled = (d: Date) => isBefore(d, startOfDay(minDate)) || isAfter(d, maxDate);

    return (
        <div className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
            {/* Left accent bar */}
            <div className="flex flex-col items-center pt-2 w-4 shrink-0">
                <div className="w-px flex-1 bg-border/40 rounded-full" />
            </div>

            <div className="flex-1 pb-6 space-y-3 min-w-0">
                {/* Date picker */}
                <div className="flex items-start gap-2">
                    <FormField
                        control={control}
                        name={`entries.${entryIndex}.date`}
                        render={({ field, fieldState }) => (
                            <FormItem className="flex-1 space-y-0">
                                <Popover open={calOpen} onOpenChange={setCalOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={`w-full justify-between h-9 text-sm ${!field.value ? "font-normal text-muted-foreground" : "font-medium"
                                                } ${fieldState.error ? "border-destructive" : ""}`}
                                        >
                                            <span className="flex items-center gap-2 truncate">
                                                <CalendarDays className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                                                <span className="truncate">
                                                    {field.value ? format(field.value, "EEE, MMM d, yyyy") : "Pick a date"}
                                                </span>
                                            </span>
                                            <ChevronDown className="h-3.5 w-3.5 opacity-30 shrink-0 ml-1" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start" side="bottom">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={(d) => { field.onChange(d); setCalOpen(false); }}
                                            disabled={isDateDisabled}
                                            initialFocus
                                            fromDate={minDate}
                                            toDate={maxDate}
                                        />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage className="text-xs mt-1" />
                            </FormItem>
                        )}
                    />
                    <Button
                        type="button" variant="ghost" size="icon"
                        className="h-9 w-9 shrink-0 text-muted-foreground/25 hover:text-destructive hover:bg-destructive/10"
                        onClick={removeEntry}
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                </div>

                {/* Slots header */}
                <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground/60">
                        Time slots{slotFields.length > 0 && <span className="ml-1 opacity-60">({slotFields.length})</span>}
                    </span>
                    {hasOverlap && (
                        <span className="text-xs text-destructive flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />Overlapping
                        </span>
                    )}
                </div>

                {/* Column labels */}
                {slotFields.length > 0 && (
                    <div className="flex items-center gap-2">
                        <span className="flex-1 text-[11px] text-muted-foreground/40 pl-9">From</span>
                        <span className="w-4" />
                        <span className="flex-1 text-[11px] text-muted-foreground/40 pl-4">To (auto)</span>
                        <span className="w-8" />
                    </div>
                )}

                {/* Slot rows */}
                <div className="space-y-2">
                    {slotFields.map((slotField, slotIndex) => (
                        <TimeSlotRow
                            key={slotField.id}
                            entryIndex={entryIndex}
                            slotIndex={slotIndex}
                            duration={config.duration_minutes}
                            control={control}
                            remove={() => handleRemoveSlot(slotIndex)}
                            setValue={setValue}
                            isOnly={slotFields.length === 1}
                        />
                    ))}
                </div>

                <Button
                    type="button" variant="ghost" size="sm"
                    className="h-7 px-2 text-xs text-muted-foreground/60 hover:text-primary hover:bg-primary/5 -ml-1"
                    onClick={() => appendSlot({ start_time: "", end_time: "" })}
                >
                    <Plus className="h-3.5 w-3.5 mr-1" />Add slot
                </Button>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// SummaryContent — shared between sidebar (desktop) and bottom sheet (mobile)
// ─────────────────────────────────────────────────────────────────────────────

interface SummaryContentProps {
    entries: Partial<DateEntry>[];
    submitting: boolean;
    formErrors: any;
    compact?: boolean; // true = mobile bottom bar condensed view
}

function SummaryContent({ entries, submitting, formErrors, compact }: SummaryContentProps) {
    const validEntries = entries.filter(
        (e) => e.date && e.slots && e.slots.some((s) => s.start_time && s.end_time)
    );
    const totalSlots = validEntries.reduce(
        (acc, e) => acc + (e.slots?.filter((s) => s.start_time && s.end_time).length ?? 0), 0
    );
    const errorMsg =
        formErrors?.entries?.root?.message ||
        (typeof formErrors?.entries?.message === "string" ? formErrors.entries.message : null);

    if (compact) {
        // Mobile bottom bar: just stats + submit button inline
        return (
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="text-center shrink-0">
                        <p className="text-lg font-bold tabular-nums leading-none">{validEntries.length}</p>
                        <p className="text-[10px] text-muted-foreground">dates</p>
                    </div>
                    <div className="w-px h-6 bg-border/50 shrink-0" />
                    <div className="text-center shrink-0">
                        <p className="text-lg font-bold tabular-nums leading-none">{totalSlots}</p>
                        <p className="text-[10px] text-muted-foreground">slots</p>
                    </div>
                    {errorMsg && (
                        <p className="text-xs text-destructive truncate flex-1">{errorMsg}</p>
                    )}
                </div>
                <Button
                    type="submit"
                    className="h-10 px-6 font-medium text-sm shrink-0"
                    disabled={submitting || totalSlots === 0}
                >
                    {submitting ? (
                        <span className="flex items-center gap-2">
                            <span className="h-3.5 w-3.5 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                            Submitting…
                        </span>
                    ) : "Submit"}
                </Button>
            </div>
        );
    }

    // Desktop sidebar: full summary
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-muted/50 px-3 py-2.5 text-center">
                    <p className="text-2xl font-bold tabular-nums leading-none">{validEntries.length}</p>
                    <p className="text-xs text-muted-foreground mt-1">{validEntries.length === 1 ? "Date" : "Dates"}</p>
                </div>
                <div className="rounded-lg bg-muted/50 px-3 py-2.5 text-center">
                    <p className="text-2xl font-bold tabular-nums leading-none">{totalSlots}</p>
                    <p className="text-xs text-muted-foreground mt-1">{totalSlots === 1 ? "Slot" : "Slots"}</p>
                </div>
            </div>

            {validEntries.length > 0 ? (
                <div className="space-y-3">
                    {validEntries.map((entry, i) => (
                        <div key={i} className="space-y-1">
                            <p className="text-xs font-semibold text-foreground/70">
                                {entry.date ? format(entry.date, "EEE, MMM d") : ""}
                            </p>
                            <div className="space-y-0.5">
                                {(entry.slots ?? []).filter((s) => s.start_time && s.end_time).map((slot, j) => (
                                    <div key={j} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <div className="h-1 w-1 rounded-full bg-primary/50 shrink-0" />
                                        {to12Display(slot.start_time)} – {to12Display(slot.end_time)}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="py-5 text-center">
                    <CalendarCheck className="h-6 w-6 text-muted-foreground/15 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground/40">Your slots will appear here</p>
                </div>
            )}

            <Separator className="opacity-40" />

            {errorMsg && (
                <Alert variant="destructive" className="py-2.5">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <AlertDescription className="text-xs">{errorMsg}</AlertDescription>
                </Alert>
            )}

            <Button
                type="submit"
                className="w-full h-9 font-medium text-sm"
                disabled={submitting || totalSlots === 0}
            >
                {submitting ? (
                    <span className="flex items-center gap-2">
                        <span className="h-3.5 w-3.5 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                        Submitting…
                    </span>
                ) : "Submit Availability"}
            </Button>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// StatusScreen — reusable full-screen status display
// ─────────────────────────────────────────────────────────────────────────────

function StatusScreen({ icon, iconBg, title, message }: {
    icon: React.ReactNode; iconBg: string; title: string; message?: string;
}) {
    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="max-w-sm w-full text-center space-y-4">
                <div className={`h-16 w-16 rounded-full ${iconBg} flex items-center justify-center mx-auto`}>
                    {icon}
                </div>
                <div className="space-y-1">
                    <h2 className="text-base font-semibold">{title}</h2>
                    {message && <p className="text-sm text-muted-foreground">{message}</p>}
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// SlotAvailabilityForm — main component
// Route: /panelist/availability?token=<jwt>
// ─────────────────────────────────────────────────────────────────────────────

export default function SlotAvailabilityForm() {
    const location = useLocation();
    const token = new URLSearchParams(location.search).get("token");

    const [config, setConfig] = useState<FormConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);

    const [CalendarNotConnected, setCalendarNotConnected] = useState(false);
    const [connecting, setConnecting] = useState(false);
    // const [provider, setProvider] = useState("Google");//currently only supporting this

    useEffect(() => {
        if (!token) {
            setFetchError("No token found. Please use the link from your email invitation.");
            setLoading(false);
            return;
        }
        (async () => {
            try {
                const res = await axios.get(`/panel/get-details-for-form?token=${token}`);

                const data = res.data;

                console.log("data", data);


                if (data.status === "no_calendar") {
                    setCalendarNotConnected(true);

                }
                else {
                    setConfig(res.data);
                }
            } catch (err: any) {
                setFetchError(
                    err?.response?.data?.detail ||
                    err?.response?.data?.message ||
                    "Failed to load form. Please use the link from your email."
                );
            } finally {
                setLoading(false);
            }
        })();
    }, [token]);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: { entries: [] },
        mode: "onChange",
        reValidateMode: "onChange",
    });

    const { fields: entryFields, append: appendEntry, remove: removeEntry } =
        useFieldArray({ control: form.control, name: "entries" });

    const handleRemoveEntry = useCallback((index: number) => {
        removeEntry(index);
        form.clearErrors(`entries.${index}` as any);
        setTimeout(() => form.clearErrors(), 0);
    }, [removeEntry, form]);

    const watchedEntries = useWatch({ control: form.control, name: "entries" });

    const validateForm = useCallback((values: FormValues): string | null => {
        for (const entry of values.entries) {
            if (slotsOverlap(entry.slots))
                return `Overlapping slots on ${format(entry.date, "MMM d")}.`;
            for (const slot of entry.slots) {
                const diff = timeToMinutes(slot.end_time) - timeToMinutes(slot.start_time);
                if (diff !== config?.data?.duration_minutes)
                    return `Each slot must be exactly ${config?.data?.duration_minutes} min (found ${diff} min on ${format(entry.date, "MMM d")}).`;
            }
        }
        return null;
    }, [config]);

    const onSubmit = async (values: FormValues) => {
        const err = validateForm(values);
        if (err) { toast.error(err); return; }
        setSubmitting(true);
        try {
            // Helper to get YYYY-MM-DD string in local time
            const toDateString = (date: Date) => {
                const y = date.getFullYear();
                const m = (date.getMonth() + 1).toString().padStart(2, "0");
                const d = date.getDate().toString().padStart(2, "0");
                return `${y}-${m}-${d}`;
            };
            // Helper to get ISO string for slot times (local time, not UTC midnight)
            const toISO = (date: Date, timeStr: string) => {
                const [hours, minutes] = timeStr.split(":").map(Number);
                const dt = new Date(date);
                dt.setHours(hours, minutes, 0, 0);
                return dt.toISOString();
            };
            const available_slots = values.entries.map((entry) => ({
                date: toDateString(entry.date),
                time: entry.slots.map((s) => ({
                    start_time: toISO(entry.date, s.start_time),
                    end_time: toISO(entry.date, s.end_time),
                })),
            }));
            await axios.post(`/panel/submit-availability?token=${token}`, available_slots);
            setSubmitSuccess(true);
            toast.success("Availability submitted!");
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

    // ── Loading ───────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-7 w-7 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    <p className="text-sm text-muted-foreground">Loading…</p>
                </div>
            </div>
        );
    }

    // ── Fetch error ───────────────────────────────────────────────────────────
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


    if (CalendarNotConnected) {



        const handleConnect = async () => {
            setConnecting(true);
            try {
                const currentPage =
                    window.location.pathname + window.location.search;

                const res = await axios.get(
                    `/oauth/google/calendar?redirect_to=${encodeURIComponent(currentPage)}`
                );

                window.location.href = res.data;

            } catch {
                toast.error("Failed to connect calendar. Please try again.");
            }
            setConnecting(false);
        };

        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="max-w-sm w-full text-center space-y-4">
                    <div className="h-16 w-16 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto">
                        <CalendarDays className="h-8 w-8 text-blue-500" />
                    </div>
                    <div className="space-y-1">
                        <h2 className="text-base font-semibold">Connect Your Calendar</h2>
                        <p className="text-sm text-muted-foreground">
                            You need to connect Google Calendar before submitting your availability.
                        </p>
                    </div>
                    <Button
                        className="w-full h-9 text-sm font-medium"
                        onClick={handleConnect}
                        disabled={connecting}
                    >
                        {connecting ? (
                            <span className="flex items-center gap-2">
                                <span className="h-3.5 w-3.5 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                                Connecting…
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                <CalendarDays className="h-3.5 w-3.5" />
                                Connect Google Calendar
                            </span>
                        )}
                    </Button>
                </div>
            </div>
        )
    }

    // ── Non-open statuses ─────────────────────────────────────────────────────
    if (config && config.status !== "open") {
        const screens = {
            submitted: { icon: <CheckCircle2 className="h-8 w-8 text-emerald-500" />, bg: "bg-emerald-500/10", title: "Already Submitted" },
            closed: { icon: <AlertCircle className="h-8 w-8 text-amber-500" />, bg: "bg-amber-500/10", title: "Submission Closed" },
            expired: { icon: <AlertCircle className="h-8 w-8 text-destructive" />, bg: "bg-destructive/10", title: "Link Expired" },
            not_started: { icon: <Timer className="h-8 w-8 text-blue-500" />, bg: "bg-blue-500/10", title: "Not Started Yet" },
        };
        const s = screens[config.status as keyof typeof screens] ?? { icon: null, bg: "bg-muted", title: config.status };
        return <StatusScreen icon={s.icon} iconBg={s.bg} title={s.title} message={config.message} />;
    }

    // ── Success ───────────────────────────────────────────────────────────────
    if (submitSuccess) {
        return (
            <StatusScreen
                icon={<CheckCircle2 className="h-8 w-8 text-emerald-500" />}
                iconBg="bg-emerald-500/10"
                title="Availability Submitted!"
                message="Thank you. We'll send you the confirmed schedule shortly."
            />
        );
    }

    const data = config?.data!;

    // ── Main render ───────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-background">

            {/* ── Top header bar — mobile-first ──────────────────────────────── */}
            <div className="border-b border-border/50 bg-background/95 backdrop-blur sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                        {/* Title + subtitle */}
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-base font-bold tracking-tight truncate">
                                    {data.title}
                                </h1>
                                <Badge variant="secondary" className="flex items-center gap-1 text-[11px] px-2 py-0.5 shrink-0">
                                    <Video className="h-2.5 w-2.5" />
                                    {data.interview_type}
                                </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Share your availability for this interview round
                            </p>
                        </div>

                        {/* Meta badges — hidden on very small screens, shown sm+ */}
                        <div className="hidden sm:flex items-center gap-1.5 flex-wrap shrink-0">
                            <Badge variant="outline" className="flex items-center gap-1 text-[11px] font-normal px-2 py-0.5">
                                <CalendarDays className="h-2.5 w-2.5 text-muted-foreground" />
                                {format(parseISO(data.start_date), "MMM d")} – {format(parseISO(data.end_date), "MMM d")}
                            </Badge>
                            <Badge variant="outline" className="flex items-center gap-1 text-[11px] font-normal px-2 py-0.5">
                                <Timer className="h-2.5 w-2.5 text-muted-foreground" />
                                {data.duration_minutes} min
                            </Badge>
                        </div>
                    </div>

                    {/* Mobile-only meta row */}
                    <div className="flex sm:hidden items-center gap-2 mt-2 flex-wrap">
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <CalendarDays className="h-3 w-3" />
                            {format(parseISO(data.start_date), "MMM d")} – {format(parseISO(data.end_date), "MMM d, yyyy")}
                        </span>
                        <span className="text-muted-foreground/30 text-xs">·</span>
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Timer className="h-3 w-3" />
                            {data.duration_minutes} min / slot
                        </span>
                    </div>
                </div>
            </div>

            {/* ── Body ─────────────────────────────────────────────────────────── */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-28 lg:pb-10">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <div className="grid grid-cols-1 lg:grid-cols-[1fr_272px] gap-8 items-start">

                            {/* ── LEFT / MAIN: date builder ────────────────────────── */}
                            <div>
                                <p className="text-sm font-medium text-foreground/70 mb-4">
                                    Add your available dates &amp; times
                                </p>

                                {entryFields.length > 0 && (
                                    <div className="mb-1">
                                        {entryFields.map((field, index) => (
                                            <DateSlotSection
                                                key={field.id}
                                                entryIndex={index}
                                                control={form.control}
                                                setValue={form.setValue}
                                                clearErrors={form.clearErrors}
                                                removeEntry={() => handleRemoveEntry(index)}
                                                config={data}
                                            />
                                        ))}
                                    </div>
                                )}

                                {entryFields.length === 0 && (
                                    <div className="py-12 text-center border border-dashed border-border/40 rounded-xl mb-4">
                                        <CalendarCheck className="h-8 w-8 text-muted-foreground/15 mx-auto mb-3" />
                                        <p className="text-sm font-medium text-muted-foreground/50 mb-0.5">No dates added yet</p>
                                        <p className="text-xs text-muted-foreground/35">Tap "Add Date" to get started</p>
                                    </div>
                                )}

                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full h-10 border-dashed text-sm text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all"
                                    onClick={() => appendEntry({ date: undefined as any, slots: [] })}
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Date
                                </Button>
                            </div>

                            {/* ── RIGHT: sticky desktop summary ───────────────────── */}
                            <div className="hidden lg:block lg:sticky lg:top-18.25">
                                <Card className="border-border/50">
                                    <CardContent className="p-5">
                                        <p className="text-sm font-semibold mb-4 text-foreground/80">Summary</p>
                                        <SummaryContent
                                            entries={watchedEntries ?? []}
                                            submitting={submitting}
                                            formErrors={form.formState.errors}
                                        />
                                    </CardContent>
                                </Card>
                            </div>

                        </div>
                    </form>
                </Form>
            </div>

            {/* ── Mobile sticky bottom bar (hidden on lg+) ─────────────────────── */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 z-20 bg-background/95 backdrop-blur border-t border-border/50 px-4 py-3 safe-area-bottom">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <SummaryContent
                            entries={watchedEntries ?? []}
                            submitting={submitting}
                            formErrors={form.formState.errors}
                            compact
                        />
                    </form>
                </Form>
            </div>

        </div>
    );
}