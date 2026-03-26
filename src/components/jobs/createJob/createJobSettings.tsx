import { useImperativeHandle, forwardRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Bell,
  Bot,
  BrainCircuit,
  ClipboardCheck,
  EyeOff,
  FileSearch,
  GitMerge,
  Mail,
  Mic,
  Plus,
  RefreshCw,
  Settings2,
  TriangleAlert,
  Upload,
  UserCheck,
  Users,
  X,
} from 'lucide-react';

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

import { CreateJobSettingsSchema } from '@/types/jobSettingsTypes';
import type { CreateJobSettingsType } from '@/types/jobSettingsTypes';

// ─── Option Tables ────────────────────────────────────────────────────────────

const FORM_REMINDER_OPTIONS = [
  { label: '6 hours after', value: 21600 },
  { label: '12 hours after', value: 43200 },
  { label: '24 hours after (1 day)', value: 86400 },
  { label: '48 hours after (2 days)', value: 172800 },
  { label: '72 hours after (3 days)', value: 259200 },
  { label: '5 days after', value: 432000 },
  { label: '7 days after', value: 1684800 },
];

const INTERVIEW_REMINDER_OPTIONS = [
  { label: '10 Minutes before', value: 600 },
  { label: '30 minutes before', value: 1800 },
  { label: '1 hours before', value: 3600 },
  { label: '2 hours before', value: 7200 },
  { label: '6 hours before', value: 21600 },
  { label: '12 hours before', value: 43200 },
  { label: '1 day before', value: 86400 },
  { label: '2 days before', value: 172800 },
  { label: '3 days before', value: 259200 },
  { label: '7 days before', value: 604800 },
];

const RESCHEDULE_MIN_HOURS_OPTIONS = [
  { label: '1 hour before', value: 3600 },
  { label: '2 hours before', value: 7200 },
  { label: '4 hours before', value: 14400 },
  { label: '6 hours before', value: 21600 },
  { label: '12 hours before', value: 43200 },
  { label: '24 hours before', value: 86400 },
  { label: '48 hours before', value: 172800 },
];

const NO_SHOW_ACTION_OPTIONS = [
  { label: 'Mark as No Show', value: 'mark_no_show' },
  { label: 'Cancel Interview', value: 'cancel_interview' },
  { label: 'Reject Candidate', value: 'reject_candidate' },
];

const AUTO_MOVE_OPTIONS = [
  { label: 'Panel + AI consensus', value: 'both_panel_and_ai' },
  { label: 'Panel only', value: 'panel_only' },
  { label: 'AI only', value: 'ai_only' },
  { label: 'Manual (HR decides)', value: 'hr_manual' },
];

const RESCORE_OPTIONS = [
  { label: 'Only new applications', value: 'only_new' },
  { label: 'All existing applications', value: 'all' },
];

const MAX_REMINDERS = 7;

// ─── Helpers / Sub-components ─────────────────────────────────────────────────

function SectionLabel({ icon: Icon, children }: { icon?: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      {Icon && <Icon className="h-3.5 w-3.5 text-primary/50" />}
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">{children}</p>
    </div>
  );
}

function FormSectionHeader({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10 text-primary shrink-0">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-base font-semibold leading-tight">{title}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
      </div>
      {action}
    </div>
  );
}

function SettingToggle({
  icon: Icon,
  title,
  description,
  checked,
  onCheckedChange,
  badge,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  badge?: string;
}) {
  return (
    <label
      className={cn(
        'flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer select-none transition-all duration-200',
        checked
          ? 'border-primary/30 bg-primary/4 shadow-sm shadow-primary/5'
          : 'border-border/40 hover:border-border/70 hover:bg-muted/20'
      )}
    >
      <div
        className={cn(
          'flex items-center justify-center w-9 h-9 rounded-xl shrink-0 transition-all duration-200',
          checked ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20' : 'bg-muted/80 text-muted-foreground'
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0 py-0.5">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium leading-snug">{title}</p>
          {badge && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-medium">
              {badge}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="mt-1.5 shrink-0"
        onClick={(e) => e.stopPropagation()}
      />
    </label>
  );
}

function ExpandPanel({ open, children }: { open: boolean; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="ml-0 pl-4 border-l-2 border-primary/20 space-y-3 pt-1">
      {children}
    </div>
  );
}

function Divider() {
  return <div className="h-px bg-border/40 w-full" />;
}

// ─── Reminders with unique-per-slot dropdowns ─────────────────────────────────

/**
 * Shows:
 *  1. A "How many reminders?" select (1–MAX_REMINDERS)
 *  2. N rows of dropdowns, each row constrained to options not chosen by sibling rows
 */
function UniqueReminderRows({
  options,
  label,
  count,
  values,
  onChange,
}: {
  options: { label: string; value: number }[];
  label: string;
  count: number;
  values: number[];       // length == count; 0 means unset
  onChange: (vals: number[]) => void;
}) {
  const rows = Array.from({ length: count }, (_, i) => values[i] ?? 0);

  const handleChange = (idx: number, val: number) => {
    const next = [...rows];
    next[idx] = val;
    onChange(next);
  };

  return (
    <div className="space-y-2">
      {rows.map((val, idx) => {
        const chosen = new Set(rows.filter((v, i) => i !== idx && v !== 0));
        const available = options.filter((o) => !chosen.has(o.value));
        return (
          <div key={idx} className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-16 shrink-0">
              {label} #{idx + 1}
            </span>
            <Select
              value={val ? String(val) : ''}
              onValueChange={(v) => handleChange(idx, Number(v))}
            >
              <SelectTrigger className="h-8 text-xs bg-transparent flex-1">
                <SelectValue placeholder="Pick timing…" />
              </SelectTrigger>
              <SelectContent>
                {available.map((o) => (
                  <SelectItem key={o.value} value={String(o.value)} className="text-xs">
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      })}
    </div>
  );
}

// ─── Reminder Block ───────────────────────────────────────────────────────────

function ReminderBlock({
  label,
  description,
  icon: Icon,
  enabledPath,
  form,
  showFormReminder = true,
  showInterviewReminder = true,
}: {
  label: string;
  description: string;
  icon: React.ElementType;
  enabledPath: 'panel_reminders' | 'candidate_reminders' | 'feedback_reminders';
  form: any;
  showFormReminder?: boolean;
  showInterviewReminder?: boolean;
}) {
  const enabled = form.watch(`${enabledPath}.enabled` as any);
  const formCount: number = form.watch(`${enabledPath}.form_reminder_count` as any) ?? 1;
  const interviewCount: number = form.watch(`${enabledPath}.interview_reminder_count` as any) ?? 1;

  const formHours: number[] = form.watch(`${enabledPath}.form_reminder_sec`) ?? [];
  const interviewHours: number[] = form.watch(`${enabledPath}.interview_reminder_sec`) ?? [];

  const handleFormHoursChange = (vals: number[]) => {
    form.setValue(`${enabledPath}.form_reminder_sec`, vals);
  };

  const handleInterviewHoursChange = (vals: number[]) => {
    form.setValue(`${enabledPath}.interview_reminder_sec`, vals);
  };

  return (
    <div className="space-y-3">
      <FormField
        control={form.control}
        name={`${enabledPath}.enabled` as any}
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <SettingToggle
                icon={Icon}
                title={label}
                description={description}
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
          </FormItem>
        )}
      />

      <ExpandPanel open={enabled}>
        <div className="space-y-4">
          {showFormReminder && (
            <div className="rounded-lg border border-border/30 bg-muted/5 p-3 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-medium text-muted-foreground">Form reminders</p>
                <FormField
                  control={form.control}
                  name={`${enabledPath}.form_reminder_count` as any}
                  render={({ field }) => (
                    <FormItem className="m-0 space-y-0">
                      <Select
                        onValueChange={(v) => { field.onChange(Number(v)); handleFormHoursChange([]); }}
                        value={field.value ? String(field.value) : '1'}
                      >
                        <FormControl>
                          <SelectTrigger className="h-7 text-xs w-32 bg-transparent">
                            <SelectValue placeholder="How many?" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Array.from({ length: MAX_REMINDERS }, (_, i) => (
                            <SelectItem key={i + 1} value={String(i + 1)} className="text-xs">
                              {i + 1} reminder{i > 0 ? 's' : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>
              <UniqueReminderRows
                options={FORM_REMINDER_OPTIONS}
                label="Send"
                count={formCount}
                values={formHours}
                onChange={handleFormHoursChange}
              />
            </div>
          )}

          {showInterviewReminder && (
            <div className="rounded-lg border border-border/30 bg-muted/5 p-3 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-medium text-muted-foreground">Interview reminders</p>
                <FormField
                  control={form.control}
                  name={`${enabledPath}.interview_reminder_count` as any}
                  render={({ field }) => (
                    <FormItem className="m-0 space-y-0">
                      <Select
                        onValueChange={(v) => { field.onChange(Number(v)); handleInterviewHoursChange([]); }}
                        value={field.value ? String(field.value) : '1'}
                      >
                        <FormControl>
                          <SelectTrigger className="h-7 text-xs w-32 bg-transparent">
                            <SelectValue placeholder="How many?" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Array.from({ length: MAX_REMINDERS }, (_, i) => (
                            <SelectItem key={i + 1} value={String(i + 1)} className="text-xs">
                              {i + 1} reminder{i > 0 ? 's' : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>
              <UniqueReminderRows
                options={INTERVIEW_REMINDER_OPTIONS}
                label="Send"
                count={interviewCount}
                values={interviewHours}
                onChange={handleInterviewHoursChange}
              />
            </div>
          )}
        </div>
      </ExpandPanel>
    </div>
  );
}

// ─── Email Tag Input (with visible validation error) ─────────────────────────

function EmailTagInput({
  value,
  onChange,
  error,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  error?: string;
}) {
  const [input, setInput] = useState('');
  const [localError, setLocalError] = useState('');

  const add = () => {
    const email = input.trim();
    if (!email) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setLocalError('Please enter a valid email address');
      return;
    }
    if (value.includes(email)) {
      setLocalError('This email has already been added');
      return;
    }
    setLocalError('');
    onChange([...value, email]);
    setInput('');
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="flex-1 space-y-1">
          <Input
            value={input}
            onChange={(e) => { setInput(e.target.value); if (localError) setLocalError(''); }}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
            placeholder="panelist@company.com"
            className={cn('h-9 text-sm bg-transparent', (localError || error) && 'border-destructive focus-visible:ring-destructive')}
          />
          {(localError || error) && (
            <p className="text-xs text-destructive">{localError || error}</p>
          )}
        </div>
        <Button type="button" variant="outline" size="sm" onClick={add} className="h-9 px-3 shrink-0">
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((email) => (
            <Badge key={email} variant="secondary" className="gap-1.5 text-xs pr-1 font-normal">
              <Mail className="h-3 w-3 text-primary/50" />
              {email}
              <button
                type="button"
                onClick={() => onChange(value.filter((e) => e !== email))}
                className="ml-0.5 rounded-full hover:text-destructive transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface JobSettingsFormProps {
  defaultValues?: Partial<CreateJobSettingsType>;
  onUpdate: (data: CreateJobSettingsType) => void;
}

const JobSettingsForm = forwardRef(function JobSettingsForm(
  { defaultValues, onUpdate }: JobSettingsFormProps,
  ref
) {
  const form = useForm<CreateJobSettingsType>({
    resolver: zodResolver(CreateJobSettingsSchema) as any,
    defaultValues: {
      voice_ai_enabled: false,
      is_confidential: false,
      auto_score_every_resume: false,
      auto_score_every_resume_on_manual_upload: false,
      auto_offer_enabled: false,
      ai_assessment_enabled: false,
      rescore_on_rubric_change: 'only_new',
      auto_move_to_next_round: 'panel_only',
      panel_reminders: { enabled: true, form_reminder_count: 1, form_reminder_sec: [86400], interview_reminder_count: 1, interview_reminder_sec: [86400] },
      candidate_reminders: { enabled: true, form_reminder_count: 1, form_reminder_sec: [86400], interview_reminder_count: 1, interview_reminder_sec: [86400] },
      feedback_reminders: { enabled: true, form_reminder_count: 1, form_reminder_sec: [86400], interview_reminder_count: 1, interview_reminder_sec: [86400] },
      escalation: { enabled: true, escalation_recipients: [] },
      rescheduling: {
        enabled: true,
        panelist_rescheduling_allowed: true,
        candidate_rescheduling_allowed: true,
        reschedule_window_for_panelist: 86400,
        reschedule_window_for_candidate: 86400,
        no_show_action: 'reject_candidate',
        no_show_grace_minutes: 15,
        same_panel_on_reschedule: true,
        max_reschedule_allowed_by_panelist: 1,
        max_reschedule_allowed_by_candidate: 1,
      },
      ...defaultValues,
    },
  });

  const escalationEnabled = form.watch('escalation.enabled');
  const reschedulingEnabled = form.watch('rescheduling.enabled');
  const panelistRescheduling = form.watch('rescheduling.panelist_rescheduling_allowed');
  const candidateRescheduling = form.watch('rescheduling.candidate_rescheduling_allowed');

  const onSubmit = (values: CreateJobSettingsType) => onUpdate(values);

  useImperativeHandle(ref, () => ({ submit: form.handleSubmit(onSubmit) }));

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6 space-y-8">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

          {/* ── General Settings ─────────────────────────────────────────── */}
          <div className="space-y-4">
            <FormSectionHeader
              icon={Settings2}
              title="General Settings"
              description="Core configuration for this job"
            />

            <div className="space-y-2">
              <FormField
                control={form.control}
                name="voice_ai_enabled"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <SettingToggle
                        icon={Mic}
                        title="Voice AI Interviews"
                        description="Enable AI-powered voice interviews for initial candidate screening"
                        badge="AI"
                        checked={field.value ?? false}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_confidential"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <SettingToggle
                        icon={EyeOff}
                        title="Confidential Job"
                        description="Hide job details and company name from candidates until selected"
                        checked={field.value ?? false}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>

          <Divider />

          {/* ── AI & Scoring ─────────────────────────────────────────────── */}
          <div className="space-y-4">
            <FormSectionHeader
              icon={BrainCircuit}
              title="AI & Scoring"
              description="Automate resume scoring, assessments, and hiring decisions"
            />

            <div className="space-y-2">
              <FormField
                control={form.control}
                name="auto_score_every_resume"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <SettingToggle
                        icon={FileSearch}
                        title="Auto-score Every Resume"
                        description="Auto-score every new resume on auto-upload"
                        badge="AI"
                        checked={field.value ?? false}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

                <FormField
                  control={form.control}
                  name="auto_score_every_resume_on_manual_upload"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <SettingToggle
                          icon={Upload}
                          title="Auto score manual uploads"
                          description="Apply auto-scoring to resumes uploaded manually by the HR team"
                          checked={field.value ?? false}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

            </div>
            </div>

          <Divider />

            <div className="space-y-4">
            <FormSectionHeader
              icon={BrainCircuit}
              title="Automation & Workflow"
              description="Automate resume scoring, assessments, and hiring decisions"
            />

            <div className="rounded-xl border border-border/40 bg-muted/10 p-4 space-y-3">
              <SectionLabel icon={Bot}>Pipeline Automation</SectionLabel>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="rescore_on_rubric_change"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        <RefreshCw className="h-3 w-3" />
                        Re-score on rubric change
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {RESCORE_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription className="text-xs text-muted-foreground">
                        Who gets re-scored when the rubric is updated
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="auto_move_to_next_round"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        <GitMerge className="h-3 w-3" />
                        Auto-move to next round
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {AUTO_MOVE_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription className="text-xs text-muted-foreground">
                        Who authorises moving a candidate to the next stage
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>

          <Divider />

          {/* ── Reminders ────────────────────────────────────────────────── */}
          <div className="space-y-4">
            <FormSectionHeader
              icon={Bell}
              title="Reminders"
              description="Automated notifications for panel, candidates, and feedback collection"
            />

            <div className="space-y-3">
              <div className="rounded-xl border border-border/50 bg-card p-4 space-y-3">
                <SectionLabel icon={Users}>Panel Reminders</SectionLabel>
                <ReminderBlock
                  label="Panel Member Reminders"
                  description="Notify interviewers about upcoming sessions and pending forms"
                  icon={Bell}
                  enabledPath="panel_reminders"
                  form={form}
                />
              </div>

              <div className="rounded-xl border border-border/50 bg-card p-4 space-y-3">
                <SectionLabel icon={UserCheck}>Candidate Reminders</SectionLabel>
                <ReminderBlock
                  label="Candidate Reminders"
                  description="Notify candidates about their upcoming interviews and pending actions"
                  icon={Bell}
                  enabledPath="candidate_reminders"
                  form={form}
                />
              </div>

              <div className="rounded-xl border border-border/50 bg-card p-4 space-y-3">
                <SectionLabel icon={ClipboardCheck}>Feedback Reminders</SectionLabel>
                <ReminderBlock
                  label="Feedback Submission Reminders"
                  description="Remind panelists to submit their structured feedback after interviews"
                  icon={Bell}
                  enabledPath="feedback_reminders"
                  form={form}
                  showInterviewReminder={false}
                />
              </div>
            </div>
          </div>

          <Divider />

          {/* ── Panel Escalation ─────────────────────────────────────────── */}
          <div className="space-y-4">
            <FormSectionHeader
              icon={TriangleAlert}
              title="Panel Escalation"
              description="Auto-escalate when panelists don't respond in time"
            />

            <FormField
              control={form.control}
              name="escalation.enabled"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <SettingToggle
                      icon={TriangleAlert}
                      title="Enable Panel Escalation"
                      description="Automatically notify escalation contacts if a panelist misses their deadline"
                      checked={field.value ?? false}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <ExpandPanel open={escalationEnabled}>
              <div className="space-y-4 pt-2">
                <FormField
                  control={form.control}
                  name="escalation.escalation_recipients"
                  render={({ field, fieldState }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-xs font-medium text-muted-foreground">
                        Escalation recipients
                      </FormLabel>
                      <FormControl>
                        <EmailTagInput
                          value={field.value ?? []}
                          onChange={field.onChange}
                          error={fieldState.error?.message}
                        />
                      </FormControl>
                      <FormDescription className="text-xs text-muted-foreground">
                        Press Enter or click + to add an email address
                      </FormDescription>
                    </FormItem>
                  )}
                />
              </div>
            </ExpandPanel>
          </div>

  <Divider />

{/* ── Rescheduling ─────────────────────────────────────────────── */ }
          <div className="space-y-4">
            <FormSectionHeader
              icon={RefreshCw}
              title="Rescheduling"
              description="Control how and when interviews can be rescheduled"
            />

            <FormField
              control={form.control}
              name="rescheduling.enabled"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <SettingToggle
                      icon={RefreshCw}
                      title="Enable Rescheduling"
                      description="Allow panelists and/or candidates to reschedule confirmed interviews"
                      checked={field.value ?? false}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <ExpandPanel open={reschedulingEnabled}>
              <div className="rounded-xl border border-border/40 bg-muted/10 p-4 space-y-3">
                <SectionLabel>Who Can Reschedule</SectionLabel>
                <div className="space-y-2">
                  <FormField
                    control={form.control}
                    name="rescheduling.panelist_rescheduling_allowed"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <SettingToggle
                            icon={Users}
                            title="Panelists can reschedule"
                            description="Allow panel members to request interview time changes"
                            checked={field.value ?? false}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="rescheduling.candidate_rescheduling_allowed"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <SettingToggle
                            icon={UserCheck}
                            title="Candidates can reschedule"
                            description="Allow candidates to request a different interview slot"
                            checked={field.value ?? false}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="rounded-xl border border-border/40 bg-muted/10 p-4 space-y-4">
                <SectionLabel>Limits & Rules</SectionLabel>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="rescheduling.reschedule_window_for_panelist"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="text-xs font-medium text-muted-foreground">
                          Latest reschedule window for panelists
                        </FormLabel>
                        <Select
                          onValueChange={(v) => field.onChange(Number(v))}
                          value={field.value ? String(field.value) : undefined}
                        >
                          <FormControl>
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder="Select window" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {RESCHEDULE_MIN_HOURS_OPTIONS.map((o) => (
                              <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription className="text-xs text-muted-foreground">
                          Minimum notice required to reschedule
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="rescheduling.reschedule_window_for_candidate"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="text-xs font-medium text-muted-foreground">
                          Latest reschedule window for candidates
                        </FormLabel>
                        <Select
                          onValueChange={(v) => field.onChange(Number(v))}
                          value={field.value ? String(field.value) : undefined}
                        >
                          <FormControl>
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder="Select window" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {RESCHEDULE_MIN_HOURS_OPTIONS.map((o) => (
                              <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription className="text-xs text-muted-foreground">
                          Minimum notice required to reschedule
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="rescheduling.no_show_action"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                          <TriangleAlert className="h-3 w-3" />
                          No-show action
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {NO_SHOW_ACTION_OPTIONS.map((o) => (
                              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="rescheduling.no_show_grace_minutes"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="text-xs font-medium text-muted-foreground">
                          No-show grace period (minutes)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            placeholder="15"
                            className="h-9 bg-transparent"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 0)}
                          />
                        </FormControl>
                        <FormDescription className="text-xs text-muted-foreground">
                          Wait time before triggering no-show action
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {panelistRescheduling && (
                    <FormField
                      control={form.control}
                      name="rescheduling.max_reschedule_allowed_by_panelist"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="text-xs font-medium text-muted-foreground">
                            Max panelist reschedules
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              placeholder="2"
                              className="h-9 bg-transparent"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {candidateRescheduling && (
                    <FormField
                      control={form.control}
                      name="rescheduling.max_reschedule_allowed_by_candidate"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="text-xs font-medium text-muted-foreground">
                            Max candidate reschedules
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              placeholder="1"
                              className="h-9 bg-transparent"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                <FormField
                  control={form.control}
                  name="rescheduling.same_panel_on_reschedule"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <SettingToggle
                          icon={Users}
                          title="Keep same panel on reschedule"
                          description="Ensure the same interviewers are assigned when an interview is rescheduled"
                          checked={field.value ?? false}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </ExpandPanel>
          </div>



  {/* FEEDBACK */}
         <div className="space-y-4">
            <FormSectionHeader
              icon={BrainCircuit}
              title="Feedback & Offers"
              description="Automate assessments, feedback collection, and offer generation"
            />

            <div className="space-y-2">

              <FormField
                control={form.control}
                name="ai_assessment_enabled"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <SettingToggle
                        icon={ClipboardCheck}
                        title="AI Assessment"
                        description="Collect and analyse structured interview feedback using AI"
                        badge="AI"
                        checked={field.value ?? false}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="auto_offer_enabled"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <SettingToggle
                        icon={UserCheck}
                        title="Auto Offer"
                        description="Automatically generate and send offer letters when a candidate clears all rounds"
                        checked={field.value ?? false}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            </div>

          <button type="submit" className="hidden" id="job-settings-form-submit" />
        </form >
      </Form >
    </div >
  );
});

export default JobSettingsForm;