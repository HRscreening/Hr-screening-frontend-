import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import {
  ChevronLeft,
  Save,
  Pencil,
  X,
  XCircle,
  ArrowRight,
  Ban,
  Settings2,
  Users,
  MapPin,
  DollarSign,
  FileText,
  Target,
  Info,
} from "lucide-react";

import type { JobSettingsResponse, JobSettingsEditValues, } from "../../types/jobSettingsTypes"
import { STATUS_OPTIONS, jobSettingsEditSchema } from "../../types/jobSettingsTypes"
import JobSettingsDetailedEditor from "@/components/jobs/jobSettings/JobSettingsDetailedEditor";
import { useJobSettings } from "@/hooks/job_hooks/settings/useJobSettings";
import { useUpdateJobSettings } from "@/hooks/job_hooks/settings/useUpdateJobSettings";
import { useCloseJob } from "@/hooks/job_hooks/settings/useCloseJob";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
/* ─────────────────── helpers ─────────────────── */

const statusColor: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  open: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
  paused: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
  closed: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
  archived: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

/** Compact read-only display for a single field */
function ReadValue({ children, muted }: { children: React.ReactNode; muted?: boolean }) {
  return (
    <p className={`text-sm ${muted ? "text-muted-foreground" : "text-foreground"}`}>
      {children ?? "—"}
    </p>
  );
}

/* ─────────────── skeleton loader ─────────────── */

const SettingsSkeleton: React.FC = () => (
  <div className="w-full max-w-5xl mx-auto px-6 py-6 space-y-4">
    <Skeleton className="h-7 w-40" />
    <Skeleton className="h-14 w-full rounded-lg" />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Skeleton className="h-48 w-full rounded-lg" />
      <Skeleton className="h-48 w-full rounded-lg" />
    </div>
    <Skeleton className="h-24 w-full rounded-lg" />
  </div>
);

/* ──────────────── main page ──────────────── */

const JobSettingsPage: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const queryClient = useQueryClient()
  if (!jobId) return null

  const navigate = useNavigate();

  const [editing, setEditing] = useState(false);

  const { data, isLoading, refetch, isError } = useJobSettings(jobId);
  const updateMutation = useUpdateJobSettings(jobId ?? '');
  const closeMutation = useCloseJob(jobId ?? '');

  const form = useForm<JobSettingsEditValues>({
    resolver: zodResolver(jobSettingsEditSchema),
    defaultValues: {
      title: "",
      location: null,
      salary: null,
      status: "draft",
      description: null,
      target_headcount: null,
    },
  });

  const resetForm = (payload: JobSettingsResponse) => {
    form.reset({
      title: payload.job_details.title,
      location: payload.job_details.location ?? "",
      salary: payload.job_details.salary ?? "",
      status: payload.job_details.status,
      description: payload.job_details.description ?? "",
      target_headcount: payload.job_details.target_headcount,
      manual_rounds_count: payload.job_details.manual_rounds_count,
      voice_ai_enabled: payload.settings.voice_ai_enabled,
      is_confidential: payload.settings.is_confidential,
    });
  };

  useEffect(() => {
    if (data) {
      resetForm(data);
    }
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = async (values: JobSettingsEditValues) => {
    try {
      if (!jobId) return;
      await updateMutation.mutateAsync(values);
      setEditing(false);
    } catch (error) {
      console.error("Update failed", error);
    }
  };

  const handleCloseApplication = async () => {
    if (!jobId) return;
    try {
      await closeMutation.mutateAsync();
    } catch (err) {
      console.error("Failed to close application", err);
    }
  };

  const handleCancelEdit = () => {
    if (data) resetForm(data);
    setEditing(false);
  };

  const handleRefresh = async () => {
    if (!jobId) return;
    queryClient.invalidateQueries({
  queryKey: queryKeys.jobSettings(jobId),})
  };

  if (isLoading) return <SettingsSkeleton />;



  if (!data || isError) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-sm shadow-md">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-2 p-2.5 rounded-xl bg-red-50 dark:bg-red-950/30 w-fit">
              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle className="text-base">Settings Not Found</CardTitle>
            <CardDescription className="text-xs">
              Could not load settings for this job.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Button
              onClick={() => navigate(`/jobs/${jobId}`)}
              size="sm"
              className="w-full"
            >
              <ChevronLeft className="w-3.5 h-3.5 mr-1.5" />
              Back to Job
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }


  return (
    <div className="w-full mx-auto px-6 py-5 space-y-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => navigate(`/jobs/${jobId}`)}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Settings2 className="w-4 h-4 text-muted-foreground" />
          <h1 className="text-sm font-semibold">Job Settings</h1>
          <Badge
            className={`${statusColor[data.job_details.status] ?? ""} text-[10px] px-2 py-0 h-5 ml-1`}
            variant="secondary"
          >
            {data.job_details.status.charAt(0).toUpperCase() + data.job_details.status.slice(1)}
          </Badge>
        </div>

        <div className="flex items-center gap-1.5">
          {!editing ? (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5"
              onClick={() => setEditing(true)}
            >
              <Pencil className="w-3 h-3" />
              Edit
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={handleCancelEdit}
              >
                <X className="w-3 h-3" />
                Cancel
              </Button>
              <Button
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={form.handleSubmit(onSubmit)}
                disabled={updateMutation.isPending}
              >
                <Save className="w-3 h-3" />
                {updateMutation.isPending ? "Saving…" : "Save"}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ── Quick Action: Manage Rounds (most-used, always visible first) ── */}
      <div
        className="flex items-center justify-between px-4 py-3 rounded-lg border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer group mb-6"
        onClick={() => navigate(`/jobs/${jobId}/settings/rounds`)}
      >
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-md bg-primary/10">
            <Users className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">Interview Rounds</p>
            <p className="text-[11px] text-muted-foreground">Rounds, panels & slot availability</p>
          </div>
        </div>
        <ArrowRight className="w-4 h-4 text-primary/60 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* ── Sectioned Layout: Details then Detailed Settings ── */}
          <div className="space-y-6">
            {/* Row 1: Job Details + Metadata Sidebar */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
              <Card className="border-border/40">
                <CardHeader className="px-5 py-3 border-b border-border/20">
                  <CardTitle className="text-sm font-semibold">Job Details</CardTitle>
                </CardHeader>
                <CardContent className="px-5 py-4 space-y-4">
                  {/* Row 1: Title + Status */}
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_160px] gap-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem className="space-y-1.5">
                          <FormLabel className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                            <FileText className="w-3 h-3" /> Title
                          </FormLabel>
                          {editing ? (
                            <>
                              <FormControl>
                                <Input className="h-9 text-sm" {...field} />
                              </FormControl>
                              <FormMessage />
                            </>
                          ) : (
                            <ReadValue>{field.value}</ReadValue>
                          )}
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem className="space-y-1.5">
                          <FormLabel className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                            <Info className="w-3 h-3" /> Status
                          </FormLabel>
                          {editing ? (
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger className="h-9 text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {STATUS_OPTIONS.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge
                              className={`${statusColor[field.value] ?? ""} text-[10px]`}
                              variant="secondary"
                            >
                              {field.value.charAt(0).toUpperCase() + field.value.slice(1)}
                            </Badge>
                          )}
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Row 2: Location + Salary */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem className="space-y-1.5">
                          <FormLabel className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                            <MapPin className="w-3 h-3" /> Location
                          </FormLabel>
                          {editing ? (
                            <FormControl>
                              <Input
                                className="h-9 text-sm"
                                {...field}
                                value={field.value ?? ""}
                                onChange={(e) => field.onChange(e.target.value || null)}
                                placeholder="e.g. Remote, New York"
                              />
                            </FormControl>
                          ) : (
                            <ReadValue muted>{field.value ?? "—"}</ReadValue>
                          )}
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="salary"
                      render={({ field }) => (
                        <FormItem className="space-y-1.5">
                          <FormLabel className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                            <DollarSign className="w-3 h-3" /> Salary
                          </FormLabel>
                          {editing ? (
                            <FormControl>
                              <Input
                                className="h-9 text-sm"
                                {...field}
                                value={field.value ?? ""}
                                onChange={(e) => field.onChange(e.target.value || null)}
                                placeholder="e.g. 80,000 – 120,000 USD"
                              />
                            </FormControl>
                          ) : (
                            <ReadValue muted>{field.value ?? "—"}</ReadValue>
                          )}
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Row 3: Headcount */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="target_headcount"
                      render={({ field }) => (
                        <FormItem className="space-y-1.5">
                          <FormLabel className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                            <Target className="w-3 h-3" /> Target Headcount
                          </FormLabel>
                          {editing ? (
                            <>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={0}
                                  className="h-9 text-sm"
                                  value={field.value ?? ""}
                                  onChange={(e) => {
                                    const v = e.target.value;
                                    field.onChange(v === "" ? null : parseInt(v, 10));
                                  }}
                                  placeholder="e.g. 5"
                                />
                              </FormControl>
                              <FormMessage />
                            </>
                          ) : (
                            <ReadValue>{field.value ?? "—"}</ReadValue>
                          )}
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Row 4: Description (full width) */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                          <FileText className="w-3 h-3" /> Description
                        </FormLabel>
                        {editing ? (
                          <FormControl>
                            <Textarea
                              className="min-h-20 text-sm resize-y"
                              {...field}
                              value={field.value ?? ""}
                              onChange={(e) => field.onChange(e.target.value || null)}
                              rows={3}
                              placeholder="Job description…"
                            />
                          </FormControl>
                        ) : (
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/10 rounded-md px-3 py-2 border border-border/20 min-h-12">
                            {field.value ?? "—"}
                          </p>
                        )}
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Sidebar Metadata & Danger Zone */}
              <div className="space-y-4">
                {/* Metadata */}
                {(data.job_details.closing_reason || data.job_details.job_metadata) && (
                  <Card className="border-border/40">
                    <CardHeader className="px-4 py-3 border-b border-border/20">
                      <CardTitle className="text-sm font-semibold">Metadata</CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 py-3 space-y-3">
                      {data.job_details.closing_reason && (
                        <div className="flex items-start gap-2">
                          <Ban className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-medium">Closing Reason</p>
                            <p className="text-[11px] text-muted-foreground">{data.job_details.closing_reason}</p>
                          </div>
                        </div>
                      )}
                      {data.job_details.job_metadata && (
                        <div className="space-y-1">
                          <p className="text-xs font-medium flex items-center gap-1.5">
                            <Info className="w-3 h-3 text-muted-foreground" />
                            Job Metadata
                          </p>
                          <pre className="text-[10px] bg-muted rounded-md p-2 overflow-x-auto leading-relaxed">
                            {JSON.stringify(data.job_details.job_metadata, null, 2)}
                          </pre>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Danger Zone */}
                <Card className="border-red-200/60 dark:border-red-900/40">
                  <CardContent className="px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-red-600 dark:text-red-400">Close Application</p>
                        <p className="text-[10px] text-muted-foreground">Stop accepting applicants</p>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm" className="h-7 text-[10px]" disabled={closeMutation.isPending || data.job_details.status === "closed"}>
                            {data.job_details.status === "closed" ? "Closed" : "Close"}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Close Application?</AlertDialogTitle>
                            <AlertDialogDescription>Stop accepting new candidates.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleCloseApplication} className="bg-red-600" disabled={closeMutation.isPending}>Confirm</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

          </div>
        </form>
      </Form>

      {/* Row 2: Detailed Settings (Full Width Grid) */}
      <div className="space-y-4 pt-4 border-t border-border/20">
        <div className="flex items-center gap-2 px-1">
          <Settings2 className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-primary/80">Detailed Configuration</h2>
        </div>
        {data?.settings &&
          <JobSettingsDetailedEditor
            jobId={jobId!}
            settings={data.settings}
            onRefresh={handleRefresh}
          />
        }
      </div>
    </div>
  );
};

export default JobSettingsPage;
