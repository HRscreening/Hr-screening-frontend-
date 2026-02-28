import { z } from 'zod';
// import type { ExtractedJD } from './types';


const panelMemberSchema = z.object({
    name: z.string().max(100).optional(),
    email: z.email('Invalid email address'),
    role: z.string().optional(),
});

const roundSchema = z.object({
    number: z.number().min(1, 'Round number must be at least 1'),
    name: z.string().max(100).optional(),
    panel: z.array(panelMemberSchema)
        .min(1, 'At least one panel member is required'),
    start_date: z.date(),
    end_date: z.date(),
    mode: z.enum(['In Person', 'Phone', 'Video Call']),
    meeting_link_rules: z.string().optional(),
}
).refine((data) => {
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