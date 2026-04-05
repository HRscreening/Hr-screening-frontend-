import { z } from 'zod';
import { Video, Phone, MapPin } from 'lucide-react';

// ─── Panelist schemas ─────────────────────────────────────────────────────────

/** A panelist that already exists in the DB (has an id) */
const existingPanelistSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  role: z.string().min(1, 'Role is required'),
});

/** A brand-new panelist being added (no id yet) */
const newPanelistSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.email('Invalid email'),
  role: z.string().min(1, 'Role is required'),
});

// ─── Panelist diff payload (what gets sent to the API) ────────────────────────

export const panelistDiffSchema = z.object({
  add: z.array(newPanelistSchema).default([]),
  edit: z.array(existingPanelistSchema).default([]),
  delete: z.array(z.string()).default([]), // array of ids
});

export type PanelistDiff = z.infer<typeof panelistDiffSchema>;

// ─── What the form tracks internally ─────────────────────────────────────────

/**
 * A "form panelist" is one row in the UI.
 * - `id` is present for existing rows, absent/undefined for newly added ones.
 * - `_deleted` is a soft-delete flag; the row is hidden from the UI but kept
 *    in the form array so we can include its id in the DELETE list.
 */
export type FormPanelist = {
  /** Undefined for brand-new rows that haven't been saved yet */
  id?: string;
  name: string;
  email: string;
  role: string;
  /** When true the row is hidden in the UI and will be sent in delete[] */
  _deleted?: boolean;
};

// ─── Zod schema for form panelists (used inside roundEditSchema) ──────────────

const formPanelistSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  role: z.string().min(1, 'Role is required'),
  _deleted: z.boolean().optional(),
});

// ─── Main round edit schema ───────────────────────────────────────────────────

export const roundEditSchema = z
  .object({
    title: z.string().min(1, 'Title is required'),
    interview_type: z.enum(['In Person', 'Phone', 'Video Call']),
    instructions: z.string().optional(),
    duration_minutes: z.number().min(1, 'Min 1 minute'),
    assessment_criterias: z.array(z.string()),

    /**
     * All panelist rows (existing + new + soft-deleted).
     * Validation considers only non-deleted rows.
     */
    panelists: z.array(formPanelistSchema),


    start_date: z.date(),
    end_date: z.date(),
    timezone: z.string().min(1, 'Required'),
    panel_mode: z.enum(['SEQUENTIAL', 'PANEL']),
  })
  .superRefine((data, ctx) => {
    const active = data.panelists.filter((p) => !p._deleted);

    // Must have at least one active panelist
    if (active.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'At least one panelist is required',
        path: ['panelists'],
      });
      return;
    }

    // Validate each active panelist's fields
    active.forEach((p, activeIdx) => {
      // Map back to the real index in the full array (needed for field-level errors)

      console.log(activeIdx)
      const realIdx = data.panelists.findIndex(
        (fp) => !fp._deleted && fp === p
      );

      if (!p.name || p.name.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Name is required',
          path: ['panelists', realIdx, 'name'],
        });
      }
      if (!p.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Invalid email',
          path: ['panelists', realIdx, 'email'],
        });
      }
      if (!p.role || p.role.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Role is required',
          path: ['panelists', realIdx, 'role'],
        });
      }
    });

    // Duplicate email check across active panelists
    const emails = active.map((p) => p.email?.toLowerCase());
    const seen = new Set<string>();
    emails.forEach((email, activeIdx) => {
      if (!email) return;
      if (seen.has(email)) {
        const realIdx = data.panelists.findIndex(
          (fp, i) =>
            !fp._deleted &&
            fp.email?.toLowerCase() === email &&
            data.panelists.slice(0, i).filter((x) => !x._deleted && x.email?.toLowerCase() === email).length > 0
        );
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Duplicate email — each panelist must have a unique email',
          path: ['panelists', realIdx === -1 ? activeIdx : realIdx, 'email'],
        });
      }
      seen.add(email);
    });
  });

export type RoundEditValues = z.infer<typeof roundEditSchema>;

// ─── Helper: derive the diff payload from form values ────────────────────────

/**
 * Call this before sending to the API.
 * Splits the flat `panelists` array into { add, edit, delete }.
 */
export function buildPanelistDiff(panelists: FormPanelist[]): PanelistDiff {
  const add: PanelistDiff['add'] = [];
  const edit: PanelistDiff['edit'] = [];
  const del: string[] = [];

  for (const p of panelists) {
    if (p._deleted) {
      // Only need to delete if it was already saved (has an id)
      if (p.id) del.push(p.id);
    } else if (!p.id) {
      // Brand-new row
      add.push({ name: p.name, email: p.email, role: p.role });
    } else {
      // Existing row — always include in edit so backend can upsert/no-op
      edit.push({ id: p.id, name: p.name, email: p.email, role: p.role });
    }
  }

  return { add, edit, delete: del };
}

// ─── Mode / timezone options (unchanged) ─────────────────────────────────────

export const MODE_OPTIONS = [
  {
    value: 'Video Call' as const,
    label: 'Video Call',
    icon: Video,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
  },
  {
    value: 'Phone' as const,
    label: 'Phone',
    icon: Phone,
    color: 'text-green-500',
    bg: 'bg-green-500/10',
  },
  {
    value: 'In Person' as const,
    label: 'In Person',
    icon: MapPin,
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
  },
] as const;

export const TIMEZONE_OPTIONS = [
  'UTC',
  'Asia/Kolkata',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Asia/Singapore',
  'Australia/Sydney',
] as const;

// ─── API / DB types (unchanged, add as needed) ────────────────────────────────

export interface RoundOverview {
  round_config_id: string;
  round_number: number;
  title: string;
  interview_type: string;
  start_date: string;
  end_date: string;
  panelists_count: number;
  is_slots_available: boolean;
}

export interface RoundFullConfig {
  round_config_id: string;
  round_number: number;
  title: string;
  interview_type: string;
  instructions?: string;
  duration_minutes: number;
  panel_mode: 'panel' | 'sequential';
  timezone?: string;

  start_date: string;
  end_date: string;
  assessment_criterias?: string[];
  /** Panelists now come from a relational table, so they always have an id */
  panelists: Array<{ id: string; name: string; email: string; role: string }>;
}