import { z } from 'zod';

/**
 * Matches backend Panelist model:
 *   name: str (required)
 *   email: EmailStr (required)
 *   role: str (required)
 */
const panelMemberSchema = z.object({
    name: z.string().min(1, 'Name is required').max(100),
    email: z.email('Invalid email address'),
    role: z.string().min(1, 'Role is required'),
});

/**
 * Matches backend CreateInterviewRoundConfigDTO:
 *   title: str (required)
 *   round_number: int (required)
 *   interview_type: InterviewType enum (required)
 *   instructions: str (optional)
 *   duration_minutes: int (required)
 *   panelists: list[Panelist]
 *   meet_link: HttpUrl (optional)
 *   start_date: datetime
 *   end_date: datetime
 *   timezone: str (default "UTC")
 */
const roundSchema = z.object({
    round_number: z.number().min(1, 'Round number must be at least 1'),
    title: z.string().min(1, 'Round title is required').max(100),
    panelists: z.array(panelMemberSchema)
        .min(1, 'At least one panelist is required'),
    start_date: z.date(),
    end_date: z.date(),
    interview_type: z.enum(['In Person', 'Phone', 'Video Call']),
    instructions: z.string().optional(),
    duration_minutes: z.number().min(1, 'Duration must be at least 1 minute'),
    meet_link: z.string().url('Must be a valid URL').optional().or(z.literal('')),
    timezone: z.string().min(1, 'Timezone is required'),
}).refine((data) => {
    const now = new Date();

    return (
        data.start_date >= now &&
        data.end_date > data.start_date
    );
}, {
    message: 'Start date must be in the future and end date must be after start date',
    path: ['start_date'],
});


export const interviewFormSchema = z.object({
    rounds: z.array(roundSchema).optional(),
    reminders_enabled: z.boolean().default(false).optional(),
    voice_call_enabled: z.boolean().default(false).optional(),
    interview_assessment_enabled: z.boolean().default(false).optional(),
    what_to_evaluate: z.string().optional(),
});


export type PanelMember = z.infer<typeof panelMemberSchema>;
export type InterviewRound = z.infer<typeof roundSchema>;
export type InterviewFormTypes = z.infer<typeof interviewFormSchema>;