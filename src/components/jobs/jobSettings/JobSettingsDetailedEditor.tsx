import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import axios from "@/axiosConfig";
import {
  Bell,
  Clock,
  ShieldAlert,
  Settings,
  Edit2,
  Save,
  X,
  Mic,
  EyeOff,
  UserCheck,
  FileSearch,
  ClipboardCheck,
  RefreshCw,
  GitMerge,
  Mail,
  Plus,
} from "lucide-react";

import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import type {
  SettingsType,
  ReminderSettingsType,
  PanelEscalationSettingsType,
  ReschedulingSettingsType,
} from "@/types/jobSettingsTypes";

import {
  ReminderSettingsSchema,
  PanelEscalationSettingsSchema,
  ReschedulingSettingsSchema,
} from "@/types/jobSettingsTypes";

// Constants from original component
const FORM_REMINDER_OPTIONS = [
  { label: '6 hours after', value: 6 * 3600 },
  { label: '12 hours after', value: 12 * 3600 },
  { label: '24 hours after (1 day)', value: 24 * 3600 },
  { label: '48 hours after (2 days)', value: 48 * 3600 },
  { label: '72 hours after (3 days)', value: 72 * 3600 },
  { label: '5 days after', value: 120 * 3600 },
  { label: '7 days after', value: 168 * 3600 },
];

const INTERVIEW_REMINDER_OPTIONS = [
  { label: '10 Minutes before', value: 600 },
  { label: '30 minutes before', value: 1800 },
  { label: '1 hour before', value: 3600 },
  { label: '2 hours before', value: 2 * 3600 },
  { label: '4 hours before', value: 4 * 3600 },
  { label: '6 hours before', value: 6 * 3600 },
  { label: '12 hours before', value: 12 * 3600 },
  { label: '1 day before', value: 24 * 3600 },
  { label: '2 days before', value: 48 * 3600 },
  { label: '3 days before', value: 72 * 3600 },
  { label: '5 days before', value: 120 * 3600 },
  { label: '7 days before', value: 168 * 3600 },
];

const RESCHEDULE_MIN_HOURS_OPTIONS = [
  { label: '1 hour before', value: 1 * 3600 },
  { label: '2 hours before', value: 2 * 3600 },
  { label: '4 hours before', value: 4 * 3600 },
  { label: '6 hours before', value: 6 * 3600 },
  { label: '12 hours before', value: 12 * 3600 },
  { label: '24 hours before', value: 24 * 3600 },
  { label: '48 hours before', value: 48 * 3600 },
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

// --- Helper Components ---

function SectionHeader({
  title,
  description,
  icon: Icon,
  isEditing,
  onEdit,
  onCancel,
  onSave,
  saving,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  saving?: boolean;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="text-[11px] text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {!isEditing ? (
          <Button type="button" variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={onEdit}>
            <Edit2 className="w-3 h-3" />
            Edit
          </Button>
        ) : (
          <>
            <Button type="button" variant="ghost" size="sm" className="h-8 text-xs gap-1.5" onClick={onCancel} disabled={saving}>
              <X className="w-3 h-3" />
              Cancel
            </Button>
            <Button type="button" size="sm" className="h-8 text-xs gap-1.5" onClick={onSave} disabled={saving}>
              <Save className="w-3 h-3" />
              {saving ? "Saving..." : "Save"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function ViewField({ label, value, icon: Icon }: { label: string; value: string | React.ReactNode; icon?: React.ElementType }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
        {Icon && <Icon className="w-3 h-3" />} {label}
      </p>
      <div className="text-sm font-medium">{value || "—"}</div>
    </div>
  );
}

function ReminderSummary({ reminders }: { reminders: ReminderSettingsType }) {
  if (!reminders.enabled) return <Badge variant="secondary" className="text-[10px]">Disabled</Badge>;

  const formatSec = (s: number) => {
      if (s < 3600) return `${Math.round(s / 60)}m`;
      const h = s / 3600;
      return h % 1 === 0 ? `${h}h` : `${h.toFixed(1)}h`;
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className="text-[10px] bg-primary/5">
          {reminders.form_reminder_sec.length} Form Reminders
        </Badge>
        <Badge variant="outline" className="text-[10px] bg-primary/5">
          {reminders.interview_reminder_sec.length} Interview Reminders
        </Badge>
      </div>
      {(reminders.form_reminder_sec.length > 0 || reminders.interview_reminder_sec.length > 0) && (
          <div className="text-[11px] text-muted-foreground space-y-1">
              {reminders.form_reminder_sec.length > 0 && (
                  <p>Form: {reminders.form_reminder_sec.map(formatSec).join(', ')} after</p>
              )}
              {reminders.interview_reminder_sec.length > 0 && (
                  <p>Interview: {reminders.interview_reminder_sec.map(formatSec).join(', ')} before</p>
              )}
          </div>
      )}
    </div>
  );
}

function EscalationSummary({ escalation }: { escalation: PanelEscalationSettingsType }) {
    if (!escalation.enabled) return <Badge variant="secondary" className="text-[10px]">Disabled</Badge>;
    return (
        <div className="space-y-2">
            <ViewField 
                label="Recipients" 
                value={
                    <div className="flex flex-wrap gap-1 mt-1">
                        {escalation.escalation_recipients.map(email => (
                            <Badge key={email} variant="secondary" className="text-[10px]">{email}</Badge>
                        ))}
                        {escalation.escalation_recipients.length === 0 && "No recipients configured"}
                    </div>
                } 
            />
        </div>
    )
}

function ReschedulingSummary({ rescheduling }: { rescheduling: ReschedulingSettingsType }) {
    if (!rescheduling.enabled) return <Badge variant="secondary" className="text-[10px]">Disabled</Badge>;
    const formatSec = (s: number) => {
        if (s < 3600) return `${Math.round(s/60)}m`;
        const h = s/3600;
        return h % 1 === 0 ? `${h}h` : `${h.toFixed(1)}h`;
    };
    return (
        <div className="grid grid-cols-2 gap-4">
            <ViewField label="Panelist Allowed" value={rescheduling.panelist_rescheduling_allowed ? "Yes" : "No"} />
            <ViewField label="Candidate Allowed" value={rescheduling.candidate_rescheduling_allowed ? "Yes" : "No"} />
            <ViewField label="Panelist Reschedule Window" value={`${formatSec(rescheduling.reschedule_window_for_panelist)} before`} />
            <ViewField label="Candidate Reschedule Window" value={`${formatSec(rescheduling.reschedule_window_for_candidate)} before`} />
            <ViewField label="Max Reschedules" value={`Panel: ${rescheduling.max_reschedule_allowed_by_panelist}, Cand: ${rescheduling.max_reschedule_allowed_by_candidate}`} />
            <ViewField label="No-Show Action" value={rescheduling.no_show_action.replace(/_/g, ' ')} />
        </div>
    )
}

// Reuse UniqueReminderRows from original component
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
  values: number[];
  onChange: (vals: number[]) => void;
}) {
  const rows = Array.from({ length: count }, (_, i) => values[i] ?? 0);

  const handleChange = (idx: number, val: number) => {
    const next = [...rows];
    next[idx] = val;
    onChange(next);
  };

  return (
    <div className="space-y-2 mt-2">
      {rows.map((val, idx) => {
        const chosen = new Set(rows.filter((v, i) => i !== idx && v !== 0));
        const available = options.filter((o) => !chosen.has(o.value));
        return (
          <div key={idx} className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground w-16 shrink-0">
              {label} #{idx + 1}
            </span>
            <Select
              value={val ? String(val) : ''}
              onValueChange={(v) => handleChange(idx, Number(v))}
            >
              <SelectTrigger className="h-8 text-[11px] bg-transparent flex-1">
                <SelectValue placeholder="Pick timing…" />
              </SelectTrigger>
              <SelectContent>
                {available.map((o) => (
                  <SelectItem key={o.value} value={String(o.value)} className="text-[11px]">
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

function EmailTagInput({
    value,
    onChange,
    error,
  }: {
    value: string[];
    onChange: (v: string[]) => void;
    error?: string;
  }) {
    const [input, setInput] = React.useState('');
    const [localError, setLocalError] = React.useState('');
  
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
              <p className="text-[10px] text-destructive">{localError || error}</p>
            )}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={add} className="h-9 px-3 shrink-0">
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
        {value.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {value.map((email) => (
              <Badge key={email} variant="secondary" className="gap-1.5 text-[10px] pr-1 font-normal">
                <Mail className="h-2.5 w-2.5 text-primary/50" />
                {email}
                <button
                  type="button"
                  onClick={() => onChange(value.filter((e) => e !== email))}
                  className="ml-0.5 rounded-full hover:text-destructive transition-colors"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>
    );
  }

// --- Main Components ---

interface JobSettingsDetailedEditorProps {
  jobId: string;
  settings: SettingsType;
  onRefresh: () => void;
}

const JobSettingsDetailedEditor: React.FC<JobSettingsDetailedEditorProps> = ({
  jobId,
  settings,
  onRefresh,
}) => {
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Forms for each section
  const panelRemindersForm = useForm<ReminderSettingsType>({
    resolver: zodResolver(ReminderSettingsSchema) as any,
    defaultValues: settings.panel_reminders,
  });

  const candidateRemindersForm = useForm<ReminderSettingsType>({
    resolver: zodResolver(ReminderSettingsSchema) as any,
    defaultValues: settings.candidate_reminders,
  });

  const feedbackRemindersForm = useForm<ReminderSettingsType>({
    resolver: zodResolver(ReminderSettingsSchema) as any,
    defaultValues: settings.feedback_reminders,
  });

  const escalationForm = useForm<PanelEscalationSettingsType>({
    resolver: zodResolver(PanelEscalationSettingsSchema) as any,
    defaultValues: settings.escalation,
  });

  const reschedulingForm = useForm<ReschedulingSettingsType>({
    resolver: zodResolver(ReschedulingSettingsSchema) as any,
    defaultValues: settings.rescheduling,
  });

  // For general, we use a custom partial schema including the remaining keys
  const generalForm = useForm({
    defaultValues: {
      voice_ai_enabled: settings.voice_ai_enabled,
      // manual_rounds_count: settings.manual_rounds_count,
      is_confidential: settings.is_confidential,
      auto_score_every_resume: settings.auto_score_every_resume,
      auto_score_every_resume_on_manual_upload: settings.auto_score_every_resume_on_manual_upload,
      auto_offer_enabled: settings.auto_offer_enabled,
      ai_assessment_enabled: settings.ai_assessment_enabled,
      rescore_on_rubric_change: settings.rescore_on_rubric_change,
      auto_move_to_next_round: settings.auto_move_to_next_round,
    },
  });

  const handleSave = async (section: string, data: any) => {
    try {
      setSaving(true);
      const payload = { [section]: data };
      // Special case for General section where we flatten the keys but user said "only that portion"
      // If it's the general section, we just send those specific keys.
      // const finalPayload = section === 'general' ? {} : payload;
      const finalPayload = payload;
      console.log("final_payload",finalPayload)
      await axios.patch(`/jobs/${jobId}/edit-settings`, finalPayload);
      toast.success(`${section.replace(/_/g, ' ')} saved successfully`);
      setEditingSection(null);
      onRefresh();
    } catch (err) {
      console.error("Failed to save section", err);
      toast.error(`Failed to save ${section.replace(/_/g, ' ')}`);
    } finally {
      setSaving(false);
    }
  };

  const renderReminderForm = (form: any) => {
      const enabled = form.watch('enabled');
      const formCount = form.watch('form_reminder_count');
      const interviewCount = form.watch('interview_reminder_count');
      const formSec = form.watch('form_reminder_sec') || [];
      const interviewSec = form.watch('interview_reminder_sec') || [];

      return (
          <Form {...form}>
              <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="enabled"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between p-3 rounded-lg border bg-muted/5">
                        <div className="space-y-0.5">
                            <FormLabel className="text-sm font-medium">Enable Reminders</FormLabel>
                            <FormDescription className="text-xs">Turn on/off reminders for this group</FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {enabled && (
                      <div className="space-y-4 pl-4 border-l-2 border-primary/20">
                          <div className="space-y-3">
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-[11px] font-medium text-muted-foreground">Form Reminders</p>
                                <FormField
                                  control={form.control}
                                  name="form_reminder_count"
                                  render={({ field }) => (
                                    <FormItem className="m-0 space-y-0">
                                      <Select
                                        onValueChange={(v) => { field.onChange(Number(v)); form.setValue('form_reminder_sec', []); }}
                                        value={String(field.value)}
                                      >
                                        <FormControl>
                                          <SelectTrigger className="h-7 text-[11px] w-24 bg-transparent border-primary/20">
                                            <SelectValue />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          {Array.from({ length: MAX_REMINDERS }, (_, i) => (
                                            <SelectItem key={i + 1} value={String(i + 1)} className="text-[11px]">
                                              {i + 1}
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
                                values={formSec}
                                onChange={(vals) => form.setValue('form_reminder_sec', vals)}
                              />
                          </div>

                          <div className="space-y-3">
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-[11px] font-medium text-muted-foreground">Interview Reminders</p>
                                <FormField
                                  control={form.control}
                                  name="interview_reminder_count"
                                  render={({ field }) => (
                                    <FormItem className="m-0 space-y-0">
                                      <Select
                                        onValueChange={(v) => { field.onChange(Number(v)); form.setValue('interview_reminder_sec', []); }}
                                        value={String(field.value)}
                                      >
                                        <FormControl>
                                          <SelectTrigger className="h-7 text-[11px] w-24 bg-transparent border-primary/20">
                                            <SelectValue />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          {Array.from({ length: MAX_REMINDERS }, (_, i) => (
                                            <SelectItem key={i + 1} value={String(i + 1)} className="text-[11px]">
                                              {i + 1}
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
                                values={interviewSec}
                                onChange={(vals) => form.setValue('interview_reminder_sec', vals)}
                              />
                          </div>
                      </div>
                  )}
              </div>
          </Form>
      )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-min">


            {/* 6. General */}
      <Card className="border-border/40 overflow-hidden">
        <CardContent className="p-5">
          <SectionHeader
            title="General"
            description="Pipeline automation and core behavior"
            icon={Settings}
            isEditing={editingSection === "general"}
            onEdit={() => setEditingSection("general")}
            onCancel={() => { setEditingSection(null); generalForm.reset(); }}
            onSave={generalForm.handleSubmit((data) => handleSave("general", data))}
            saving={saving}
          />
          {editingSection === "general" ? (
             <Form {...generalForm}>
                 <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <FormField
                            control={generalForm.control}
                            name="voice_ai_enabled"
                            render={({ field }) => (
                                <FormItem className="flex items-center justify-between p-3 rounded-lg border bg-muted/5">
                                    <div className="flex items-center gap-2">
                                        <Mic className="w-3.5 h-3.5 text-primary" />
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-xs font-medium">Voice AI</FormLabel>
                                            <p className="text-[10px] text-muted-foreground font-normal">AI voice screening</p>
                                        </div>
                                    </div>
                                    <FormControl>
                                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={generalForm.control}
                            name="is_confidential"
                            render={({ field }) => (
                                <FormItem className="flex items-center justify-between p-3 rounded-lg border bg-muted/5">
                                    <div className="flex items-center gap-2">
                                        <EyeOff className="w-3.5 h-3.5 text-primary" />
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-xs font-medium">Confidential</FormLabel>
                                            <p className="text-[10px] text-muted-foreground font-normal">Hide job details</p>
                                        </div>
                                    </div>
                                    <FormControl>
                                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <FormField
                            control={generalForm.control}
                            name="auto_score_every_resume"
                            render={({ field }) => (
                                <FormItem className="flex items-center justify-between p-3 rounded-lg border bg-muted/5">
                                    <div className="flex items-center gap-2">
                                        <FileSearch className="w-3.5 h-3.5 text-primary" />
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-xs font-medium">Auto-score</FormLabel>
                                            <p className="text-[10px] text-muted-foreground font-normal">Score resumes auto</p>
                                        </div>
                                    </div>
                                    <FormControl>
                                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={generalForm.control}
                            name="ai_assessment_enabled"
                            render={({ field }) => (
                                <FormItem className="flex items-center justify-between p-3 rounded-lg border bg-muted/5">
                                    <div className="flex items-center gap-2">
                                        <ClipboardCheck className="w-3.5 h-3.5 text-primary" />
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-xs font-medium">AI Assessment</FormLabel>
                                            <p className="text-[10px] text-muted-foreground font-normal">Collect AI feedback</p>
                                        </div>
                                    </div>
                                    <FormControl>
                                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <FormField
                            control={generalForm.control}
                            name="rescore_on_rubric_change"
                            render={({ field }) => (
                                <FormItem className="space-y-1">
                                    <FormLabel className="text-[10px] font-medium text-muted-foreground uppercase flex items-center gap-1.5"><RefreshCw className="w-3 h-3" /> Re-score Rule</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="h-9 text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {RESCORE_OPTIONS.map(opt => (
                                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={generalForm.control}
                            name="auto_move_to_next_round"
                            render={({ field }) => (
                                <FormItem className="space-y-1">
                                    <FormLabel className="text-[10px] font-medium text-muted-foreground uppercase flex items-center gap-1.5"><GitMerge className="w-3 h-3" /> Auto-move Rule</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="h-9 text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {AUTO_MOVE_OPTIONS.map(opt => (
                                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                            )}
                        />
                    </div>

                    {/* <FormField
                        control={generalForm.control}
                        name="manual_rounds_count"
                        render={({ field }) => (
                            <FormItem className="space-y-1 pt-2">
                                <FormLabel className="text-[10px] font-medium text-muted-foreground uppercase flex items-center gap-1.5"><Layers className="w-3 h-3" /> Manual Rounds</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} className="h-9 text-xs" />
                                </FormControl>
                            </FormItem>
                        )}
                    /> */}
                 </div>
             </Form>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <ViewField label="Voice AI" value={settings.voice_ai_enabled ? "Enabled" : "Disabled"} icon={Mic} />
                <ViewField label="Confidential" value={settings.is_confidential ? "Yes" : "No"} icon={EyeOff} />
                <ViewField label="Auto-score" value={settings.auto_score_every_resume ? "Enabled" : "Disabled"} icon={FileSearch} />
                <ViewField label="AI Assessment" value={settings.ai_assessment_enabled ? "Enabled" : "Disabled"} icon={ClipboardCheck} />
                {/* <ViewField label="Manual Rounds" value={settings.manual_rounds_count} icon={Layers} /> */}
                <ViewField label="Re-score" value={settings.rescore_on_rubric_change.replace(/_/g, ' ')} icon={RefreshCw} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* 1. Panel Reminders */}
      <Card className="border-border/40 overflow-hidden">
        <CardContent className="p-5">
          <SectionHeader
            title="Panel Reminders"
            description="Manage notifications for your interviewers"
            icon={Bell}
            isEditing={editingSection === "panel_reminders"}
            onEdit={() => setEditingSection("panel_reminders")}
            onCancel={() => { setEditingSection(null); panelRemindersForm.reset(settings.panel_reminders); }}
            onSave={panelRemindersForm.handleSubmit((data) => handleSave("panel_reminders", data))}
            saving={saving}
          />
          {editingSection === "panel_reminders" ? (
            renderReminderForm(panelRemindersForm)
          ) : (
            <ReminderSummary reminders={settings.panel_reminders} />
          )}
        </CardContent>
      </Card>

      {/* 2. Candidate Reminders */}
      <Card className="border-border/40 overflow-hidden">
        <CardContent className="p-5">
          <SectionHeader
            title="Candidate Reminders"
            description="Manage notifications for your candidates"
            icon={UserCheck}
            isEditing={editingSection === "candidate_reminders"}
            onEdit={() => setEditingSection("candidate_reminders")}
            onCancel={() => { setEditingSection(null); candidateRemindersForm.reset(settings.candidate_reminders); }}
            onSave={candidateRemindersForm.handleSubmit((data) => handleSave("candidate_reminders", data))}
            saving={saving}
          />
          {editingSection === "candidate_reminders" ? (
            renderReminderForm(candidateRemindersForm)
          ) : (
            <ReminderSummary reminders={settings.candidate_reminders} />
          )}
        </CardContent>
      </Card>

      {/* 3. Feedback Reminders */}
      <Card className="border-border/40 overflow-hidden">
        <CardContent className="p-5">
          <SectionHeader
            title="Feedback Reminders"
            description="Remind panelists to submit their feedback"
            icon={ClipboardCheck}
            isEditing={editingSection === "feedback_reminders"}
            onEdit={() => setEditingSection("feedback_reminders")}
            onCancel={() => { setEditingSection(null); feedbackRemindersForm.reset(settings.feedback_reminders); }}
            onSave={feedbackRemindersForm.handleSubmit((data) => handleSave("feedback_reminders", data))}
            saving={saving}
          />
          {editingSection === "feedback_reminders" ? (
            renderReminderForm(feedbackRemindersForm)
          ) : (
            <ReminderSummary reminders={settings.feedback_reminders} />
          )}
        </CardContent>
      </Card>

      {/* 4. Escalation */}
      <Card className="border-border/40 overflow-hidden">
        <CardContent className="p-5">
          <SectionHeader
            title="Escalation"
            description="Automated escalation for delayed interviews"
            icon={ShieldAlert}
            isEditing={editingSection === "escalation"}
            onEdit={() => setEditingSection("escalation")}
            onCancel={() => { setEditingSection(null); escalationForm.reset(settings.escalation); }}
            onSave={escalationForm.handleSubmit((data) => handleSave("escalation", data))}
            saving={saving}
          />
          {editingSection === "escalation" ? (
            <Form {...escalationForm}>
                <div className="space-y-4">
                    <FormField
                        control={escalationForm.control}
                        name="enabled"
                        render={({ field }) => (
                        <FormItem className="flex items-center justify-between p-3 rounded-lg border bg-muted/5">
                            <div className="space-y-0.5">
                                <FormLabel className="text-sm font-medium">Enable Escalation</FormLabel>
                                <FormDescription className="text-xs">Escalate issues to admins if not resolved</FormDescription>
                            </div>
                            <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                        </FormItem>
                        )}
                    />
                    {escalationForm.watch('enabled') && (
                        <div className="space-y-4 pl-4 border-l-2 border-primary/20">
                            <FormField
                                control={escalationForm.control}
                                name="escalation_recipients"
                                render={({ field }) => (
                                    <FormItem className="space-y-1">
                                        <FormLabel className="text-[11px] font-medium text-muted-foreground uppercase">Recipients</FormLabel>
                                        <FormControl>
                                            <EmailTagInput 
                                                value={field.value} 
                                                onChange={field.onChange} 
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    )}
                </div>
            </Form>
          ) : (
            <EscalationSummary escalation={settings.escalation} />
          )}
        </CardContent>
      </Card>

      {/* 5. Rescheduling */}
      <Card className="border-border/40 overflow-hidden">
        <CardContent className="p-5">
          <SectionHeader
            title="Rescheduling"
            description="Rules for changing interview times"
            icon={Clock}
            isEditing={editingSection === "rescheduling"}
            onEdit={() => setEditingSection("rescheduling")}
            onCancel={() => { setEditingSection(null); reschedulingForm.reset(settings.rescheduling); }}
            onSave={reschedulingForm.handleSubmit((data) => handleSave("rescheduling", data))}
            saving={saving}
          />
          {editingSection === "rescheduling" ? (
             <Form {...reschedulingForm}>
                 <div className="space-y-4">
                    <FormField
                        control={reschedulingForm.control}
                        name="enabled"
                        render={({ field }) => (
                        <FormItem className="flex items-center justify-between p-3 rounded-lg border bg-muted/5">
                            <div className="space-y-0.5">
                                <FormLabel className="text-sm font-medium">Enable Rescheduling</FormLabel>
                                <FormDescription className="text-xs">Allow modification of scheduled interview times</FormDescription>
                            </div>
                            <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                        </FormItem>
                        )}
                    />
                    {reschedulingForm.watch('enabled') && (
                        <div className="space-y-5 pl-4 border-l-2 border-primary/20">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={reschedulingForm.control}
                                    name="panelist_rescheduling_allowed"
                                    render={({ field }) => (
                                        <FormItem className="flex items-center justify-between p-2 rounded-md border bg-muted/5">
                                            <FormLabel className="text-xs font-medium">Panelist Allowed</FormLabel>
                                            <FormControl>
                                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={reschedulingForm.control}
                                    name="candidate_rescheduling_allowed"
                                    render={({ field }) => (
                                        <FormItem className="flex items-center justify-between p-2 rounded-md border bg-muted/5">
                                            <FormLabel className="text-xs font-medium">Candidate Allowed</FormLabel>
                                            <FormControl>
                                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={reschedulingForm.control}
                                    name="reschedule_window_for_panelist"
                                    render={({ field }) => (
                                        <FormItem className="space-y-1">
                                            <FormLabel className="text-[11px] font-medium text-muted-foreground uppercase">Min Notice Hours for Panelist</FormLabel>
                                            <Select onValueChange={(v) => field.onChange(Number(v))} value={String(field.value)}>
                                                <FormControl>
                                                    <SelectTrigger className="h-9 text-xs">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {RESCHEDULE_MIN_HOURS_OPTIONS.map(opt => (
                                                        <SelectItem key={opt.value} value={String(opt.value)}>{opt.label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={reschedulingForm.control}
                                    name="reschedule_window_for_candidate"
                                    render={({ field }) => (
                                        <FormItem className="space-y-1">
                                            <FormLabel className="text-[11px] font-medium text-muted-foreground uppercase">Min Notice Hours for Candidate</FormLabel>
                                            <Select onValueChange={(v) => field.onChange(Number(v))} value={String(field.value)}>
                                                <FormControl>
                                                    <SelectTrigger className="h-9 text-xs">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {RESCHEDULE_MIN_HOURS_OPTIONS.map(opt => (
                                                        <SelectItem key={opt.value} value={String(opt.value)}>{opt.label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={reschedulingForm.control}
                                    name="no_show_action"
                                    render={({ field }) => (
                                        <FormItem className="space-y-1">
                                            <FormLabel className="text-[11px] font-medium text-muted-foreground uppercase">No-Show Action</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="h-9 text-xs">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {NO_SHOW_ACTION_OPTIONS.map(opt => (
                                                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={reschedulingForm.control}
                                    name="max_reschedule_allowed_by_panelist"
                                    render={({ field }) => (
                                        <FormItem className="space-y-1">
                                            <FormLabel className="text-[11px] font-medium text-muted-foreground uppercase">Max Panelist Reschedules</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} className="h-9 text-xs" />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={reschedulingForm.control}
                                    name="max_reschedule_allowed_by_candidate"
                                    render={({ field }) => (
                                        <FormItem className="space-y-1">
                                            <FormLabel className="text-[11px] font-medium text-muted-foreground uppercase">Max Candidate Reschedules</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} className="h-9 text-xs" />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>
                    )}
                 </div>
             </Form>
          ) : (
            <ReschedulingSummary rescheduling={settings.rescheduling} />
          )}
        </CardContent>
      </Card>


    </div>
  );
};

export default JobSettingsDetailedEditor;
