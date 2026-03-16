"use client";

/**
 * SlotAvailabilityForm.tsx  — Universal availability form
 *
 * Handles BOTH first-time submission and editing in one component.
 * Mode is driven entirely by data.is_editing from the backend.
 *
 * Backend shape (GET /panel/get-details-for-form?token=):
 * {
 *   status: "open" | "closed" | "expired" | "submitted" | "not_started",
 *   data: {
 *     title, start_date, end_date, duration_minutes, interview_type,
 *     is_editing: boolean,
 *     existing_slots: [          ← always present, empty [] on first visit
 *       { date: "YYYY-MM-DD", slots: [{ id, slot_start, slot_end, is_booked, is_expired }] }
 *     ]
 *   }
 * }
 *
 * Submit payload:
 *   First time  → POST /panel/submit-availability   body: available_slots[]
 *   Editing     → PATCH /panel/edit-slots           body: { add, delete, update }
 */

import { useEffect, useState, useCallback } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Form, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";

// Icons
import {
  CalendarDays,
  Clock,
  Plus,
  Trash2,
  Video,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Timer,
  CalendarCheck,
  X,
  Lock,
  Pencil,
  Save,
  RotateCcw,
  Sparkles,
} from "lucide-react";

import { ClockTimePicker } from "@/components/helpers/Clocktimepicker";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface RawSlot {
  id: string;
  slot_start: string; // ISO
  slot_end: string;   // ISO
  is_booked: boolean;
  is_expired: boolean;
}

interface ExistingSlotGroup {
  date: string;       // "YYYY-MM-DD"
  slots: RawSlot[];
}

interface FormConfig {
  status: "open" | "closed" | "expired" | "submitted" | "not_started";
  message?: string;
  data?: {
    title: string;
    start_date: string;
    end_date: string;
    duration_minutes: number;
    interview_type: string;
    is_editing: boolean;
    existing_slots: ExistingSlotGroup[];
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Zod Schema
// ─────────────────────────────────────────────────────────────────────────────

const slotSchema = z
  .object({
    id: z.string().optional(),             // undefined = new (unsaved)
    kind: z.enum(["booked", "existing", "new"]),
    start_time: z.string().min(1, "Start time required"),
    end_time: z.string().min(1, "End time required"),
    original_start: z.string().optional(), // snapshot at load time — used to detect edits
    original_end: z.string().optional(),   // snapshot at load time — used to detect edits
    markedForDeletion: z.boolean().optional(),
  })
  .refine((s) => s.start_time < s.end_time, {
    message: "End time must be after start time",
    path: ["end_time"],
  });

const dateGroupSchema = z.object({
  date: z.date({ error: "Please select a date" }),
  slots: z.array(slotSchema).min(1, "Add at least one slot"),
});

// No .min(1) — edit mode allows submitting with only deletions
const formSchema = z.object({
  groups: z.array(dateGroupSchema),
});

type SlotEntry = z.infer<typeof slotSchema>;
type DateGroup = z.infer<typeof dateGroupSchema>;
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

function isoToHHMM(iso: string): string {
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

function suggestEndTime(startTime: string, duration: number): string {
  if (!startTime) return "";
  const [h, m] = startTime.split(":").map(Number);
  const end = addMinutes(new Date(2000, 0, 1, h, m), duration);
  return `${end.getHours().toString().padStart(2, "0")}:${end.getMinutes().toString().padStart(2, "0")}`;
}

function toISO(date: Date, timeStr: string): string {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const dt = new Date(date);
  dt.setHours(hours, minutes, 0, 0);
  return dt.toISOString();
}

function toDateString(date: Date): string {
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
}

/** Returns true if any two active (non-deleted) slots on the same day overlap */
function slotsOverlap(slots: SlotEntry[]): boolean {
  const active = slots.filter((s) => !s.markedForDeletion && s.start_time && s.end_time);
  const ranges = active
    .map((s) => ({ s: timeToMinutes(s.start_time), e: timeToMinutes(s.end_time) }))
    .sort((a, b) => a.s - b.s);
  for (let i = 1; i < ranges.length; i++) {
    if (ranges[i].s < ranges[i - 1].e) return true;
  }
  return false;
}

/**
 * Build form default values from the backend's existing_slots groups.
 * Always produces DateGroup[] — empty array if no existing slots.
 */
function buildDefaultValues(existingGroups: ExistingSlotGroup[]): FormValues {
  if (!existingGroups.length) return { groups: [] };

  const groups: DateGroup[] = existingGroups.map((g) => ({
    date: parseISO(g.date),
    slots: g.slots.map((s) => {
      const hhmm_start = isoToHHMM(s.slot_start);
      const hhmm_end   = isoToHHMM(s.slot_end);
      return {
        id: s.id,
        kind: s.is_booked ? ("booked" as const) : ("existing" as const),
        start_time: hhmm_start,
        end_time: hhmm_end,
        original_start: hhmm_start, // snapshot — never mutated
        original_end: hhmm_end,     // snapshot — never mutated
        markedForDeletion: false,
      };
    }),
  }));

  return { groups };
}

// ─────────────────────────────────────────────────────────────────────────────
// SlotRow — single slot row (booked / existing / new)
// ─────────────────────────────────────────────────────────────────────────────

interface SlotRowProps {
  groupIndex: number;
  slotIndex: number;
  duration: number;
  control: any;
  setValue: any;
  remove: () => void;
  canDelete: boolean; // false when it's the last editable slot on that day
}

function SlotRow({ groupIndex, slotIndex, duration, control, setValue, remove, canDelete }: SlotRowProps) {
  const basePath = `groups.${groupIndex}.slots.${slotIndex}` as const;
  const slot: SlotEntry = useWatch({ control, name: basePath });

  if (!slot) return null;

  const isBooked = slot.kind === "booked";
  const isNew    = slot.kind === "new";
  const isMarked = !!slot.markedForDeletion;

  const handleStartChange = (val: string) => {
    setValue(`${basePath}.start_time`, val, { shouldValidate: true });
    setValue(`${basePath}.end_time`, suggestEndTime(val, duration), { shouldValidate: true });
    // no dirty flag needed — onSubmit compares against original_start/original_end
  };

  // ── Booked — read-only ────────────────────────────────────────────────────
  if (isBooked) {
    return (
      <div className="flex items-center gap-2 select-none">
        <div className="flex items-center gap-2 flex-1 h-8 px-3 rounded-md border border-border/40 bg-muted/30 text-sm text-muted-foreground opacity-60">
          <Lock className="h-3 w-3 shrink-0" />
          <span>{to12Display(slot.start_time)} – {to12Display(slot.end_time)}</span>
        </div>
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0 bg-amber-500/10 text-amber-600 border-amber-200/50">
          Booked
        </Badge>
        <div className="w-8 shrink-0" /> {/* spacer to align with delete btn */}
      </div>
    );
  }

  // ── Marked for deletion — strikethrough ───────────────────────────────────
  if (isMarked) {
    return (
      <div className="flex items-center gap-2 opacity-50 animate-in fade-in duration-150">
        <div className="flex items-center gap-2 flex-1 h-8 px-3 rounded-md border border-destructive/20 bg-destructive/5 text-sm text-muted-foreground line-through">
          <span>{to12Display(slot.start_time)} – {to12Display(slot.end_time)}</span>
        </div>
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0 bg-destructive/10 text-destructive border-destructive/20">
          Will delete
        </Badge>
        <Button
          type="button" variant="ghost" size="icon"
          className="h-8 w-8 shrink-0 text-muted-foreground/40 hover:text-primary hover:bg-primary/5"
          onClick={() => setValue(`${basePath}.markedForDeletion`, false, { shouldValidate: true })}
          title="Undo deletion"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  // ── Editable (existing or new) ────────────────────────────────────────────
  return (
    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-150">
      {/* From */}
      <FormField
        control={control}
        name={`${basePath}.start_time`}
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

      {/* To — computed, read-only */}
      <FormField
        control={control}
        name={`${basePath}.end_time`}
        render={({ field }) => (
          <div className="flex-1">
            <div className="flex items-center gap-2 h-8 px-3 rounded-md border text-sm bg-muted/40 border-border/50 text-muted-foreground select-none">
              <Clock className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
              {field.value
                ? <span>{to12Display(field.value)}</span>
                : <span className="text-muted-foreground/40">To</span>}
            </div>
          </div>
        )}
      />

      {/* New badge */}
      {isNew && (
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0 bg-emerald-500/10 text-emerald-600 border-emerald-200/50">
          <Sparkles className="h-2.5 w-2.5 mr-0.5" />New
        </Badge>
      )}

      {/* Delete / mark-for-deletion */}
      <Button
        type="button" variant="ghost" size="icon"
        className="h-8 w-8 shrink-0 text-muted-foreground/25 hover:text-destructive hover:bg-destructive/10 transition-colors"
        disabled={!canDelete}
        onClick={() => {
          if (isNew) {
            remove(); // new slots are just removed from the array
          } else {
            setValue(`${basePath}.markedForDeletion`, true, { shouldValidate: true }); // existing → soft-delete
          }
        }}
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DateGroupSection
// ─────────────────────────────────────────────────────────────────────────────

interface DateGroupSectionProps {
  groupIndex: number;
  control: any;
  setValue: any;
  clearErrors: any;
  removeGroup: () => void;
  config: NonNullable<FormConfig["data"]>;
  isEditMode: boolean;
}

function DateGroupSection({
  groupIndex, control, setValue, clearErrors, removeGroup, config, isEditMode,
}: DateGroupSectionProps) {
  const [calOpen, setCalOpen] = useState(false);

  const { fields: slotFields, append: appendSlot, remove: removeSlot } =
    useFieldArray({ control, name: `groups.${groupIndex}.slots` });

  const currentSlots: SlotEntry[] = useWatch({ control, name: `groups.${groupIndex}.slots` }) ?? [];

  const hasBookedSlots    = currentSlots.some((s) => s.kind === "booked");
  const activeEditable    = currentSlots.filter((s) => s.kind !== "booked" && !s.markedForDeletion);
  const overlap           = slotsOverlap(currentSlots);

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
        {/* Date picker row */}
        <div className="flex items-start gap-2">
          <FormField
            control={control}
            name={`groups.${groupIndex}.date`}
            render={({ field, fieldState }) => (
              <FormItem className="flex-1 space-y-0">
                <Popover open={calOpen} onOpenChange={setCalOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={`w-full justify-between h-9 text-sm ${!field.value ? "font-normal text-muted-foreground" : "font-medium"} ${fieldState.error ? "border-destructive" : ""}`}
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
            onClick={removeGroup}
            disabled={isEditMode && hasBookedSlots}
            title={isEditMode && hasBookedSlots ? "Can't remove a date with booked slots" : "Remove this date"}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Slots header */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground/60">
            Time slots{slotFields.length > 0 && <span className="ml-1 opacity-60">({slotFields.length})</span>}
          </span>
          {overlap && (
            <span className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />Overlapping slots
            </span>
          )}
        </div>

        {/* Column labels — only show when there are editable active slots */}
        {activeEditable.length > 0 && (
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
            <SlotRow
              key={slotField.id}
              groupIndex={groupIndex}
              slotIndex={slotIndex}
              duration={config.duration_minutes}
              control={control}
              setValue={setValue}
              remove={() => {
                removeSlot(slotIndex);
                clearErrors(`groups.${groupIndex}.slots.${slotIndex}` as any);
                setTimeout(() => clearErrors(`groups.${groupIndex}.slots` as any), 0);
              }}
              // prevent deleting the last active editable slot
              canDelete={activeEditable.length > 1 || (currentSlots[slotIndex]?.kind === "new")}
            />
          ))}
        </div>

        <Button
          type="button" variant="ghost" size="sm"
          className="h-7 px-2 text-xs text-muted-foreground/60 hover:text-primary hover:bg-primary/5 -ml-1"
          onClick={() => appendSlot({ kind: "new", start_time: "", end_time: "", markedForDeletion: false })}
        >
          <Plus className="h-3.5 w-3.5 mr-1" />Add slot
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SummaryContent — sidebar (desktop) + compact bar (mobile)
// ─────────────────────────────────────────────────────────────────────────────

interface SummaryContentProps {
  groups: Partial<DateGroup>[];
  isEditMode: boolean;
  submitting: boolean;
  formErrors: any;
  compact?: boolean;
  onMobileSubmit?: () => void; // only used in compact/mobile mode
}

function SummaryContent({ groups, isEditMode, submitting, formErrors, compact, onMobileSubmit }: SummaryContentProps) {
  // ── Compute stats ──────────────────────────────────────────────────────────
  let toAdd = 0, toDelete = 0, toUpdate = 0, booked = 0, unchanged = 0, freshTotal = 0;

  for (const g of groups) {
    for (const s of g.slots ?? []) {
      if (!s.start_time) continue;
      if (s.kind === "booked")        { booked++;   continue; }
      if (s.markedForDeletion)        { toDelete++; continue; }
      if (s.kind === "new")           { toAdd++;    continue; }
      if (
        s.kind === "existing" &&
        (s.start_time !== s.original_start || s.end_time !== s.original_end)
      )                               { toUpdate++; continue; }
      unchanged++;
    }
  }

  // For first-time mode: count all filled new slots
  const validFirstTime = groups.filter(
    (g) => g.date && (g.slots ?? []).some((s) => s.start_time && s.end_time && !s.markedForDeletion)
  );
  freshTotal = validFirstTime.reduce(
    (acc, g) => acc + (g.slots ?? []).filter((s) => s.start_time && s.end_time && !s.markedForDeletion).length,
    0
  );

  const hasChanges = isEditMode ? (toAdd + toDelete + toUpdate > 0) : freshTotal > 0;

  const errorMsg =
    formErrors?.groups?.root?.message ||
    (typeof formErrors?.groups?.message === "string" ? formErrors.groups.message : null);

  // ── Submit button label ────────────────────────────────────────────────────
  const submitLabel = isEditMode ? (
    <span className="flex items-center gap-2"><Save className="h-3.5 w-3.5" />Save Changes</span>
  ) : "Submit Availability";

  const submittingLabel = (
    <span className="flex items-center gap-2">
      <span className="h-3.5 w-3.5 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
      {isEditMode ? "Saving…" : "Submitting…"}
    </span>
  );

  // ── Compact (mobile bottom bar) ────────────────────────────────────────────
  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {isEditMode ? (
            <>
              {toAdd > 0 && (
                <div className="text-center shrink-0">
                  <p className="text-lg font-bold tabular-nums leading-none text-emerald-600">+{toAdd}</p>
                  <p className="text-[10px] text-muted-foreground">new</p>
                </div>
              )}
              {toDelete > 0 && (
                <div className="text-center shrink-0">
                  <p className="text-lg font-bold tabular-nums leading-none text-destructive">-{toDelete}</p>
                  <p className="text-[10px] text-muted-foreground">delete</p>
                </div>
              )}
              {toUpdate > 0 && (
                <div className="text-center shrink-0">
                  <p className="text-lg font-bold tabular-nums leading-none text-blue-600">{toUpdate}</p>
                  <p className="text-[10px] text-muted-foreground">edited</p>
                </div>
              )}
              {!hasChanges && <p className="text-xs text-muted-foreground/60">No changes yet</p>}
            </>
          ) : (
            <>
              <div className="text-center shrink-0">
                <p className="text-lg font-bold tabular-nums leading-none">{validFirstTime.length}</p>
                <p className="text-[10px] text-muted-foreground">dates</p>
              </div>
              <div className="w-px h-6 bg-border/50 shrink-0" />
              <div className="text-center shrink-0">
                <p className="text-lg font-bold tabular-nums leading-none">{freshTotal}</p>
                <p className="text-[10px] text-muted-foreground">slots</p>
              </div>
            </>
          )}
          {errorMsg && <p className="text-xs text-destructive truncate flex-1">{errorMsg}</p>}
        </div>
        <Button
          type={compact ? "button" : "submit"}
          onClick={compact ? onMobileSubmit : undefined}
          className="h-10 px-6 font-medium text-sm shrink-0"
          disabled={submitting || !hasChanges}
        >
          {submitting ? submittingLabel : submitLabel}
        </Button>
      </div>
    );
  }

  // ── Desktop sidebar ────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {isEditMode ? (
        <>
          <p className="text-xs text-muted-foreground/60 -mt-1">Pending changes</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-emerald-500/8 border border-emerald-500/15 px-3 py-2.5 text-center">
              <p className="text-2xl font-bold tabular-nums leading-none text-emerald-600">+{toAdd}</p>
              <p className="text-xs text-muted-foreground mt-1">Adding</p>
            </div>
            <div className="rounded-lg bg-destructive/8 border border-destructive/15 px-3 py-2.5 text-center">
              <p className="text-2xl font-bold tabular-nums leading-none text-destructive">-{toDelete}</p>
              <p className="text-xs text-muted-foreground mt-1">Removing</p>
            </div>
          </div>
          {toUpdate > 0 && (
            <div className="rounded-lg bg-blue-500/8 border border-blue-500/15 px-3 py-2.5 text-center">
              <p className="text-xl font-bold tabular-nums leading-none text-blue-600">{toUpdate} updated</p>
              <p className="text-xs text-muted-foreground mt-0.5">Time changed</p>
            </div>
          )}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground/60">
              <span>Unchanged</span><span>{unchanged}</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground/60">
              <span>Booked (locked)</span><span>{booked}</span>
            </div>
          </div>
          {!hasChanges && (
            <div className="py-3 text-center">
              <CheckCircle2 className="h-5 w-5 text-muted-foreground/15 mx-auto mb-1.5" />
              <p className="text-xs text-muted-foreground/40">No changes yet</p>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-muted/50 px-3 py-2.5 text-center">
              <p className="text-2xl font-bold tabular-nums leading-none">{validFirstTime.length}</p>
              <p className="text-xs text-muted-foreground mt-1">{validFirstTime.length === 1 ? "Date" : "Dates"}</p>
            </div>
            <div className="rounded-lg bg-muted/50 px-3 py-2.5 text-center">
              <p className="text-2xl font-bold tabular-nums leading-none">{freshTotal}</p>
              <p className="text-xs text-muted-foreground mt-1">{freshTotal === 1 ? "Slot" : "Slots"}</p>
            </div>
          </div>
          {validFirstTime.length > 0 ? (
            <div className="space-y-3">
              {validFirstTime.map((entry, i) => (
                <div key={i} className="space-y-1">
                  <p className="text-xs font-semibold text-foreground/70">
                    {entry.date ? format(entry.date, "EEE, MMM d") : ""}
                  </p>
                  <div className="space-y-0.5">
                    {(entry.slots ?? [])
                      .filter((s) => s.start_time && s.end_time && !s.markedForDeletion)
                      .map((slot, j) => (
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
        </>
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
        disabled={submitting || !hasChanges}
      >
        {submitting ? submittingLabel : submitLabel}
      </Button>
    </div>
  );
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
// SlotAvailabilityForm — main export
// Route: /panelist/availability?token=<jwt>
// ─────────────────────────────────────────────────────────────────────────────

export default function SlotAvailabilityForm() {
  const location = useLocation();
  const token = new URLSearchParams(location.search).get("token");

  const [config, setConfig]           = useState<FormConfig | null>(null);
  const [loading, setLoading]         = useState(true);
  const [submitting, setSubmitting]   = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [fetchError, setFetchError]   = useState<string | null>(null);
  const [calendarNotConnected, setCalendarNotConnected] = useState(false);
  const [connecting, setConnecting]   = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { groups: [] },
    mode: "onChange",
    reValidateMode: "onChange",
  });

  const { fields: groupFields, append: appendGroup, remove: removeGroup } =
    useFieldArray({ control: form.control, name: "groups" });

  const watchedGroups = useWatch({ control: form.control, name: "groups" });

  // ── Fetch config + existing slots ──────────────────────────────────────────
  useEffect(() => {
    if (!token) {
      setFetchError("No token found. Please use the link from your email invitation.");
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const res = await axios.get(`/panel/get-details-for-form?token=${token}`);
        const data: FormConfig = res.data;

        if (data.status === "no_calendar" as any) {
          setCalendarNotConnected(true);
          return;
        }

        setConfig(data);

        // Pre-populate form if panelist has existing slots
        if (data.status === "open" && data.data?.existing_slots?.length) {
          form.reset(buildDefaultValues(data.data.existing_slots));
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

  const handleRemoveGroup = useCallback((index: number) => {
    removeGroup(index);
    form.clearErrors(`groups.${index}` as any);
    setTimeout(() => form.clearErrors(), 0);
  }, [removeGroup, form]);

  // ── Cross-group validation ─────────────────────────────────────────────────
  const validateForm = useCallback((values: FormValues): string | null => {
    const dur = config?.data?.duration_minutes;
    for (const group of values.groups) {
      if (slotsOverlap(group.slots))
        return `Overlapping slots on ${format(group.date, "MMM d")}.`;

      const active = group.slots.filter((s) => !s.markedForDeletion && s.kind !== "booked");
      for (const slot of active) {
        if (!slot.start_time || !slot.end_time) continue;
        const diff = timeToMinutes(slot.end_time) - timeToMinutes(slot.start_time);
        if (dur && diff !== dur)
          return `Each slot must be exactly ${dur} min (found ${diff} min on ${format(group.date, "MMM d")}).`;
      }
    }
    return null;
  }, [config]);

  // ── Submit ─────────────────────────────────────────────────────────────────
  const onSubmit = async (values: FormValues) => {
    const isEditMode = config?.data?.is_editing ?? false;

    // First-time guard (edit mode allows all-delete with empty groups)
    if (!isEditMode && values.groups.length === 0) {
      toast.error("Add at least one date before submitting.");
      return;
    }

    const err = validateForm(values);
    if (err) { toast.error(err); return; }

    setSubmitting(true);

    try {
      if (isEditMode) {
        // ── PATCH: diff payload ──────────────────────────────────────────────
        const toAdd:    { date: string; slot_start: string; slot_end: string }[] = [];
        const toDelete: string[] = [];
        const toUpdate: { id: string; slot_start: string; slot_end: string }[] = [];

        for (const group of values.groups) {
          for (const slot of group.slots) {
            if (slot.kind === "booked") continue;

            if (slot.markedForDeletion && slot.id) {
              toDelete.push(slot.id);
            } else if (slot.kind === "new" && slot.start_time && slot.end_time) {
              toAdd.push({
                date:       toDateString(group.date),
                slot_start: toISO(group.date, slot.start_time),
                slot_end:   toISO(group.date, slot.end_time),
              });
            } else if (
              slot.kind === "existing" &&
              slot.id &&
              !slot.markedForDeletion &&
              // compare against original snapshots — reliable, no flag needed
              (slot.start_time !== slot.original_start || slot.end_time !== slot.original_end)
            ) {
              toUpdate.push({
                id:         slot.id,
                slot_start: toISO(group.date, slot.start_time),
                slot_end:   toISO(group.date, slot.end_time),
              });
            }
          }
        }

        await axios.patch(`/panel/edit-slots?token=${token}`, {
          add:    toAdd,
          delete: toDelete,
          update: toUpdate,
        });

        toast.success("Availability updated!");
      } else {
        // ── POST: full payload (first-time) ───────────────────────────────────
        const available_slots = values.groups.map((group) => ({
          date: toDateString(group.date),
          time: group.slots
            .filter((s) => !s.markedForDeletion && s.start_time && s.end_time)
            .map((s) => ({
              start_time: toISO(group.date, s.start_time),
              end_time:   toISO(group.date, s.end_time),
            })),
        }));

        await axios.post(`/panel/submit-availability?token=${token}`, available_slots);
        toast.success("Availability submitted!");
      }

      setSubmitSuccess(true);
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

  // ── Calendar connect ───────────────────────────────────────────────────────
  const handleConnect = async () => {
    setConnecting(true);
    try {
      const currentPage = window.location.pathname + window.location.search;
      const res = await axios.get(`/oauth/google/calendar?redirect_to=${encodeURIComponent(currentPage)}`);
      window.location.href = res.data;
    } catch {
      toast.error("Failed to connect calendar. Please try again.");
    }
    setConnecting(false);
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
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{fetchError}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (calendarNotConnected) {
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
          <Button className="w-full h-9 text-sm font-medium" onClick={handleConnect} disabled={connecting}>
            {connecting ? (
              <span className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                Connecting…
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <CalendarDays className="h-3.5 w-3.5" />Connect Google Calendar
              </span>
            )}
          </Button>
        </div>
      </div>
    );
  }

  if (config && config.status !== "open") {
    const screens = {
      submitted:   { icon: <CheckCircle2 className="h-8 w-8 text-emerald-500" />, bg: "bg-emerald-500/10", title: "Already Submitted" },
      closed:      { icon: <AlertCircle  className="h-8 w-8 text-amber-500" />,   bg: "bg-amber-500/10",   title: "Submission Closed" },
      expired:     { icon: <AlertCircle  className="h-8 w-8 text-destructive" />,  bg: "bg-destructive/10", title: "Link Expired" },
      not_started: { icon: <Timer        className="h-8 w-8 text-blue-500" />,     bg: "bg-blue-500/10",    title: "Not Started Yet" },
    };
    const s = screens[config.status as keyof typeof screens] ?? { icon: null, bg: "bg-muted", title: config.status };
    return <StatusScreen icon={s.icon} iconBg={s.bg} title={s.title} message={config.message} />;
  }

  if (submitSuccess) {
    const isEditMode = config?.data?.is_editing ?? false;
    return (
      <StatusScreen
        icon={<CheckCircle2 className="h-8 w-8 text-emerald-500" />}
        iconBg="bg-emerald-500/10"
        title={isEditMode ? "Availability Updated!" : "Availability Submitted!"}
        message={
          isEditMode
            ? "Your changes have been saved. We'll send you the confirmed schedule shortly."
            : "Thank you. We'll send you the confirmed schedule shortly."
        }
      />
    );
  }

  const data       = config!.data!;
  const isEditMode = data.is_editing;

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">

      {/* ── Sticky header ─────────────────────────────────────────────────── */}
      <div className="border-b border-border/50 bg-background/95 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base font-bold tracking-tight truncate">{data.title}</h1>
                <Badge variant="secondary" className="flex items-center gap-1 text-[11px] px-2 py-0.5 shrink-0">
                  <Video className="h-2.5 w-2.5" />{data.interview_type}
                </Badge>
                {isEditMode && (
                  <Badge variant="outline" className="flex items-center gap-1 text-[11px] px-2 py-0.5 shrink-0 border-blue-300/50 text-blue-600 bg-blue-500/5">
                    <Pencil className="h-2.5 w-2.5" />Editing
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isEditMode
                  ? "Edit your availability — booked slots cannot be changed"
                  : "Share your availability for this interview round"}
              </p>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 flex-wrap shrink-0">
              <Badge variant="outline" className="flex items-center gap-1 text-[11px] font-normal px-2 py-0.5">
                <CalendarDays className="h-2.5 w-2.5 text-muted-foreground" />
                {format(parseISO(data.start_date), "MMM d")} – {format(parseISO(data.end_date), "MMM d")}
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1 text-[11px] font-normal px-2 py-0.5">
                <Timer className="h-2.5 w-2.5 text-muted-foreground" />{data.duration_minutes} min
              </Badge>
            </div>
          </div>

          {/* Mobile meta */}
          <div className="flex sm:hidden items-center gap-2 mt-2 flex-wrap">
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <CalendarDays className="h-3 w-3" />
              {format(parseISO(data.start_date), "MMM d")} – {format(parseISO(data.end_date), "MMM d, yyyy")}
            </span>
            <span className="text-muted-foreground/30 text-xs">·</span>
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Timer className="h-3 w-3" />{data.duration_minutes} min / slot
            </span>
          </div>
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-28 lg:pb-10">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_272px] gap-8 items-start">

              {/* ── LEFT: builder ─────────────────────────────────────────── */}
              <div>
                {/* Section header + legend */}
                <div className="flex items-center gap-4 mb-5 flex-wrap">
                  <p className="text-sm font-medium text-foreground/70">
                    {isEditMode ? "Your availability" : "Add your available dates & times"}
                  </p>
                  {isEditMode && (
                    <div className="flex items-center gap-3 ml-auto">
                      <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <div className="h-2 w-2 rounded-full bg-amber-400/70" />Booked (locked)
                      </span>
                      <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <div className="h-2 w-2 rounded-full bg-emerald-500/70" />New
                      </span>
                      <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <div className="h-2 w-2 rounded-full bg-destructive/60" />Will delete
                      </span>
                    </div>
                  )}
                </div>

                {groupFields.length > 0 && (
                  <div className="mb-1">
                    {groupFields.map((field, index) => (
                      <DateGroupSection
                        key={field.id}
                        groupIndex={index}
                        control={form.control}
                        setValue={form.setValue}
                        clearErrors={form.clearErrors}
                        removeGroup={() => handleRemoveGroup(index)}
                        config={data}
                        isEditMode={isEditMode}
                      />
                    ))}
                  </div>
                )}

                {groupFields.length === 0 && (
                  <div className="py-12 text-center border border-dashed border-border/40 rounded-xl mb-4">
                    <CalendarCheck className="h-8 w-8 text-muted-foreground/15 mx-auto mb-3" />
                    <p className="text-sm font-medium text-muted-foreground/50 mb-0.5">No dates added yet</p>
                    <p className="text-xs text-muted-foreground/35">Tap "Add Date" to get started</p>
                  </div>
                )}

                <Button
                  type="button" variant="outline"
                  className="w-full h-10 border-dashed text-sm text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all"
                  onClick={() => appendGroup({
                    date: undefined as any,
                    slots: [{ kind: "new", start_time: "", end_time: "", markedForDeletion: false }],
                  })}
                >
                  <Plus className="h-4 w-4 mr-2" />Add Date
                </Button>
              </div>

              {/* ── RIGHT: sticky sidebar ─────────────────────────────────── */}
              <div className="hidden lg:block lg:sticky lg:top-18.25">
                <Card className="border-border/50">
                  <CardContent className="p-5">
                    <p className="text-sm font-semibold mb-4 text-foreground/80">
                      {isEditMode ? "Changes" : "Summary"}
                    </p>
                    <SummaryContent
                      groups={watchedGroups ?? []}
                      isEditMode={isEditMode}
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

      {/* ── Mobile sticky bottom bar ──────────────────────────────────────── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-20 bg-background/95 backdrop-blur border-t border-border/50 px-4 py-3 safe-area-bottom">
        <SummaryContent
          groups={watchedGroups ?? []}
          isEditMode={isEditMode}
          submitting={submitting}
          formErrors={form.formState.errors}
          onMobileSubmit={() => form.handleSubmit(onSubmit)()}
          compact
        />
      </div>

    </div>
  );
}