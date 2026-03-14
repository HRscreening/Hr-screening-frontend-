"use client";

/**
 * RescheduleAvailabilityForm.tsx
 *
 * Panelist reschedule page.
 *
 * URL: /panelist/reschedule?token=<jwt>
 * Token encodes: panelist_id, round_config_id, interview_id
 * Backend returns reschedule_slot_id in the response data.
 *
 * Rules:
 *   - Released slot (reschedule_slot_id) → editable time + date, highlighted in amber
 *   - Booked slots → locked, read-only
 *   - Existing unbooked slots → read-only (shown for overlap awareness, in accordion)
 *   - New slots → panelist can add freely (purely additive)
 *   - Overlap detection across ALL active slots
 *
 * Submit (reschedule):
 *   PATCH /panel/reschedule-slots?token=
 *   body: {
 *     reschedule_slot: { id: string, slot_start: ISO, slot_end: ISO },
 *     add: [{ date, slot_start, slot_end }]
 *   }
 *
 * Submit (cancel):
 *   POST /panel/cancel-interview?token=
 *   body: { reason: string }
 */

import { useEffect, useState } from "react";
import { useForm, useFieldArray, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, isAfter, isBefore, startOfDay, parseISO, addMinutes } from "date-fns";
import { useLocation } from "react-router-dom";
import axios from "@/axiosConfig";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Textarea } from "@/components/ui/textarea";
import { Form } from "@/components/ui/form";
import { toast } from "sonner";

import {
  CalendarDays, Clock, Plus, Video, AlertCircle,
  CheckCircle2, ChevronDown, Timer, X, Lock,
  Sparkles, RefreshCcw, XCircle, AlertTriangle, Eye, Pencil,
} from "lucide-react";

import { ClockTimePicker } from "@/components/helpers/Clocktimepicker";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface RawSlot {
  id: string;
  slot_start: string;
  slot_end: string;
  is_booked: boolean;
  is_expired: boolean;
}

interface ExistingSlotGroup {
  date: string;
  slots: RawSlot[];
}

interface RescheduleConfig {
  status: "open" | "closed" | "expired" | "too_late" | "not_booked" | "not_started" | "no_calendar";
  message?: string;
  data?: {
    title: string;
    start_date: string;
    end_date: string;
    duration_minutes: number;
    interview_type: string;
    reschedule_slot_id: string;
    existing_slots: ExistingSlotGroup[];
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Zod Schema
// ─────────────────────────────────────────────────────────────────────────────

const newSlotSchema = z
  .object({
    date: z.date({ error: "Pick a date" }),
    start_time: z.string().min(1, "Start time required"),
    end_time: z.string().min(1, "End time required"),
  })
  .refine((s) => s.start_time < s.end_time, { message: "End must be after start", path: ["end_time"] });

const rescheduleSlotSchema = z
  .object({
    id: z.string(),
    date: z.date({ error: "Pick a date" }),
    start_time: z.string().min(1, "Start time required"),
    end_time: z.string().min(1, "End time required"),
  })
  .refine((s) => s.start_time < s.end_time, { message: "End must be after start", path: ["end_time"] });

const formSchema = z.object({
  reschedule_slot: rescheduleSlotSchema,
  new_slots: z.array(newSlotSchema),
});

type FormValues = z.infer<typeof formSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function timeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function to12Display(t: string) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period}`;
}

function isoToHHMM(iso: string) {
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

function suggestEndTime(startTime: string, duration: number) {
  if (!startTime) return "";
  const [h, m] = startTime.split(":").map(Number);
  const end = addMinutes(new Date(2000, 0, 1, h, m), duration);
  return `${end.getHours().toString().padStart(2, "0")}:${end.getMinutes().toString().padStart(2, "0")}`;
}

function toISO(date: Date, timeStr: string) {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const dt = new Date(date);
  dt.setHours(hours, minutes, 0, 0);
  return dt.toISOString();
}

function toDateString(date: Date) {
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
}

interface FlatSlot { date: string; start_time: string; end_time: string; label: string }

function getOverlaps(checkDate: Date | undefined, checkStart: string, checkEnd: string, others: FlatSlot[]): FlatSlot[] {
  if (!checkDate || !checkStart || !checkEnd) return [];
  const ds = toDateString(checkDate);
  return others.filter((o) => {
    if (o.date !== ds) return false;
    const oS = timeToMinutes(o.start_time), oE = timeToMinutes(o.end_time);
    const cS = timeToMinutes(checkStart), cE = timeToMinutes(checkEnd);
    return cS < oE && cE > oS;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// StatusScreen
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
// CancelDialog
// ─────────────────────────────────────────────────────────────────────────────

function CancelDialog({ open, onClose, onConfirm, submitting }: {
  open: boolean; onClose: () => void;
  onConfirm: (reason: string) => Promise<void>; submitting: boolean;
}) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  useEffect(() => { if (!open) { setReason(""); setError(""); } }, [open]);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && !submitting) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <XCircle className="h-4 w-4 text-destructive" />Cancel Interview
          </DialogTitle>
          <DialogDescription className="text-sm">
            The candidate will be notified. Please explain why you're cancelling.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-1">
          <Textarea
            placeholder="e.g. I'm no longer available for this interview round…"
            value={reason}
            onChange={(e) => { setReason(e.target.value); if (error) setError(""); }}
            className="min-h-[100px] text-sm resize-none"
            disabled={submitting}
          />
          {error && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="h-3 w-3" />{error}</p>}
        </div>
        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={submitting}>Go back</Button>
          <Button
            type="button" variant="destructive" size="sm"
            onClick={async () => {
              if (!reason.trim()) { setError("Please provide a reason."); return; }
              await onConfirm(reason.trim());
            }}
            disabled={submitting || !reason.trim()}
          >
            {submitting
              ? <span className="flex items-center gap-2"><span className="h-3.5 w-3.5 rounded-full border-2 border-destructive-foreground/30 border-t-destructive-foreground animate-spin" />Cancelling…</span>
              : "Confirm Cancellation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DateTimePicker
// ─────────────────────────────────────────────────────────────────────────────

function DateTimePicker({ dateValue, onDateChange, startValue, onStartChange, endValue, minDate, maxDate, duration, dateError, timeError }: {
  dateValue: Date | undefined; onDateChange: (d: Date) => void;
  startValue: string; onStartChange: (v: string) => void; endValue: string;
  minDate: Date; maxDate: Date; duration: number;
  dateError?: string; timeError?: string;
}) {
  const [calOpen, setCalOpen] = useState(false);
  const isDateDisabled = (d: Date) => isBefore(d, startOfDay(minDate)) || isAfter(d, maxDate);

  return (
    <div className="space-y-2">
      <Popover open={calOpen} onOpenChange={setCalOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={`w-full justify-between h-9 text-sm ${!dateValue ? "font-normal text-muted-foreground" : "font-medium"} ${dateError ? "border-destructive" : ""}`}
          >
            <span className="flex items-center gap-2 truncate">
              <CalendarDays className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
              {dateValue ? format(dateValue, "EEE, MMM d, yyyy") : "Pick a date"}
            </span>
            <ChevronDown className="h-3.5 w-3.5 opacity-30 shrink-0" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={dateValue} onSelect={(d) => { if (d) { onDateChange(d); setCalOpen(false); } }} disabled={isDateDisabled} initialFocus fromDate={minDate} toDate={maxDate} />
        </PopoverContent>
      </Popover>
      {dateError && <p className="text-xs text-destructive">{dateError}</p>}

      <div className="flex items-center gap-2">
        <div className="flex-1">
          <ClockTimePicker value={startValue} onChange={onStartChange} placeholder="From" error={!!timeError} />
        </div>
        <span className="text-muted-foreground/30 text-sm shrink-0">—</span>
        <div className="flex-1">
          <div className="flex items-center gap-2 h-9 px-3 rounded-md border text-sm bg-muted/40 border-border/50 text-muted-foreground select-none">
            <Clock className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
            {endValue ? <span>{to12Display(endValue)}</span> : <span className="text-muted-foreground/40 text-xs">Auto</span>}
          </div>
        </div>
      </div>
      {timeError && <p className="text-xs text-destructive">{timeError}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ExistingSlotsAccordion
// ─────────────────────────────────────────────────────────────────────────────

function ExistingSlotsAccordion({ existingGroups, rescheduleSlotId }: {
  existingGroups: ExistingSlotGroup[]; rescheduleSlotId: string;
}) {
  const displayGroups = existingGroups
    .map((g) => ({ ...g, slots: g.slots.filter((s) => s.id !== rescheduleSlotId) }))
    .filter((g) => g.slots.length > 0);

  if (!displayGroups.length) return null;

  const totalSlots = displayGroups.reduce((acc, g) => acc + g.slots.length, 0);

  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="existing" className="border border-border/40 rounded-lg px-4 data-[state=open]:border-border/60">
        <AccordionTrigger className="py-3 hover:no-underline">
          <div className="flex items-center gap-2 text-sm">
            <Eye className="h-3.5 w-3.5 text-muted-foreground/50" />
            <span className="font-medium text-foreground/70">Your other slots</span>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{totalSlots}</Badge>
            <span className="text-xs text-muted-foreground/50 font-normal">— shown to avoid overlap</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="pb-4">
          <div className="space-y-4">
            {displayGroups.map((g) => (
              <div key={g.date}>
                <p className="text-xs font-medium text-muted-foreground/70 mb-2">
                  {format(parseISO(g.date), "EEE, MMM d")}
                </p>
                <div className="space-y-1.5">
                  {g.slots.map((s) => (
                    <div key={s.id} className="flex items-center gap-2">
                      <div className={`flex items-center gap-2 flex-1 h-8 px-3 rounded-md border text-xs
                        ${s.is_booked ? "border-amber-200/50 bg-amber-500/5 text-amber-700 dark:text-amber-400" : "border-border/30 bg-muted/20 text-muted-foreground"}`}>
                        {s.is_booked && <Lock className="h-3 w-3 shrink-0" />}
                        <span>{to12Display(isoToHHMM(s.slot_start))} – {to12Display(isoToHHMM(s.slot_end))}</span>
                      </div>
                      <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 shrink-0 ${s.is_booked ? "bg-amber-500/10 text-amber-600 border-amber-200/50" : "bg-muted/60 text-muted-foreground/60"}`}>
                        {s.is_booked ? "Booked" : "Open"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// OverlapWarning
// ─────────────────────────────────────────────────────────────────────────────

function OverlapWarning({ overlaps }: { overlaps: FlatSlot[] }) {
  if (!overlaps.length) return null;
  return (
    <div className="flex items-start gap-2 rounded-lg bg-destructive/8 border border-destructive/20 px-3 py-2.5">
      <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
      <div>
        <p className="text-xs font-medium text-destructive">Overlaps with existing slot</p>
        <p className="text-xs text-destructive/70 mt-0.5">
          {overlaps.map((o) => `${o.label}: ${to12Display(o.start_time)} – ${to12Display(o.end_time)}`).join(", ")}
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export default function RescheduleAvailabilityForm() {
  const location = useLocation();
  const token = new URLSearchParams(location.search).get("token");

  const [config, setConfig] = useState<RescheduleConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cancelSubmitting, setCancelSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<"rescheduled" | "cancelled" | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
  });

  const { fields: newSlotFields, append: appendNewSlot, remove: removeNewSlot } =
    useFieldArray({ control: form.control, name: "new_slots" });

  const watchedRescheduleSlot = useWatch({ control: form.control, name: "reschedule_slot" });
  const watchedNewSlots = useWatch({ control: form.control, name: "new_slots" }) ?? [];

  // ── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) {
      setFetchError("Invalid reschedule link. Please use the link from your email.");
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const res = await axios.get(`/panel/get-reschedule-form-details?rescheduling_token=${token}`);
        const data: RescheduleConfig = res.data;
        console.log("Fetched config:", data);
        setConfig(data);

        if (data.status === "open" && data.data) {
          const { reschedule_slot_id, existing_slots } = data.data;
          let releasedRaw: RawSlot | null = null;
          let releasedDate: Date | null = null;
          for (const g of existing_slots) {
            const found = g.slots.find((s) => s.id === reschedule_slot_id);
            if (found) { releasedRaw = found; releasedDate = parseISO(g.date); break; }
          }
          if (releasedRaw && releasedDate) {
            form.reset({
              reschedule_slot: {
                id: releasedRaw.id,
                date: releasedDate,
                start_time: isoToHHMM(releasedRaw.slot_start),
                end_time: isoToHHMM(releasedRaw.slot_end),
              },
              new_slots: [],
            });
          }
        }
      } catch (err: any) {
        setFetchError(err?.response?.data?.detail || err?.response?.data?.message || "Failed to load. Please use the link from your email.");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  // ── Overlap detection ──────────────────────────────────────────────────────
  const flatExistingSlots: FlatSlot[] = (config?.data?.existing_slots ?? []).flatMap((g) =>
    g.slots
      .filter((s) => s.id !== config?.data?.reschedule_slot_id)
      .map((s) => ({
        date: g.date,
        start_time: isoToHHMM(s.slot_start),
        end_time: isoToHHMM(s.slot_end),
        label: s.is_booked ? "Booked slot" : "Existing slot",
      }))
  );

  // For reschedule slot: check against existing + new slots
  const othersForReschedule: FlatSlot[] = [
    ...flatExistingSlots,
    ...watchedNewSlots
      .filter((ns) => ns?.date && ns?.start_time && ns?.end_time)
      .map((ns, i) => ({ date: toDateString(ns.date), start_time: ns.start_time, end_time: ns.end_time, label: `New slot ${i + 1}` })),
  ];

  // For each new slot: check against existing + reschedule slot + other new slots
  const othersForNewSlot = (selfIdx: number): FlatSlot[] => {
    const others: FlatSlot[] = [...flatExistingSlots];
    if (watchedRescheduleSlot?.date && watchedRescheduleSlot?.start_time && watchedRescheduleSlot?.end_time) {
      others.push({ date: toDateString(watchedRescheduleSlot.date), start_time: watchedRescheduleSlot.start_time, end_time: watchedRescheduleSlot.end_time, label: "Rescheduled slot" });
    }
    watchedNewSlots.forEach((ns, i) => {
      if (i !== selfIdx && ns?.date && ns?.start_time && ns?.end_time) {
        others.push({ date: toDateString(ns.date), start_time: ns.start_time, end_time: ns.end_time, label: `New slot ${i + 1}` });
      }
    });
    return others;
  };

  const rescheduleOverlaps = getOverlaps(watchedRescheduleSlot?.date, watchedRescheduleSlot?.start_time, watchedRescheduleSlot?.end_time, othersForReschedule);
  const newSlotOverlaps = watchedNewSlots.map((ns, i) => getOverlaps(ns?.date, ns?.start_time, ns?.end_time, othersForNewSlot(i)));
  const hasAnyOverlap = rescheduleOverlaps.length > 0 || newSlotOverlaps.some((o) => o.length > 0);

  // ── Submit ─────────────────────────────────────────────────────────────────
  const onSubmit = async (values: FormValues) => {
    if (hasAnyOverlap) { toast.error("Fix overlapping slots before submitting."); return; }
    setSubmitting(true);
    try {
      const body = {
        reschedule_slot: {
          id: values.reschedule_slot.id,
          slot_start: toISO(values.reschedule_slot.date, values.reschedule_slot.start_time),
          slot_end: toISO(values.reschedule_slot.date, values.reschedule_slot.end_time),
        },
        add: values.new_slots.map((ns) => ({
          date: toDateString(ns.date),
          slot_start: toISO(ns.date, ns.start_time),
          slot_end: toISO(ns.date, ns.end_time),
        })),
      };
      console.log("Submitting reschedule with body:", body);
      await axios.patch(`/panel/reschedule-slots?rescheduling_token=${token}`, body);
      setSubmitSuccess("rescheduled");
      toast.success("Reschedule submitted!");
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || err?.response?.data?.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Cancel ─────────────────────────────────────────────────────────────────
  const handleCancel = async (reason: string) => {
    setCancelSubmitting(true);
    try {
      await axios.post(`/panel/cancel-interview?token=${token}`, { reason });
      setCancelOpen(false);
      setSubmitSuccess("cancelled");
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || err?.response?.data?.message || "Failed to cancel.");
    } finally {
      setCancelSubmitting(false);
    }
  };

  // ── Guards ─────────────────────────────────────────────────────────────────
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

  if (fetchError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-sm w-full">
          <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{fetchError}</AlertDescription></Alert>
        </div>
      </div>
    );
  }

  // if (config?.status === "no_calendar") {
    
  //   const [connecting, setConnecting] = useState(false);

  //   const handleConnect = async () => {
  //     setConnecting(true);
  //     try {
  //       const currentPage = window.location.pathname + window.location.search;
  //       const res = await axios.get(`/oauth/google/calendar?redirect_to=${encodeURIComponent(currentPage)}`);
  //       window.location.href = res.data;
  //     } catch {
  //       toast.error("Failed to connect calendar. Please try again.");
  //     }
  //     setConnecting(false);
  //   };
  //   return (
  //     <div className="min-h-screen flex items-center justify-center p-4">
  //       <div className="max-w-sm w-full text-center space-y-4">
  //         <div className="h-16 w-16 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto">
  //           <CalendarDays className="h-8 w-8 text-blue-500" />
  //         </div>
  //         <div className="space-y-1">
  //           <h2 className="text-base font-semibold">Connect Your Calendar</h2>
  //           <p className="text-sm text-muted-foreground">
  //             You need to connect Google Calendar before submitting your availability.
  //           </p>
  //         </div>
  //         <Button className="w-full h-9 text-sm font-medium" onClick={handleConnect} disabled={connecting}>
  //           {connecting ? (
  //             <span className="flex items-center gap-2">
  //               <span className="h-3.5 w-3.5 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
  //               Connecting…
  //             </span>
  //           ) : (
  //             <span className="flex items-center gap-2">
  //               <CalendarDays className="h-3.5 w-3.5" />Connect Google Calendar
  //             </span>
  //           )}
  //         </Button>
  //       </div>
  //     </div>
  //   );
  // }


  const statusScreens: Record<string, { icon: React.ReactNode; bg: string; title: string }> = {
    closed: { icon: <AlertCircle className="h-8 w-8 text-amber-500" />, bg: "bg-amber-500/10", title: "Submission Closed" },
    expired: { icon: <AlertCircle className="h-8 w-8 text-destructive" />, bg: "bg-destructive/10", title: "Slot Already Expired" },
    too_late: { icon: <Timer className="h-8 w-8 text-amber-500" />, bg: "bg-amber-500/10", title: "Too Late to Reschedule" },
    not_booked: { icon: <CheckCircle2 className="h-8 w-8 text-emerald-500" />, bg: "bg-emerald-500/10", title: "Slot Not Booked" },
    not_started: { icon: <Timer className="h-8 w-8 text-blue-500" />, bg: "bg-blue-500/10", title: "Not Started Yet" },
    no_calendar: { icon: <AlertCircle className="h-8 w-8 text-amber-500" />, bg: "bg-amber-500/10", title: "Calendar Not Connected" },
  };

  if (config && config.status !== "open") {
    const s = statusScreens[config.status] ?? { icon: null, bg: "bg-muted", title: config.status };
    return <StatusScreen icon={s.icon} iconBg={s.bg} title={s.title} message={config.message} />;
  }

  if (submitSuccess === "rescheduled") {
    return <StatusScreen icon={<RefreshCcw className="h-8 w-8 text-emerald-500" />} iconBg="bg-emerald-500/10" title="Reschedule Submitted!" message="Your updated slot has been saved. The candidate will be notified." />;
  }
  if (submitSuccess === "cancelled") {
    return <StatusScreen icon={<XCircle className="h-8 w-8 text-destructive" />} iconBg="bg-destructive/10" title="Interview Cancelled" message="The interview has been cancelled and the candidate has been notified." />;
  }

  const data = config!.data!;
  const minDate = new Date(Math.max(startOfDay(new Date()).getTime(), parseISO(data.start_date).getTime()));
  const maxDate = parseISO(data.end_date);

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <CancelDialog open={cancelOpen} onClose={() => setCancelOpen(false)} onConfirm={handleCancel} submitting={cancelSubmitting} />

      {/* Header */}
      <div className="border-b border-border/50 bg-background/95 backdrop-blur sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base font-bold tracking-tight truncate">{data.title}</h1>
                <Badge variant="secondary" className="flex items-center gap-1 text-[11px] px-2 py-0.5 shrink-0">
                  <Video className="h-2.5 w-2.5" />{data.interview_type}
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1 text-[11px] px-2 py-0.5 shrink-0 border-orange-300/50 text-orange-600 bg-orange-500/5">
                  <RefreshCcw className="h-2.5 w-2.5" />Rescheduling
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">Update the slot time or add extra slots for the candidate</p>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap shrink-0">
              <Badge variant="outline" className="flex items-center gap-1 text-[11px] font-normal px-2 py-0.5">
                <CalendarDays className="h-2.5 w-2.5 text-muted-foreground" />
                {format(parseISO(data.start_date), "MMM d")} – {format(parseISO(data.end_date), "MMM d")}
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1 text-[11px] font-normal px-2 py-0.5">
                <Timer className="h-2.5 w-2.5 text-muted-foreground" />{data.duration_minutes} min
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 pb-16">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

            {/* ── 1. Reschedule the released slot ───────────────────────── */}
            <Card className="border-amber-200/60 bg-amber-500/[0.025]">
              <CardHeader className="pb-3 pt-4 px-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-amber-500/15 flex items-center justify-center shrink-0">
                    <Pencil className="h-3 w-3 text-amber-600" />
                  </div>
                  Edit rescheduled slot
                  <Badge variant="outline" className="ml-auto text-[10px] px-1.5 py-0 border-amber-200/60 text-amber-600 bg-amber-500/8 font-normal">
                    Required
                  </Badge>
                </CardTitle>
                <p className="text-xs text-muted-foreground pl-8">
                  This is the originally booked slot. Change its date or time.
                </p>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-3">
                <Controller
                  control={form.control}
                  name="reschedule_slot.date"
                  render={({ field: dateField, fieldState: dateState }) => (
                    <Controller
                      control={form.control}
                      name="reschedule_slot.start_time"
                      render={({ field: startField, fieldState: startState }) => (
                        <Controller
                          control={form.control}
                          name="reschedule_slot.end_time"
                          render={({ field: endField }) => (
                            <DateTimePicker
                              dateValue={dateField.value}
                              onDateChange={dateField.onChange}
                              startValue={startField.value ?? ""}
                              onStartChange={(val) => { startField.onChange(val); endField.onChange(suggestEndTime(val, data.duration_minutes)); }}
                              endValue={endField.value ?? ""}
                              minDate={minDate} maxDate={maxDate}
                              duration={data.duration_minutes}
                              dateError={dateState.error?.message}
                              timeError={startState.error?.message}
                            />
                          )}
                        />
                      )}
                    />
                  )}
                />
                {rescheduleOverlaps.length > 0 && <OverlapWarning overlaps={rescheduleOverlaps} />}
              </CardContent>
            </Card>

            {/* ── 2. Existing slots accordion ───────────────────────────── */}
            <ExistingSlotsAccordion existingGroups={data.existing_slots} rescheduleSlotId={data.reschedule_slot_id} />

            {/* ── 3. New slots ───────────────────────────────────────────── */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground/80">Add extra slots</p>
                  <p className="text-xs text-muted-foreground/60 mt-0.5">Optional — give the candidate more options to pick from</p>
                </div>
                {newSlotFields.length > 0 && (
                  <Badge variant="secondary" className="text-[11px]">
                    <Sparkles className="h-3 w-3 mr-1" />{newSlotFields.length} added
                  </Badge>
                )}
              </div>

              {newSlotFields.map((field, i) => (
                <Card key={field.id} className="border-emerald-200/40 bg-emerald-500/[0.02]">
                  <CardContent className="px-4 py-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                        <Sparkles className="h-3 w-3" />New slot {i + 1}
                      </span>
                      <Button
                        type="button" variant="ghost" size="icon"
                        className="h-6 w-6 text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10"
                        onClick={() => removeNewSlot(i)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <Controller
                      control={form.control}
                      name={`new_slots.${i}.date`}
                      render={({ field: dateField, fieldState: dateState }) => (
                        <Controller
                          control={form.control}
                          name={`new_slots.${i}.start_time`}
                          render={({ field: startField, fieldState: startState }) => (
                            <Controller
                              control={form.control}
                              name={`new_slots.${i}.end_time`}
                              render={({ field: endField }) => (
                                <DateTimePicker
                                  dateValue={dateField.value}
                                  onDateChange={dateField.onChange}
                                  startValue={startField.value ?? ""}
                                  onStartChange={(val) => { startField.onChange(val); endField.onChange(suggestEndTime(val, data.duration_minutes)); }}
                                  endValue={endField.value ?? ""}
                                  minDate={minDate} maxDate={maxDate}
                                  duration={data.duration_minutes}
                                  dateError={dateState.error?.message}
                                  timeError={startState.error?.message}
                                />
                              )}
                            />
                          )}
                        />
                      )}
                    />
                    {(newSlotOverlaps[i]?.length ?? 0) > 0 && <OverlapWarning overlaps={newSlotOverlaps[i]} />}
                  </CardContent>
                </Card>
              ))}

              <Button
                type="button" variant="outline"
                className="w-full h-10 border-dashed text-sm text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all"
                onClick={() => appendNewSlot({ date: undefined as any, start_time: "", end_time: "" })}
              >
                <Plus className="h-4 w-4 mr-2" />Add Extra Slot
              </Button>
            </div>

            {/* ── Overlap global banner ─────────────────────────────────── */}
            {hasAnyOverlap && (
              <Alert variant="destructive" className="py-2.5">
                <AlertTriangle className="h-3.5 w-3.5" />
                <AlertDescription className="text-xs">Some slots overlap — fix them before submitting.</AlertDescription>
              </Alert>
            )}

            <Separator className="opacity-30" />

            {/* ── Actions ───────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Button type="submit" className="flex-1 h-10 font-medium text-sm" disabled={submitting || hasAnyOverlap}>
                {submitting
                  ? <span className="flex items-center gap-2"><span className="h-3.5 w-3.5 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />Saving…</span>
                  : <span className="flex items-center gap-2"><RefreshCcw className="h-3.5 w-3.5" />Submit Reschedule</span>}
              </Button>
              <Button
                type="button" variant="outline"
                className="sm:w-auto h-10 text-sm text-destructive border-destructive/30 hover:bg-destructive/5 hover:text-destructive"
                onClick={() => setCancelOpen(true)} disabled={submitting}
              >
                <XCircle className="h-3.5 w-3.5 mr-2" />Cancel Interview
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground/40 pb-2">
              Submitting will update the slot in your calendar. The candidate will be notified to re-book.
            </p>

          </form>
        </Form>
      </div>
    </div>
  );
}