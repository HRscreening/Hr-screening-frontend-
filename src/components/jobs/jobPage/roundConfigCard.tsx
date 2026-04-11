import React, { useState} from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import {
  ChevronDown,
  ChevronUp,
  Video,
  CalendarIcon,
  Clock,
  FileText,
  Globe,
  Users,
  UserPlus,
  Trash2,
  Pencil,
  Save,
  ExternalLink,
  Loader2,
  AlertTriangle,
  CalendarX2,
} from 'lucide-react';

import { cn } from '@/lib/utils';

import AssessmentTagsSection from '@/components/jobs/jobPage/AssessmentTagsSection';
import type { SubmitHandler } from 'react-hook-form';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import type {
  RoundOverview,
  RoundFullConfig,
  RoundEditValues,
} from '@/types/roundConfigEditTypes';
import {
  roundEditSchema,
  buildPanelistDiff,
  MODE_OPTIONS,
  TIMEZONE_OPTIONS,
} from '@/types/roundConfigEditTypes';

import { useUpdateRound } from '@/hooks/job_hooks/rounds/useUpdateRound';
import { useDeleteRound } from '@/hooks/job_hooks/rounds/useDeleteRound';
import { useRoundDetail } from '@/hooks/job_hooks/rounds/useRoundDetail';

// ─── Helpers ──────────────────────────────────────────────────────────────────


function InfoCell({
  icon: Icon,
  label,
  children,
  className,
}: {
  icon?: React.ElementType;
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-1', className)}>
      <p className="text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wider flex items-center gap-1.5">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </p>
      <div className="text-sm font-medium text-foreground">{children}</div>
    </div>
  );
}

function SectionLabel({
  icon: Icon,
  children,
}: {
  icon?: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-1.5 mb-2">
      {Icon && <Icon className="h-3 w-3 text-primary/50" />}
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
        {children}
      </p>
    </div>
  );
}

// ─── Round Detail Loading Skeleton ────────────────────────────────────────────

function RoundDetailSkeleton() {
  return (
    <div className="px-5 py-5 space-y-4 border-t border-border/20">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
      <Skeleton className="h-14 w-full" />
    </div>
  );
}

// ─── Panelist Row (edit mode) ─────────────────────────────────────────────────

/**
 * Renders one panelist row.
 * - Existing panelists (have `id`) show a soft-delete button that hides the row.
 * - New panelists (no `id`) show a hard-remove button (splices from the array).
 * - Soft-deleted rows render as a collapsed "Removed – undo?" strip.
 */
function PanelMemberRow({
  memberIndex,
  form,
  onHardRemove,
  onSoftDelete,
  onUndoDelete,
  isDeleted,
  isExisting,
  canHardRemove,
  disabled,
}: {
  memberIndex: number;
  form: ReturnType<typeof useForm<RoundEditValues>>;
  onHardRemove: () => void;
  onSoftDelete: () => void;
  onUndoDelete: () => void;
  isDeleted: boolean;
  isExisting: boolean;
  canHardRemove: boolean;
  disabled: boolean;
}) {
  if (isDeleted) {
    // Collapsed "undo" strip for soft-deleted existing panelists
    const email = form.getValues(`panelists.${memberIndex}.email`);
    const name = form.getValues(`panelists.${memberIndex}.name`);
    return (
      <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-destructive/5 border border-destructive/20 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Trash2 className="h-3 w-3 text-destructive/60" />
          <span className="line-through">{name || email}</span>
          <span className="text-destructive/60 not-italic">— will be removed on save</span>
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 text-[10px] px-2 text-primary hover:text-primary"
          onClick={onUndoDelete}
        >
          Undo
        </Button>
      </div>
    );
  }

  return (
    <div className="group/member grid grid-cols-1 md:grid-cols-[1fr_1.3fr_1fr_32px] gap-2 items-end p-3 rounded-lg bg-background border border-border/40 hover:border-border/60 transition-all duration-200">
      <FormField
        control={form.control}
        name={`panelists.${memberIndex}.name`}
        render={({ field }) => (
          <FormItem className="space-y-1">
            <FormLabel className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              Name <span className="text-primary">*</span>
            </FormLabel>
            <FormControl>
              <Input
                placeholder="Jane Doe"
                className="h-8 text-sm bg-transparent"
                disabled={disabled}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name={`panelists.${memberIndex}.email`}
        render={({ field }) => (
          <FormItem className="space-y-1">
            <FormLabel className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              Email <span className="text-primary">*</span>
            </FormLabel>
            <FormControl>
              <Input
                placeholder="jane@company.com"
                className="h-8 text-sm bg-transparent"
                disabled={disabled}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name={`panelists.${memberIndex}.role`}
        render={({ field }) => (
          <FormItem className="space-y-1">
            <FormLabel className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              Role <span className="text-primary">*</span>
            </FormLabel>
            <FormControl>
              <Input
                placeholder="e.g. Hiring Manager"
                className="h-8 text-sm bg-transparent"
                disabled={disabled}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="flex items-end pb-0.5">
        {!disabled && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover/member:opacity-100 transition-all duration-200"
                onClick={isExisting ? onSoftDelete : canHardRemove ? onHardRemove : undefined}
                disabled={!isExisting && !canHardRemove}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isExisting ? 'Remove panelist' : 'Delete row'}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
}

// ─── Read-Only Detail View ────────────────────────────────────────────────────

function ReadOnlyDetail({
  fullConfig,
  modeConfig,
  ModeIcon,
}: {
  fullConfig: RoundFullConfig;
  modeConfig: (typeof MODE_OPTIONS)[number] | undefined;
  ModeIcon: React.ElementType;
}) {
  return (
    <div className="px-5 py-4 space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3">
        <InfoCell icon={Video} label="Type">
          <span className="flex items-center gap-1.5">
            <ModeIcon className={cn('h-3.5 w-3.5', modeConfig?.color)} />
            {fullConfig.interview_type}
          </span>
        </InfoCell>
        <InfoCell icon={Clock} label="Duration">
          {fullConfig.duration_minutes} min
        </InfoCell>
        <InfoCell icon={Users} label="Panel Mode">
          {fullConfig.panel_mode === 'panel' ? 'Panel' : 'Sequential'}
        </InfoCell>
        <InfoCell icon={Globe} label="Timezone">
          {fullConfig.timezone ?? 'UTC'}
        </InfoCell>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3 py-3 px-4 rounded-lg bg-muted/20 border border-border/30">
        <InfoCell icon={CalendarIcon} label="Start Date">
          {format(new Date(fullConfig.start_date), 'MMM d, yyyy')}
        </InfoCell>
        <InfoCell icon={CalendarIcon} label="End Date">
          {format(new Date(fullConfig.end_date), 'MMM d, yyyy')}
        </InfoCell>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <p className="text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="h-3 w-3" /> Instructions
          </p>
          {fullConfig.instructions ? (
            <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line bg-muted/10 rounded-lg px-3 py-2 border border-border/20 min-h-14">
              {fullConfig.instructions}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground italic bg-muted/10 rounded-lg px-3 py-2 border border-border/20 min-h-14 flex items-center">
              No instructions provided
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <p className="text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wider flex items-center gap-1.5">
            <Users className="h-3 w-3" /> Panelists ({fullConfig.panelists.length})
          </p>
          {fullConfig.panelists.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {fullConfig.panelists.map((p, idx) => (
                <Tooltip key={idx}>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-background border border-border/40 hover:border-border/60 transition-colors cursor-default">
                      <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[9px] font-bold text-primary shrink-0">
                        {p.name
                          ? p.name.charAt(0).toUpperCase()
                          : p.email.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs font-medium truncate max-w-28">
                        {p.name || p.email.split('@')[0]}
                      </span>
                      {p.role && (
                        <Badge
                          variant="outline"
                          className="text-[9px] font-normal px-1.5 py-0 h-4 shrink-0"
                        >
                          {p.role}
                        </Badge>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">{p.email}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic bg-muted/10 rounded-lg px-3 py-2 border border-border/20">
              No panelists assigned
            </p>
          )}
        </div>

        {/* Assessment Tags (read-only) */}
        {fullConfig.assessment_criterias && fullConfig.assessment_criterias.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wider flex items-center gap-1.5">
              Assessment Tags ({fullConfig.assessment_criterias.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {fullConfig.assessment_criterias.map((tag, idx) => (
                <Badge
                  key={`${tag}-${idx}`}
                  variant="secondary"
                  className="text-xs font-medium px-2.5 py-0.5 h-6 bg-primary/10 text-primary border-0"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Round Config Card ────────────────────────────────────────────────────────

export default function RoundConfigCard({
  overview,
  jobId,
  onUpdated,
}: {
  overview: RoundOverview;
  jobId: string;
  onUpdated: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);

  const { data: fullConfig, isLoading: loadingDetail } = useRoundDetail(
    expanded ? overview.round_config_id : ''
  );

  const updateMutation = useUpdateRound(jobId, overview.round_config_id);
  const deleteMutation = useDeleteRound(jobId, overview.round_config_id);

  const modeConfig = MODE_OPTIONS.find((m) => m.value === overview.interview_type);
  const ModeIcon = modeConfig?.icon ?? Video;

  const handleToggle = () => {
    setExpanded(!expanded);
  };

  // ── Form ──────────────────────────────────────────────────────────────────

  const form = useForm<RoundEditValues>({
    resolver: zodResolver(roundEditSchema),
    defaultValues: {
      title: '',
      interview_type: 'Video Call',
      instructions: '',
      duration_minutes: 60,
      assessment_criterias: [],
      panelists: [{ name: '', email: '', role: '' }],
      start_date: new Date(),
      end_date: new Date(),
      timezone: 'UTC',
      panel_mode: 'SEQUENTIAL',
    },
  });

  const {
    fields: panelFields,
    append: appendPanel,
    remove: removePanel,
    update: updatePanel,
  } = useFieldArray({ control: form.control, name: 'panelists' });

  // ── Edit mode ─────────────────────────────────────────────────────────────

  const enterEditMode = () => {
    if (!fullConfig) return;
    form.reset({
      title: fullConfig.title,
      interview_type: fullConfig.interview_type as RoundEditValues['interview_type'],
      instructions: fullConfig.instructions ?? '',
      duration_minutes: fullConfig.duration_minutes,
      /**
       * Existing panelists carry their DB `id`.
       * `_deleted` starts as false for all.
       */
      panelists:
        fullConfig.panelists.length > 0
          ? fullConfig.panelists.map((p) => ({
            id: p.id,
            name: p.name,
            email: p.email,
            role: p.role,
            _deleted: false,
          }))
          : [{ name: '', email: '', role: '' }],
      start_date: new Date(fullConfig.start_date),
      end_date: new Date(fullConfig.end_date),
      timezone: fullConfig.timezone ?? 'UTC',
      panel_mode: fullConfig.panel_mode === 'panel' ? 'PANEL' : 'SEQUENTIAL',
      assessment_criterias: fullConfig.assessment_criterias ?? [],
    });
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    form.reset();
  };

  // ── Save ──────────────────────────────────────────────────────────────────

  const handleSave: SubmitHandler<RoundEditValues> = async (values: RoundEditValues) => {
    console.log('handleSave values:', values);
    try {
      // Build the structured diff from the flat panelists array
      const panelistDiff = buildPanelistDiff(values.panelists);
      console.log('panelistDiff:', panelistDiff);

      const body = {
        title: values.title,
        interview_type: values.interview_type,
        instructions: values.instructions,
        duration_minutes: values.duration_minutes,
        start_date: values.start_date.toISOString(),
        end_date: values.end_date.toISOString(),
        timezone: values.timezone,
        panel_mode: values.panel_mode,
        round_number: overview.round_number,
        assessment_criterias: values.assessment_criterias,
        // ← structured panelist diff
        panelists: panelistDiff,
      };

      await updateMutation.mutateAsync(body);
      setEditing(false);
      onUpdated();
    } catch (err) {
      console.error('Failed to update round', err);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync();
      // onUpdated is called if handleDeleted handles removal from parent state
      // but React Query will invalidate the rounds list anyway.
    } catch (err) {
      console.error('Failed to delete round', err);
    }
  };

  // ── Panelist helpers ──────────────────────────────────────────────────────

  /** Mark an existing panelist as deleted (soft-delete) */
  const softDeletePanelist = (idx: number) => {
    const current = form.getValues(`panelists.${idx}`);
    updatePanel(idx, { ...current, _deleted: true });
  };

  /** Restore a soft-deleted panelist */
  const undoDeletePanelist = (idx: number) => {
    const current = form.getValues(`panelists.${idx}`);
    updatePanel(idx, { ...current, _deleted: false });
  };

  /** Count active (non-deleted) panelists */
  const activeCount = panelFields.filter((f) => !form.watch(`panelists.${panelFields.indexOf(f)}._deleted`)).length;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="relative pl-8">
      {/* Timeline connector */}
      <div className="absolute left-0 top-0 bottom-0 flex flex-col items-center pt-3">
        <div className="w-5 h-5 rounded-md bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold z-10 shrink-0 shadow-sm shadow-primary/20">
          {overview.round_number}
        </div>
        {expanded && (
          <div className="w-px flex-1 bg-linear-to-b from-primary/25 to-transparent mt-1" />
        )}
      </div>

      <Card className="border border-border/40 shadow-sm hover:shadow-md bg-card overflow-hidden transition-all duration-200">
        {/* ── Header ────────────────────────────────────────────────────── */}
        <CardHeader
          className="px-4 py-2.5 cursor-pointer select-none hover:bg-muted/20 transition-colors"
          onClick={handleToggle}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1 flex-wrap">
              <span className="text-sm font-semibold truncate">
                {overview.title || 'Untitled round'}
              </span>
              {modeConfig && (
                <Badge
                  variant="secondary"
                  className={cn(
                    'gap-1 text-[10px] font-medium px-1.5 py-0 h-5 border-0 shrink-0',
                    modeConfig.bg,
                    modeConfig.color
                  )}
                >
                  <ModeIcon className="h-3 w-3" />
                  {modeConfig.label}
                </Badge>
              )}
              <span className="hidden md:inline text-[10px] text-muted-foreground/50">|</span>
              <span className="hidden md:flex items-center gap-1 text-[11px] text-muted-foreground">
                <CalendarIcon className="h-3 w-3 text-primary/40" />
                {format(new Date(overview.start_date), 'MMM d')} –{' '}
                {format(new Date(overview.end_date), 'MMM d')}
              </span>
              <span className="hidden lg:inline text-[10px] text-muted-foreground/50">|</span>
              <span className="hidden lg:flex items-center gap-1 text-[11px] text-muted-foreground">
                <Users className="h-3 w-3 text-primary/40" />
                {overview.panelists_count} panelist
                {overview.panelists_count !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="flex items-center gap-0.5 shrink-0">
              {overview.is_slots_available ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10 rounded-md"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(`/jobs/view_slots/${overview.round_config_id}`, '_blank');
                      }}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>View available slots</p>
                  </TooltipContent>
                </Tooltip>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground/40 cursor-default"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <CalendarX2 className="h-3.5 w-3.5" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>No slots available</p>
                  </TooltipContent>
                </Tooltip>
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-md"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggle();
                }}
              >
                {expanded ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* ── Expanded Content ──────────────────────────────────────────── */}
        {expanded && (
          <>
            {loadingDetail ? (
              <RoundDetailSkeleton />
            ) : fullConfig ? (
              editing ? (
                /* ═══ EDIT MODE ═══ */
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSave)}>
                    <CardContent className="px-5 py-5 space-y-4 border-t border-border/20">

                      {/* Row 1: Title + Type + Duration */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem className="space-y-1.5">
                              <FormLabel className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                                Title <span className="text-primary">*</span>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g. Technical Screen"
                                  className="h-9 text-sm bg-transparent"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="interview_type"
                          render={({ field }) => (
                            <FormItem className="space-y-1.5">
                              <FormLabel className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                                Type <span className="text-primary">*</span>
                              </FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Select type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {MODE_OPTIONS.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                      <span className="flex items-center gap-2">
                                        <opt.icon className={cn('h-3.5 w-3.5', opt.color)} />
                                        {opt.label}
                                      </span>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="duration_minutes"
                          render={({ field }) => (
                            <FormItem className="space-y-1.5">
                              <FormLabel className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1">
                                <Clock className="h-3 w-3" /> Duration (min){' '}
                                <span className="text-primary">*</span>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={1}
                                  placeholder="60"
                                  className="h-9 text-sm bg-transparent"
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(e.target.value ? Number(e.target.value) : '')
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Row 2: Panel Mode + Start + End */}
                      {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="panel_mode"
                          render={({ field }) => (
                            <FormItem className="space-y-1.5">
                              <FormLabel className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1">
                                <Users className="h-3 w-3" /> Panel Mode
                              </FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Select mode" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="SEQUENTIAL">Sequential</SelectItem>
                                  <SelectItem value="PANEL">Panel</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="start_date"
                          render={({ field }) => (
                            <FormItem className="space-y-1.5">
                              <FormLabel className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                                Start Date <span className="text-primary">*</span>
                              </FormLabel>
                              <FormControl>
                                <DatePicker
                                  value={field.value}
                                  onChange={field.onChange}
                                  placeholder="Start date"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="end_date"
                          render={({ field }) => (
                            <FormItem className="space-y-1.5">
                              <FormLabel className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                                End Date <span className="text-primary">*</span>
                              </FormLabel>
                              <FormControl>
                                <DatePicker
                                  value={field.value}
                                  onChange={field.onChange}
                                  placeholder="End date"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div> */}

                      {/* Row 3: Timezone + Meeting Link */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="timezone"
                          render={({ field }) => (
                            <FormItem className="space-y-1.5">
                              <FormLabel className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1">
                                <Globe className="h-3 w-3" /> Timezone{' '}
                                <span className="text-primary">*</span>
                              </FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Select timezone" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {TIMEZONE_OPTIONS.map((tz) => (
                                    <SelectItem key={tz} value={tz}>
                                      {tz}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Row 4: Instructions */}
                      <FormField
                        control={form.control}
                        name="instructions"
                        render={({ field }) => (
                          <FormItem className="space-y-1.5">
                            <FormLabel className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1">
                              <FileText className="h-3 w-3" /> Instructions
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="e.g. Please be prepared to discuss your previous projects…"
                                className="min-h-16 resize-y text-sm bg-transparent"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Row 5: Assessment Tags */}
                      <AssessmentTagsSection
                        tags={form.watch('assessment_criterias')}
                        onChange={(newTags) => form.setValue('assessment_criterias', newTags, { shouldValidate: true })}
                        roundTitle={form.watch('title')}
                        jobId={jobId}
                      />

                      {/* Row 6: Panelists */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <SectionLabel icon={Users}>
                            Panelists
                            {activeCount > 0 && (
                              <span className="ml-1 text-muted-foreground/60 font-normal normal-case">
                                ({activeCount} active)
                              </span>
                            )}
                          </SectionLabel>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              appendPanel({ name: '', email: '', role: '', _deleted: false })
                            }
                            className="h-6 text-[10px] gap-1 px-2 border-dashed hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all"
                          >
                            <UserPlus className="h-3 w-3" />
                            Add
                          </Button>
                        </div>

                        {/* Top-level panelists error (e.g. "at least one required") */}
                        {form.formState.errors.panelists?.root?.message && (
                          <p className="text-xs text-destructive flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            {form.formState.errors.panelists.root.message}
                          </p>
                        )}
                        {typeof form.formState.errors.panelists?.message === 'string' && (
                          <p className="text-xs text-destructive flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            {form.formState.errors.panelists.message}
                          </p>
                        )}

                        <div className="space-y-2">
                          {panelFields.map((member, idx) => {
                            const isDeleted = !!form.watch(`panelists.${idx}._deleted`);
                            const isExisting = !!member.id;
                            return (
                              <PanelMemberRow
                                key={member.id}
                                memberIndex={idx}
                                form={form}
                                isDeleted={isDeleted}
                                isExisting={isExisting}
                                onSoftDelete={() => softDeletePanelist(idx)}
                                onUndoDelete={() => undoDeletePanelist(idx)}
                                onHardRemove={() => removePanel(idx)}
                                canHardRemove={activeCount > 1}
                                disabled={false}
                              />
                            );
                          })}
                        </div>
                      </div>

                      {/* Action bar */}
                      <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/20">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={cancelEdit}
                          disabled={updateMutation.isPending}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          size="sm"
                          className="h-8 text-xs gap-1.5"
                          disabled={updateMutation.isPending}
                          onClick={() => {
                            console.log('Save button clicked');
                            console.log('Form state:', {
                              isValid: form.formState.isValid,
                              isSubmitting: form.formState.isSubmitting,
                              errors: form.formState.errors,
                            });
                          }}
                        >
                          {updateMutation.isPending ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Save className="h-3 w-3" />
                          )}
                          {updateMutation.isPending ? 'Saving…' : 'Save'}
                        </Button>
                      </div>
                    </CardContent>
                  </form>
                </Form>
              ) : (
                /* ═══ READ MODE ═══ */
                <>
                  <div className="border-t border-border/20">
                    <ReadOnlyDetail
                      fullConfig={fullConfig}
                      modeConfig={modeConfig}
                      ModeIcon={ModeIcon}
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2 px-5 py-2.5 border-t border-border/20 bg-muted/10">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1.5"
                      onClick={enterEditMode}
                    >
                      <Pencil className="h-3 w-3" />
                      Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                          disabled={deleteMutation.isPending}
                        >
                          {deleteMutation.isPending ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                            Delete Round
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete{' '}
                            <strong>"{overview.title}"</strong>? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={deleteMutation.isPending}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </>
              )
            ) : null}
          </>
        )}
      </Card>
    </div>
  );
}