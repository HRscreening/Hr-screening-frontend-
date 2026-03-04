import { z } from "zod";

/* ── Backend response shape ── */

export type JobSettings = {
  title: string;
  location: string | null;
  salary: string | null;
  status: "draft" | "open" | "paused" | "closed" | "archived";
  description: string | null;
  target_headcount: number | null;
  manual_rounds_count: number;
};

export type JobSettingsResponse = {
  job_settings: JobSettings;
  voice_ai_enabled: boolean;
  is_confidential: boolean;
  job_metadata: Record<string, unknown> | null;
  closing_reason: string | null;
};

/* ── Zod schema for editing job settings ── */

export const jobSettingsEditSchema = z.object({
  title: z.string().min(1, "Title is required"),
  location: z.string().nullable(),
  salary: z.string().nullable(),
  status: z.enum(["draft", "open", "paused", "closed", "archived"]),
  description: z.string().nullable(),
  target_headcount: z.number().int().min(0).nullable(),
  manual_rounds_count: z.number().int().min(0),
  voice_ai_enabled: z.boolean(),
  is_confidential: z.boolean(),
});

export type JobSettingsEditValues = z.infer<typeof jobSettingsEditSchema>;

/* ── Status options for the select dropdown ── */

export const STATUS_OPTIONS: { label: string; value: JobSettings["status"] }[] = [
  { label: "Draft", value: "draft" },
  { label: "Open", value: "open" },
  { label: "Paused", value: "paused" },
  { label: "Closed", value: "closed" },
  { label: "Archived", value: "archived" },
];
