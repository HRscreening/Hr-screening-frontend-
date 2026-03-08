import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  ChevronDown,
  ChevronUp,
  Video,
  CalendarIcon,
  Link2,
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

import axios from '@/axiosConfig';
import { cn } from '@/lib/utils';

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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
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

import type { RoundOverview, RoundFullConfig, RoundEditValues } from '@/types/roundConfigTypes';
import { roundEditSchema, MODE_OPTIONS, TIMEZONE_OPTIONS } from '@/types/roundConfigTypes';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function DatePicker({
  value,
  onChange,
  placeholder,
  disabled,
}: {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  placeholder: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-full justify-between font-normal h-9 px-3 border-border/60 bg-background hover:bg-muted/30 transition-all duration-200 text-sm',
            !value && 'text-muted-foreground'
          )}
        >
          <span className="flex items-center gap-2">
            <CalendarIcon className="h-3.5 w-3.5 shrink-0 text-primary/60" />
            {value ? format(value, 'PPP') : placeholder}
          </span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
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
          className="rounded-lg p-3 [--cell-size:2.5rem]"
        />
      </PopoverContent>
    </Popover>
  );
}

/** Compact label-value pair for read mode */
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

function SectionLabel({ icon: Icon, children }: { icon?: React.ElementType; children: React.ReactNode }) {
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

function PanelMemberRow({
  memberIndex,
  form,
  onRemove,
  canRemove,
  disabled,
}: {
  memberIndex: number;
  form: ReturnType<typeof useForm<RoundEditValues>>;
  onRemove: () => void;
  canRemove: boolean;
  disabled: boolean;
}) {
  return (
    <div className="group/member grid grid-cols-1 md:grid-cols-[1fr_1.3fr_1fr_32px] gap-2 items-end p-3 rounded-lg bg-background border border-border/40 hover:border-border/60 transition-all duration-200">
      <FormField
        control={form.control}
        name={`panelists.${memberIndex}.name`}
        render={({ field }) => (
          <FormItem className="space-y-1">
            <FormLabel className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Name</FormLabel>
            <FormControl>
              <Input placeholder="Jane Doe" className="h-8 text-sm bg-transparent" disabled={disabled} {...field} />
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
              <Input placeholder="jane@company.com" className="h-8 text-sm bg-transparent" disabled={disabled} {...field} />
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
            <FormLabel className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Role</FormLabel>
            <FormControl>
              <Input placeholder="e.g. Hiring Manager" className="h-8 text-sm bg-transparent" disabled={disabled} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="flex items-end pb-0.5">
        {canRemove && !disabled ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover/member:opacity-100 transition-all duration-200"
            onClick={onRemove}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        ) : (
          <div className="h-8 w-8" />
        )}
      </div>
    </div>
  );
}

// ─── Read-Only Detail View (compact property grid) ────────────────────────────

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
      {/* Primary info — 4 columns on desktop */}
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
          {fullConfig.panel_mode === 'PANEL' ? 'Panel' : 'Sequential'}
        </InfoCell>
        <InfoCell icon={Globe} label="Timezone">
          {fullConfig.timezone ?? 'UTC'}
        </InfoCell>
      </div>

      {/* Schedule + Link — 3 columns in a subtle card */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3 py-3 px-4 rounded-lg bg-muted/20 border border-border/30">
        <InfoCell icon={CalendarIcon} label="Start Date">
          {format(new Date(fullConfig.start_date), 'MMM d, yyyy')}
        </InfoCell>
        <InfoCell icon={CalendarIcon} label="End Date">
          {format(new Date(fullConfig.end_date), 'MMM d, yyyy')}
        </InfoCell>
        <InfoCell icon={Link2} label="Meeting Link" className="col-span-2 md:col-span-1">
          {fullConfig.meet_link ? (
            <a
              href={fullConfig.meet_link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline truncate block text-sm"
            >
              {fullConfig.meet_link.replace(/^https?:\/\//, '').slice(0, 35)}
              {fullConfig.meet_link.replace(/^https?:\/\//, '').length > 35 ? '…' : ''}
            </a>
          ) : (
            <span className="text-muted-foreground text-sm">—</span>
          )}
        </InfoCell>
      </div>

      {/* Two-column: Instructions + Panelists side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Instructions */}
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

        {/* Panelists */}
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
                        {p.name ? p.name.charAt(0).toUpperCase() : p.email.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs font-medium truncate max-w-28">{p.name || p.email.split('@')[0]}</span>
                      {p.role && (
                        <Badge variant="outline" className="text-[9px] font-normal px-1.5 py-0 h-4 shrink-0">
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
      </div>
    </div>
  );
}

// ─── Round Config Card ────────────────────────────────────────────────────────

export default function RoundConfigCard({
  overview,
  jobId,
  onDeleted,
  onUpdated,
}: {
  overview: RoundOverview;
  jobId: string;
  onDeleted: (id: string) => void;
  onUpdated: () => void;
}) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [fullConfig, setFullConfig] = useState<RoundFullConfig | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const modeConfig = MODE_OPTIONS.find((m) => m.value === overview.interview_type);
  const ModeIcon = modeConfig?.icon ?? Video;

  const fetchFullConfig = useCallback(async () => {
    if (fullConfig) return;
    setLoadingDetail(true);
    try {
      const res = await axios.get(`/interview/get-round-config/${overview.round_config_id}`);
      setFullConfig(res.data);
    } catch (err) {
      console.error('Failed to fetch round config', err);
      toast.error('Failed to load round details');
    } finally {
      setLoadingDetail(false);
    }
  }, [jobId, overview.round_config_id, fullConfig]);

  const handleToggle = () => {
    const willExpand = !expanded;
    setExpanded(willExpand);
    if (willExpand) fetchFullConfig();
  };

  // ── Form ──
  const form = useForm<RoundEditValues>({
    resolver: zodResolver(roundEditSchema),
    defaultValues: {
      title: '',
      interview_type: 'Video Call',
      instructions: '',
      duration_minutes: 60,
      panelists: [{ name: '', email: '', role: '' }],
      meet_link: '',
      start_date: new Date(),
      end_date: new Date(),
      timezone: 'UTC',
      panel_mode: 'SEQUENTIAL',
    },
  });

  const { fields: panelFields, append: appendPanel, remove: removePanel } = useFieldArray({
    control: form.control,
    name: 'panelists',
  });

  const enterEditMode = () => {
    if (!fullConfig) return;
    form.reset({
      title: fullConfig.title,
      interview_type: fullConfig.interview_type,
      instructions: fullConfig.instructions ?? '',
      duration_minutes: fullConfig.duration_minutes,
      panelists: fullConfig.panelists.length > 0 ? fullConfig.panelists : [{ name: '', email: '', role: '' }],
      meet_link: fullConfig.meet_link ?? '',
      start_date: new Date(fullConfig.start_date),
      end_date: new Date(fullConfig.end_date),
      timezone: fullConfig.timezone ?? 'UTC',
      panel_mode: fullConfig.panel_mode,
    });
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    form.reset();
  };

  const handleSave = async (values: RoundEditValues) => {
    setSaving(true);
    try {
      await axios.put(`/jobs/${jobId}/interview-rounds/${overview.round_config_id}`, {
        ...values,
        round_number: overview.round_number,
        start_date: values.start_date.toISOString(),
        end_date: values.end_date.toISOString(),
      });
      toast.success('Round updated successfully');
      setEditing(false);
      setFullConfig(null);
      onUpdated();
    } catch (err) {
      console.error('Failed to update round', err);
      toast.error('Failed to update round');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await axios.delete(`/jobs/${jobId}/interview-rounds/${overview.round_config_id}`);
      toast.success('Round deleted');
      onDeleted(overview.round_config_id);
    } catch (err) {
      console.error('Failed to delete round', err);
      toast.error('Failed to delete round');
    } finally {
      setDeleting(false);
    }
  };

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
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <CardHeader
          className="px-4 py-2.5 cursor-pointer select-none hover:bg-muted/20 transition-colors"
          onClick={handleToggle}
        >
          <div className="flex items-center justify-between gap-2">
            {/* Left: title + inline metadata */}
            <div className="flex items-center gap-2 min-w-0 flex-1 flex-wrap">
              <span className="text-sm font-semibold truncate">
                {overview.title || 'Untitled round'}
              </span>
              {modeConfig && (
                <Badge variant="secondary" className={cn('gap-1 text-[10px] font-medium px-1.5 py-0 h-5 border-0 shrink-0', modeConfig.bg, modeConfig.color)}>
                  <ModeIcon className="h-3 w-3" />
                  {modeConfig.label}
                </Badge>
              )}
              <span className="hidden md:inline text-[10px] text-muted-foreground/50">|</span>
              <span className="hidden md:flex items-center gap-1 text-[11px] text-muted-foreground">
                <CalendarIcon className="h-3 w-3 text-primary/40" />
                {format(new Date(overview.start_date), 'MMM d')} – {format(new Date(overview.end_date), 'MMM d')}
              </span>
              <span className="hidden lg:inline text-[10px] text-muted-foreground/50">|</span>
              <span className="hidden lg:flex items-center gap-1 text-[11px] text-muted-foreground">
                <Users className="h-3 w-3 text-primary/40" />
                {overview.panelists_count} panelist{overview.panelists_count !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Right: action icons */}
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
                        navigate(`/interview/book?round_config_id=${overview.round_config_id}`);
                      }}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>View available slots</p></TooltipContent>
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
                  <TooltipContent><p>No slots available</p></TooltipContent>
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
                {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* ── Expanded Content ─────────────────────────────────────────── */}
        {expanded && (
          <>
            {loadingDetail ? (
              <RoundDetailSkeleton />
            ) : fullConfig ? (
              editing ? (
                /* ═══ EDIT MODE — Dense 3-col forms ═══ */
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSave)}>
                    <CardContent className="px-5 py-5 space-y-4 border-t border-border/20">

                      {/* Row 1: Title + Type + Duration (3 cols) */}
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
                                <Input placeholder="e.g. Technical Screen" className="h-9 text-sm bg-transparent" {...field} />
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
                                <Clock className="h-3 w-3" /> Duration (min) <span className="text-primary">*</span>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={1}
                                  placeholder="60"
                                  className="h-9 text-sm bg-transparent"
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : '')}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Row 2: Panel Mode + Start + End (3 cols) */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                                <DatePicker value={field.value} onChange={field.onChange} placeholder="Start date" />
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
                                <DatePicker value={field.value} onChange={field.onChange} placeholder="End date" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Row 3: Timezone + Meeting Link (2 cols) */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="timezone"
                          render={({ field }) => (
                            <FormItem className="space-y-1.5">
                              <FormLabel className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1">
                                <Globe className="h-3 w-3" /> Timezone <span className="text-primary">*</span>
                              </FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Select timezone" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {TIMEZONE_OPTIONS.map((tz) => (
                                    <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="meet_link"
                          render={({ field }) => (
                            <FormItem className="space-y-1.5">
                              <FormLabel className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1">
                                <Link2 className="h-3 w-3" /> Meeting Link
                              </FormLabel>
                              <FormControl>
                                <Input placeholder="https://meet.google.com/..." className="h-9 text-sm bg-transparent" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Row 4: Instructions (full width) */}
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

                      {/* Row 5: Panelists */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <SectionLabel icon={Users}>Panelists</SectionLabel>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => appendPanel({ name: '', email: '', role: '' })}
                            className="h-6 text-[10px] gap-1 px-2 border-dashed hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all"
                          >
                            <UserPlus className="h-3 w-3" />
                            Add
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {panelFields.map((member, memberIndex) => (
                            <PanelMemberRow
                              key={member.id}
                              memberIndex={memberIndex}
                              form={form}
                              onRemove={() => removePanel(memberIndex)}
                              canRemove={panelFields.length > 1}
                              disabled={false}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Action bar */}
                      <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/20">
                        <Button type="button" variant="ghost" size="sm" className="h-8 text-xs" onClick={cancelEdit} disabled={saving}>
                          Cancel
                        </Button>
                        <Button type="submit" size="sm" className="h-8 text-xs gap-1.5" disabled={saving}>
                          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                          {saving ? 'Saving…' : 'Save'}
                        </Button>
                      </div>
                    </CardContent>
                  </form>
                </Form>
              ) : (
                /* ═══ READ MODE — Compact property grid ═══ */
                <>
                  <div className="border-t border-border/20">
                    <ReadOnlyDetail fullConfig={fullConfig} modeConfig={modeConfig} ModeIcon={ModeIcon} />
                  </div>
                  {/* Action bar */}
                  <div className="flex items-center justify-end gap-2 px-5 py-2.5 border-t border-border/20 bg-muted/10">
                    <Button type="button" variant="outline" size="sm" className="h-7 text-xs gap-1.5" onClick={enterEditMode}>
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
                          disabled={deleting}
                        >
                          {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
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
                            Are you sure you want to delete <strong>"{overview.title}"</strong>? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
