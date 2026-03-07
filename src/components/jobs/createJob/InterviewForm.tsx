import { useImperativeHandle, forwardRef, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import {
  Plus,
  Trash2,
  UserPlus,
  ChevronDown,
  ChevronUp,
  CalendarIcon,
  Video,
  Phone,
  MapPin,
  Settings2,
  Users,
  Bell,
  Mic,
  ClipboardList,
  CalendarDays,
  Link2,
  Clock,
  FileText,
  Globe,
} from 'lucide-react';

import {
  interviewFormSchema,
  type InterviewFormTypes,
  type InterviewRound,
} from '@/types/interviewTypes';

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
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// ─── Props ────────────────────────────────────────────────────────────────────

interface InterviewFormProps {
  /**
   * Pre-populated data from `extractedJData.interview_details`.
   */
  interviewDetails?: InterviewFormTypes | null;
  /**
   * Called with validated form data. In the create-job wizard this
   * fires the API calls to create round configs, then navigates.
   */
  onUpdate: (data: InterviewFormTypes) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildNewRound(index: number): InterviewRound {
  const start = new Date();
  start.setDate(start.getDate() + 1);
  start.setHours(10, 0, 0, 0);
  const end = new Date(start);
  end.setHours(11, 0, 0, 0);
  return {
    round_number: index + 1,
    title: '',
    panelists: [{ name: '', email: '', role: '' }],
    start_date: start,
    end_date: end,
    interview_type: 'Video Call',
    instructions: '',
    duration_minutes: 60,
    meet_link: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}

const MODE_OPTIONS = [
  { value: 'Video Call', label: 'Video Call', icon: Video, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { value: 'Phone', label: 'Phone', icon: Phone, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { value: 'In Person', label: 'In Person', icon: MapPin, color: 'text-amber-500', bg: 'bg-amber-500/10' },
] as const;

type ModeValue = (typeof MODE_OPTIONS)[number]['value'];

// Common IANA timezones for the dropdown
const TIMEZONE_OPTIONS = [
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

// ─── Date Picker ──────────────────────────────────────────────────────────────
// Uses shadcn's built-in Calendar with captionLayout="dropdown" which gives
// month + year select dropdowns — no extra library, no time input needed.

function DatePicker({
  value,
  onChange,
  placeholder,
}: {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-full justify-between font-normal h-10 px-3 border-border/60 bg-background hover:bg-muted/30 transition-all duration-200',
            !value && 'text-muted-foreground'
          )}
        >
          <span className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 shrink-0 text-primary/60" />
            {value ? format(value, 'PPP') : placeholder}
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto overflow-hidden p-0 shadow-lg border-border/60" align="start">
        <Calendar
          mode="single"
          selected={value}
          captionLayout="dropdown"
          onSelect={(date) => {
            onChange(date);
            setOpen(false);
          }}
          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
          className="rounded-lg p-3 [--cell-size:2.5rem]"
        />
      </PopoverContent>
    </Popover>
  );
}

// ─── Section Label ────────────────────────────────────────────────────────────

function SectionLabel({ icon: Icon, children }: { icon?: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      {Icon && <Icon className="h-3.5 w-3.5 text-primary/50" />}
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
        {children}
      </p>
    </div>
  );
}

// ─── Panel Member Row ─────────────────────────────────────────────────────────

function PanelMemberRow({
  roundIndex,
  memberIndex,
  form,
  onRemove,
  canRemove,
}: {
  roundIndex: number;
  memberIndex: number;
  form: ReturnType<typeof useForm<InterviewFormTypes>>;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const base = `rounds.${roundIndex}.panelists.${memberIndex}` as const;

  return (
    <div className="group/member grid grid-cols-1 md:grid-cols-[1fr_1.3fr_1fr_36px] gap-3 items-end p-4 rounded-xl bg-background border border-border/40 hover:border-border/70 hover:shadow-sm transition-all duration-200">
      <FormField
        control={form.control}
        name={`${base}.name`}
        render={({ field }) => (
          <FormItem className="space-y-1.5">
            <FormLabel className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Name</FormLabel>
            <FormControl>
              <Input placeholder="Jane Doe" className="h-9 text-sm bg-transparent" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name={`${base}.email`}
        render={({ field }) => (
          <FormItem className="space-y-1.5">
            <FormLabel className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Email <span className="text-primary">*</span>
            </FormLabel>
            <FormControl>
              <Input placeholder="jane@company.com" className="h-9 text-sm bg-transparent" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name={`${base}.role`}
        render={({ field }) => (
          <FormItem className="space-y-1.5">
            <FormLabel className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Role</FormLabel>
            <FormControl>
              <Input placeholder="e.g. Hiring Manager" className="h-9 text-sm bg-transparent" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="flex items-end pb-0.5">
        {canRemove ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover/member:opacity-100 transition-all duration-200"
            onClick={onRemove}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        ) : (
          <div className="h-9 w-9" />
        )}
      </div>
    </div>
  );
}

// ─── Round Card ───────────────────────────────────────────────────────────────

function RoundCard({
  roundIndex,
  form,
  onRemove,
  canRemove,
}: {
  roundIndex: number;
  form: ReturnType<typeof useForm<InterviewFormTypes>>;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const [expanded, setExpanded] = useState(true);

  const { fields: panelFields, append: appendPanel, remove: removePanel } = useFieldArray({
    control: form.control,
    name: `rounds.${roundIndex}.panelists`,
  });

  const roundTitle = form.watch(`rounds.${roundIndex}.title`);
  const mode = form.watch(`rounds.${roundIndex}.interview_type`) as ModeValue | undefined;
  const startDate = form.watch(`rounds.${roundIndex}.start_date`);
  const endDate = form.watch(`rounds.${roundIndex}.end_date`);

  const modeConfig = mode ? MODE_OPTIONS.find((m) => m.value === mode) : undefined;
  const ModeIcon = modeConfig?.icon ?? Video;

  return (
    <div className="relative pl-7">
      {/* Timeline dot + line */}
      <div className="absolute left-0 top-5 flex flex-col items-center">
        <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[11px] font-bold z-10 shrink-0 shadow-sm shadow-primary/20">
          {roundIndex + 1}
        </div>
        {expanded && (
          <div className="w-px flex-1 bg-linear-to-b from-primary/30 via-border to-transparent mt-1" style={{ minHeight: '2rem' }} />
        )}
      </div>

      <Card className="border border-border/50 shadow-sm hover:shadow-md bg-card overflow-hidden transition-shadow duration-300">
        {/* Card Header */}
        <CardHeader className="px-5 py-3.5 border-b border-border/30 bg-linear-to-r from-muted/30 to-transparent">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="flex items-center gap-2.5 min-w-0">
                {roundTitle ? (
                  <span className="text-sm font-semibold truncate">{roundTitle}</span>
                ) : (
                  <span className="text-sm text-muted-foreground italic">Untitled round</span>
                )}

                {modeConfig && (
                  <Badge variant="secondary" className={cn('gap-1 text-[10px] font-medium px-2 py-0.5', modeConfig.bg, modeConfig.color, 'border-0')}>
                    <ModeIcon className="h-3 w-3" />
                    <span className="hidden sm:inline">{modeConfig.label}</span>
                  </Badge>
                )}
              </div>

              {/* Date range preview */}
              {(startDate || endDate) && (
                <Badge variant="outline" className="hidden md:flex items-center gap-1.5 text-[10px] text-muted-foreground font-normal px-2.5 py-0.5 bg-background">
                  <CalendarIcon className="h-3 w-3 text-primary/50" />
                  {startDate && format(startDate, 'MMM d')}
                  {startDate && endDate && <span className="text-muted-foreground/50">→</span>}
                  {endDate && format(endDate, 'MMM d')}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setExpanded((p) => !p)}
                className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg"
              >
                {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
              {canRemove && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                  onClick={onRemove}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        {expanded && (
          <CardContent className="px-5 py-6 space-y-7">
            {/* Hidden: round_number field */}
            <FormField
              control={form.control}
              name={`rounds.${roundIndex}.round_number`}
              render={({ field }) => (
                <input
                  type="hidden"
                  name={field.name}
                  value={roundIndex + 1}
                  ref={field.ref}
                  onChange={() => field.onChange(roundIndex + 1)}
                />
              )}
            />

            {/* Row 1: Title + Interview Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormField
                control={form.control}
                name={`rounds.${roundIndex}.title`}
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-xs text-muted-foreground font-medium">
                      Round Title <span className="text-primary">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Technical Screen" className="h-10 bg-transparent" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`rounds.${roundIndex}.interview_type`}
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-xs text-muted-foreground font-medium">
                      Interview Type <span className="text-primary">*</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MODE_OPTIONS.map(({ value, label, icon: Icon, color }) => (
                          <SelectItem key={value} value={value}>
                            <span className="flex items-center gap-2">
                              <Icon className={cn('h-3.5 w-3.5', color)} />
                              {label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Row 1b: Duration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormField
                control={form.control}
                name={`rounds.${roundIndex}.duration_minutes`}
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                      <Clock className="h-3 w-3" />
                      Duration (minutes) <span className="text-primary">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        placeholder="60"
                        className="h-10 bg-transparent"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : '')}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Row 2: Dates */}
            <div className="rounded-xl border border-border/40 bg-muted/10 p-4 space-y-3">
              <SectionLabel icon={CalendarDays}>Schedule</SectionLabel>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name={`rounds.${roundIndex}.start_date`}
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-xs text-muted-foreground font-medium">
                        Start Date <span className="text-primary">*</span>
                      </FormLabel>
                      <FormControl>
                        <DatePicker
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Pick start date"
                        />
                      </FormControl>
                      {/* Refinement error path is ['start_date'] */}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`rounds.${roundIndex}.end_date`}
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-xs text-muted-foreground font-medium">
                        End Date <span className="text-primary">*</span>
                      </FormLabel>
                      <FormControl>
                        <DatePicker
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Pick end date"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name={`rounds.${roundIndex}.timezone`}
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                      <Globe className="h-3 w-3" />
                      Timezone <span className="text-primary">*</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Select timezone" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TIMEZONE_OPTIONS.map((tz) => (
                          <SelectItem key={tz} value={tz}>
                            {tz.replace(/_/g, ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Row 3: Meeting link */}
            <FormField
              control={form.control}
              name={`rounds.${roundIndex}.meet_link`}
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                    <Link2 className="h-3 w-3" />
                    Meeting Link
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://meet.google.com/..."
                      className="h-10 bg-transparent"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Row 3b: Instructions */}
            <FormField
              control={form.control}
              name={`rounds.${roundIndex}.instructions`}
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                    <FileText className="h-3 w-3" />
                    Instructions
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g. Please be prepared to discuss your previous projects and answer technical questions."
                      className="min-h-20 resize-y text-sm bg-transparent"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Row 4: Panel members */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <SectionLabel icon={Users}>Panelists</SectionLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendPanel({ name: '', email: '', role: '' })}
                  className="h-7 text-xs gap-1.5 border-dashed hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all -mt-3"
                >
                  <UserPlus className="h-3 w-3" />
                  Add Panelist
                </Button>
              </div>

              <div className="space-y-2.5">
                {panelFields.map((member, memberIndex) => (
                  <PanelMemberRow
                    key={member.id}
                    roundIndex={roundIndex}
                    memberIndex={memberIndex}
                    form={form}
                    onRemove={() => removePanel(memberIndex)}
                    canRemove={panelFields.length > 1}
                  />
                ))}
              </div>

              {form.formState.errors?.rounds?.[roundIndex]?.panelists?.root && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.rounds[roundIndex].panelists.root?.message}
                </p>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

// ─── Settings Toggle ──────────────────────────────────────────────────────────

function SettingToggle({
  icon: Icon,
  title,
  description,
  checked,
  onCheckedChange,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <label
      className={cn(
        'flex items-start gap-4 p-4 rounded-xl border cursor-pointer select-none transition-all duration-200',
        checked
          ? 'border-primary/30 bg-primary/4 shadow-sm shadow-primary/5'
          : 'border-border/40 hover:border-border/70 hover:bg-muted/20'
      )}
    >
      <div
        className={cn(
          'flex items-center justify-center w-10 h-10 rounded-xl shrink-0 transition-all duration-200',
          checked ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20' : 'bg-muted/80 text-muted-foreground'
        )}
      >
        <Icon className="h-4.5 w-4.5" />
      </div>
      <div className="flex-1 min-w-0 py-0.5">
        <p className="text-sm font-medium leading-snug">{title}</p>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{description}</p>
      </div>
      <Checkbox
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="mt-2 shrink-0 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
        onClick={(e) => e.stopPropagation()}
      />
    </label>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────

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
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary shrink-0">
          <Icon className="h-4.5 w-4.5" />
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

// ─── Main Component ───────────────────────────────────────────────────────────

const InterviewForm = forwardRef(function InterviewForm(
  { interviewDetails, onUpdate }: InterviewFormProps,
  ref
) {
  const form = useForm<InterviewFormTypes>({
    resolver: zodResolver(interviewFormSchema),
    defaultValues: {
      rounds: interviewDetails?.rounds ?? [],
      reminders_enabled: interviewDetails?.reminders_enabled ?? false,
      voice_call_enabled: interviewDetails?.voice_call_enabled ?? false,
      interview_assessment_enabled: interviewDetails?.interview_assessment_enabled ?? false,
      what_to_evaluate: interviewDetails?.what_to_evaluate ?? '',
    },
  });

  const { fields: roundFields, append: appendRound, remove: removeRound } = useFieldArray({
    control: form.control,
    name: 'rounds',
  });

  const assessmentEnabled = form.watch('interview_assessment_enabled');

  const onSubmit = (values: InterviewFormTypes) => {
    onUpdate(values);
  };

  useImperativeHandle(ref, () => ({
    submit: form.handleSubmit(onSubmit),
  }));

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-8 space-y-12">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-12">

          {/* ── Interview Rounds ─────────────────────────────────────────── */}
          <div className="space-y-6">
            <FormSectionHeader
              icon={CalendarDays}
              title="Interview Rounds"
              description="Define the stages of your interview process"
              action={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2 h-9 border-dashed hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all font-medium shrink-0"
                  onClick={() => appendRound(buildNewRound(roundFields.length))}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Round
                </Button>
              }
            />

            {roundFields.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 rounded-2xl border-2 border-dashed border-border/50 bg-linear-to-b from-muted/10 to-muted/5 text-center">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <CalendarDays className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm font-semibold">No interview rounds yet</p>
                <p className="text-xs text-muted-foreground mt-1.5 max-w-[24rem] leading-relaxed">
                  Add interview rounds to define your hiring pipeline. Each round can have its own panel, schedule, and mode.
                </p>
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  className="mt-6 gap-2 shadow-sm"
                  onClick={() => appendRound(buildNewRound(0))}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add first round
                </Button>
              </div>
            ) : (
              <div className="space-y-5">
                {roundFields.map((round, index) => (
                  <RoundCard
                    key={round.id}
                    roundIndex={index}
                    form={form}
                    onRemove={() => removeRound(index)}
                    canRemove={roundFields.length > 1}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ── Settings ─────────────────────────────────────────────────── */}
          <div className="space-y-5">
            <FormSectionHeader
              icon={Settings2}
              title="Settings"
              description="Notifications and evaluation preferences"
            />

            <div className="space-y-2.5">
              <FormField
                control={form.control}
                name="reminders_enabled"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <SettingToggle
                        icon={Bell}
                        title="Enable Reminders"
                        description="Automatically notify candidates and panel members before scheduled interviews"
                        checked={field.value ?? false}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="voice_call_enabled"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <SettingToggle
                        icon={Mic}
                        title="Enable Voice Call"
                        description="Allow interviews to be conducted and recorded via voice call"
                        checked={field.value || false}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="interview_assessment_enabled"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <SettingToggle
                        icon={ClipboardList}
                        title="Enable Interview Assessment"
                        description="Collect structured feedback from interviewers after each round"
                        checked={field.value ?? false}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* what_to_evaluate: only shown when assessment is enabled */}
            {assessmentEnabled && (
              <div className="ml-0 pl-5 border-l-2 border-primary/20 space-y-2">
                <FormField
                  control={form.control}
                  name="what_to_evaluate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        What to Evaluate
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g. Problem-solving, communication, cultural fit, technical depth..."
                          className="min-h-24 resize-y text-sm bg-transparent"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-xs text-muted-foreground">
                        Criteria interviewers should assess candidates against
                      </FormDescription> 
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </div>

          {/* Hidden submit — triggered via ref.submit() from parent */}
          <button type="submit" className="hidden" id="interview-form-submit" />
        </form>
      </Form>
    </div>
  );
});

export default InterviewForm;