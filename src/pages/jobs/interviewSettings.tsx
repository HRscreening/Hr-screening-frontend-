import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronLeft,
  XCircle,
} from "lucide-react";

import type { SettingsType } from "../../types/jobSettingsTypes"
import JobSettingsDetailedEditor from "@/components/jobs/jobSettings/JobSettingsDetailedEditor";
import { useInterviewSettings} from "@/hooks/job_hooks/settings/useInterviewSettings";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { useAuthStore } from "@/store/authStore";
/* ─────────────────── helpers ─────────────────── */

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
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuthStore()
  const { data, isLoading, refetch, isError } = useInterviewSettings(jobId);

  if (!jobId) return null;

  if (isLoading) return <SettingsSkeleton />;

  const handleRefresh = () => {
    refetch();
    queryClient.invalidateQueries({
      queryKey: [
        queryKeys.jobSettings(jobId!),
        queryKeys.job(jobId!,user?.id || ""),
        queryKeys.jobs,
      ],
    });
  };
  console.log('Interview Settings data:', data);

  if (!data || isError) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-sm shadow-md">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-2 p-2.5 rounded-xl bg-red-50 dark:bg-red-950/30 w-fit">
              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle className="text-base">Not Found</CardTitle>
            <CardDescription className="text-xs">
              Could not load Interview Settings.
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
    <div className="w-full mx-auto space-y-4">
        {data &&
          <JobSettingsDetailedEditor
            jobId={jobId!}
            settings={data as SettingsType}
            onRefresh={handleRefresh}
          />
        }
    </div>
  );
};

export default JobSettingsPage;
