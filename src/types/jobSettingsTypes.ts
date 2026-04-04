import { z } from 'zod';


const no_show_action_enum = ["cancel_interview", "mark_no_show", "reject_candidate"] as const
type no_show_action_enum = (typeof no_show_action_enum)[number];

const auto_move_to_next_round_enum = ["both_panel_and_ai", "panel_only", "ai_only", "hr_manual"] as const
type auto_move_to_next_round_enum = (typeof auto_move_to_next_round_enum)[number];

const rescore_on_rubric_change_enum = ["only_new", "all"] as const
type rescore_on_rubric_change_enum = (typeof rescore_on_rubric_change_enum)[number];


export const ReminderSettingsSchema = z.object({
  enabled: z.boolean().default(true),
  form_reminder_count: z.number().int().nonnegative(),
  form_reminder_sec: z.array(z.number().int().nonnegative()),
  interview_reminder_count: z.number().int().nonnegative(),
  interview_reminder_sec: z.array(z.number().int().nonnegative()),
});
export const FeedBackReminderSettingsSchema = z.object({
  enabled: z.boolean().default(true),
  form_reminder_count: z.number().int().nonnegative(),
  form_reminder_sec: z.array(z.number().int().nonnegative()),
});


export type ReminderSettingsType = z.infer<typeof ReminderSettingsSchema>;
export type FeedBackReminderSettingsType = z.infer<typeof FeedBackReminderSettingsSchema>;


export const PanelEscalationSettingsSchema = z.object({
  enabled: z.boolean().default(true),
  escalation_recipients: z.array(z.string().email()).default([]),
});


export type PanelEscalationSettingsType = z.infer<typeof PanelEscalationSettingsSchema>;

export const ReschedulingSettingsSchema = z.object({
  enabled: z.boolean().default(true),
  panelist_rescheduling_allowed: z.boolean().default(true),
  candidate_rescheduling_allowed: z.boolean().default(true),
  reschedule_window_for_panelist: z.number().int().nonnegative().default(43200), // 12 hrs in seconds 
  reschedule_window_for_candidate: z.number().int().nonnegative().default(43200), // 12 hrs in seconds
  no_show_action: z.enum(no_show_action_enum).default("reject_candidate"),
  no_show_grace_minutes: z.number().int().nonnegative().default(15),
  same_panel_on_reschedule: z.boolean().default(true),
  max_reschedule_allowed_by_panelist: z.number().int().nonnegative().default(1),
  max_reschedule_allowed_by_candidate: z.number().int().nonnegative().default(1),
})


export type ReschedulingSettingsType = z.infer<typeof ReschedulingSettingsSchema>;


export const CreateJobSettingsSchema = z.object({
  voice_ai_enabled: z.boolean().default(false),
  is_confidential: z.boolean().default(false),

  auto_score_every_resume: z.boolean().default(false),
  auto_score_every_resume_on_manual_upload: z.boolean().default(false),
  auto_offer_enabled: z.boolean().default(false),
  ai_assessment_enabled: z.boolean().default(false),

  rescore_on_rubric_change: z.enum(rescore_on_rubric_change_enum).default("only_new"),
  auto_move_to_next_round: z.enum(auto_move_to_next_round_enum).default("panel_only"),

  panel_reminders: ReminderSettingsSchema,
  candidate_reminders: ReminderSettingsSchema,
  feedback_reminders: FeedBackReminderSettingsSchema,

  escalation: PanelEscalationSettingsSchema,
  rescheduling: ReschedulingSettingsSchema,
})

export type CreateJobSettingsType = z.infer<typeof CreateJobSettingsSchema>;


export const STATUS_OPTIONS = [
  { label: "Draft", value: "draft" },
  { label: "Open", value: "open" },
  { label: "Paused", value: "paused" },
  { label: "Closed", value: "closed" },
  { label: "Archived", value: "archived" },
] as const;

export const jobSettingsEditSchema = z.object({
  title: z.string().min(1, "Title is required"),
  location: z.string().nullable(),
  salary: z.string().nullable(),
  status: z.enum(["draft", "open", "paused", "closed", "archived"]),
  description: z.string().nullable(),
  target_headcount: z.number().int().nonnegative().nullable(),
  manual_rounds_count: z.number().int().nonnegative(),
  voice_ai_enabled: z.boolean(),
  is_confidential: z.boolean(),
});

export type JobSettingsEditValues = z.infer<typeof jobSettingsEditSchema>;



export type JobSettings = {
  title: string;
  location: string | null;
  salary: string | null;
  status: "draft" | "open" | "paused" | "closed" | "archived";
  description: string | null;
  target_headcount: number | null;
  manual_rounds_count: number;
  job_metadata: Record<string, unknown> | null;
  closing_reason: string | null;
};

export interface SettingsType extends CreateJobSettingsType {
  id: string;
  job_id: string;
  created_at: string;
  updated_at: string;
}

export type JobSettingsResponse = {
  job_details: JobSettings;
  settings: SettingsType;
};
// export type JobSettingsResponse = {
//   job_settings: JobSettings;
//   voice_ai_enabled: boolean;
//   is_confidential: boolean;
//   closing_reason: string | null;
//   job_metadata: Record<string, unknown> | null;
// };
