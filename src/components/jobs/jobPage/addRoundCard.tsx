import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  ChevronDown,
  CalendarIcon,
  Link2,
  Clock,
  FileText,
  Globe,
  Users,
  UserPlus,
  Trash2,
  Save,
  Loader2,
  X,
  Plus,
} from 'lucide-react';

import axios from '@/axiosConfig';
import { cn } from '@/lib/utils';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

import type { RoundCreateValues } from '@/types/roundConfigTypes';
import { roundCreateSchema, MODE_OPTIONS, TIMEZONE_OPTIONS } from '@/types/roundConfigTypes';

// ─── DatePicker (same as in roundConfigCard) ──────────────────────────────────

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

// ─── Section Label ────────────────────────────────────────────────────────────

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

// ─── Panelist Row ─────────────────────────────────────────────────────────────

function PanelMemberRow({
  memberIndex,
  form,
  onRemove,
  canRemove,
}: {
  memberIndex: number;
  form: ReturnType<typeof useForm<RoundCreateValues>>;
  onRemove: () => void;
  canRemove: boolean;
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
              <Input placeholder="Jane Doe" className="h-8 text-sm bg-transparent" {...field} />
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
              <Input placeholder="jane@company.com" className="h-8 text-sm bg-transparent" {...field} />
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
              <Input placeholder="e.g. Hiring Manager" className="h-8 text-sm bg-transparent" {...field} />
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

// ─── Add Round Card ───────────────────────────────────────────────────────────

export default function AddRoundCard({
  jobId,
  existingRoundNumbers,
  onCreated,
  onCancel,
}: {
  jobId: string;
  existingRoundNumbers: number[];
  onCreated: () => void;
  onCancel: () => void;
}) {
  const [saving, setSaving] = useState(false);

  const nextRoundNumber = existingRoundNumbers.length > 0
    ? Math.max(...existingRoundNumbers) + 1
    : 1;

  const form = useForm<RoundCreateValues>({
    resolver: zodResolver(roundCreateSchema),
    defaultValues: {
      round_number: nextRoundNumber,
      title: '',
      interview_type: 'Video Call',
      instructions: '',
      duration_minutes: 60,
      panelists: [{ name: '', email: '', role: '' }],
      meet_link: '',
      start_date: new Date(),
      end_date: new Date(),
      timezone: 'Asia/Kolkata',
      panel_mode: 'SEQUENTIAL',
    },
  });

  const { fields: panelFields, append: appendPanel, remove: removePanel } = useFieldArray({
    control: form.control,
    name: 'panelists',
  });

  const handleSave = async (values: RoundCreateValues) => {
    // Frontend duplicate-check
    if (existingRoundNumbers.includes(values.round_number)) {
      toast.error(`Round #${values.round_number} already exists. Choose a different round number.`);
      form.setError('round_number', { message: 'This round number already exists' });
      return;
    }

    setSaving(true);
    try {
      await axios.post('/round/bulk-create-round-configs', {
        job_id: jobId,
        rounds: [
          {
            title: values.title,
            round_number: values.round_number,
            interview_type: values.interview_type,
            instructions: values.instructions || null,
            duration_minutes: values.duration_minutes,
            panelists: values.panelists,
            meet_link: values.meet_link || null,
            start_date: values.start_date.toISOString(),
            end_date: values.end_date.toISOString(),
            timezone: values.timezone,
          },
        ],
      });
      toast.success('Round created successfully');
      onCreated();
    } catch (err: any) {
      console.error('Failed to create round', err);
      const detail = err?.response?.data?.detail || err?.response?.data?.message;
      toast.error(detail ? String(detail) : 'Failed to create round');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative pl-8">
      {/* Timeline connector */}
      <div className="absolute left-0 top-0 bottom-0 flex flex-col items-center pt-3">
        <div className="w-5 h-5 rounded-md bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold z-10 shrink-0 shadow-sm shadow-emerald-500/20">
          <Plus className="h-3 w-3" />
        </div>
        <div className="w-px flex-1 bg-linear-to-b from-emerald-500/25 to-transparent mt-1" />
      </div>

      <Card className="border-2 border-dashed border-emerald-500/40 shadow-sm bg-card overflow-hidden transition-all duration-200 animate-in slide-in-from-top-2 fade-in-0 duration-300">
        {/* Header */}
        <CardHeader className="px-4 py-2.5 bg-emerald-500/5 border-b border-emerald-500/10">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="gap-1 text-[10px] font-medium px-1.5 py-0 h-5 border-0 bg-emerald-500/10 text-emerald-600">
                <Plus className="h-3 w-3" />
                New Round
              </Badge>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-md"
              onClick={onCancel}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardHeader>

        {/* Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSave)}>
            <CardContent className="px-5 py-5 space-y-4">

              {/* Row 1: Round Number + Title + Type + Duration */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="round_number"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                        Round # <span className="text-primary">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          placeholder="1"
                          className="h-9 text-sm bg-transparent"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : '')}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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

              {/* Row 2: Panel Mode + Start + End */}
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

              {/* Row 3: Timezone + Meeting Link */}
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
                    />
                  ))}
                </div>
              </div>

              {/* Action bar */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/20">
                <Button type="button" variant="ghost" size="sm" className="h-8 text-xs" onClick={onCancel} disabled={saving}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700" disabled={saving}>
                  {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                  {saving ? 'Creating…' : 'Create Round'}
                </Button>
              </div>
            </CardContent>
          </form>
        </Form>
      </Card>
    </div>
  );
}
