import { z } from 'zod';
import { Video, Phone, MapPin } from 'lucide-react';
import type { PanelMember } from '@/types/interviewTypes';

// ─── API Response Types ───────────────────────────────────────────────────────

export interface RoundOverview {
  round_config_id: string;
  round_number: number;
  title: string;
  start_date: string;
  is_slots_available: boolean;
  end_date: string;
  interview_type: string;
  panelists_count: number;
}

export interface RoundFullConfig {
  id: string;
  job_id: string;
  round_number: number;
  title: string;
  interview_type: 'Video Call' | 'Phone' | 'In Person';
  instructions: string | null;
  duration_minutes: number;
  panelists: PanelMember[];
  meet_link: string | null;
  start_date: string;
  end_date: string;
  slots_available: boolean;
  candidate_slot_booking_link: string | null;
  timezone: string | null;
  panel_mode: 'SEQUENTIAL' | 'PANEL';
  created_at: string;
  updated_at: string;
}

// ─── Zod Schema for Editing a Single Round ────────────────────────────────────

const panelMemberEditSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  role: z.string().min(1, 'Role is required'),
});

export const roundEditSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  interview_type: z.enum(['In Person', 'Phone', 'Video Call']),
  instructions: z.string().optional(),
  duration_minutes: z.number().min(1, 'Min 1 minute'),
  panelists: z.array(panelMemberEditSchema).min(1, 'At least one panelist'),
  meet_link: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  start_date: z.date(),
  end_date: z.date(),
  timezone: z.string().min(1, 'Required'),
  panel_mode: z.enum(['SEQUENTIAL', 'PANEL']),
});

export type RoundEditValues = z.infer<typeof roundEditSchema>;

// ─── Constants ────────────────────────────────────────────────────────────────

export const MODE_OPTIONS = [
  { value: 'Video Call', label: 'Video Call', icon: Video, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { value: 'Phone', label: 'Phone', icon: Phone, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { value: 'In Person', label: 'In Person', icon: MapPin, color: 'text-amber-500', bg: 'bg-amber-500/10' },
] as const;

export const TIMEZONE_OPTIONS = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Toronto',
  'America/Sao_Paulo',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Moscow',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Asia/Singapore',
  'Australia/Sydney',
  'Pacific/Auckland',
] as const;
