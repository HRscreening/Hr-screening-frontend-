import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  ChevronLeft,
  Briefcase,
  XCircle,
  Share2,
  RefreshCcw,
  ListCheck,
  Settings,
  TargetIcon,
  FileText,
  Copy,
  ExternalLink,
  Link2,
} from 'lucide-react';
import { toast } from 'sonner';
import AddCandidatePopup from "@/components/jobs/jobPage/buttons/addCandidatePopUp";
import TrackCandidateDialog from "@/components/jobs/jobPage/buttons/resumeProcessingTracker";
import axios from "@/axiosConfig"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import RubricVersionSwitcher from "@/components/jobs/jobPage/buttons/rubricVersionButton"
import TotalApplicationCard from '@/components/jobs/cards/totalApplicationCard';
import AnalyticsCard from '@/components/jobs/cards/analyticsCard';
import Applications from '@/components/jobs/jobPage/application/application';
import Loader from '@/components/loader';
import JDSection from '@/components/jobs/jobPage/jdSection/JDSection';
import { useJob, useJobRubric, usePublicLink } from '@/hooks/job_hooks/useJob';
import { queryClient } from '@/lib/react-query-client';

const JobOverview: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();

  if (!jobId) return null;

  const { data: jobData, isLoading: jobLoading } = useJob(jobId);
  const { data: rubricData, isLoading: rubricLoading } = useJobRubric(jobId);
  const { data: publicLinkData, isLoading: linkLoading } = usePublicLink(jobId);

  const [activeBatchId, setActiveBatchId] = useState<string>("");
  const [trackerOpen, setTrackerOpen] = useState(false);
  const [jdSheetOpen, setJdSheetOpen] = useState(false);

  const [activeVersion, setActiveVersion] = useState<string>("");

  const handleBatchStarted = useCallback((batchId: string) => {
    setActiveBatchId(batchId);
    setTrackerOpen(true);
  }, []);

  useEffect(() => {
    if (jobData?.job?.current_batch_id && !activeBatchId) {
      setActiveBatchId(jobData.job.current_batch_id);
    }
  }, [jobData, activeBatchId]);

  useEffect(() => {
    if (rubricData?.current_active_version && !activeVersion) {
      setActiveVersion(rubricData.current_active_version);
    }
  }, [rubricData, activeVersion]);

  if (jobLoading || rubricLoading || linkLoading) return <Loader />;

  if (!jobData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 p-3 rounded-full bg-red-50 dark:bg-red-950/30 w-fit">
              <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle>Job Not Found</CardTitle>
            <CardDescription>The job you're looking for doesn't exist.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/jobs')} className="w-full">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Jobs
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const dashboard = jobData.dashboard ?? { total_applications: 0, by_status: {}, avg_score: 0 };

  const handleVersionChange = async (version: string) => {
    try {
      setActiveVersion(version);
      const found = rubricData?.versions.find((v: any) => v.rubric_version === version);
      if (!found || !jobId) return;

      await axios.post(`/jobs/${jobId}/rubrics/${found.rubric_id}/activate`);
      toast.success(`Activated rubric ${version}`);
    } catch (e) {
      console.error("Failed to activate rubric version", e);
      toast.error("Failed to switch rubric version");
    }
  };

  const handleCopyLink = () => {
    if (publicLinkData?.public_url) {
      navigator.clipboard.writeText(publicLinkData.public_url);
      toast.success('Link copied to clipboard');
    }
  };

  return (
    <div className="min-h-screen bg-background">

      {/* Header */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="p-2 rounded-lg bg-primary/10">
          <Briefcase className="w-4 h-4 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-bold text-foreground truncate">
            {jobData?.job.title || "Job Title"}
          </h1>
        </div>

        <div className="flex flex-row gap-2.5 items-center">
          <Tooltip>
            <TooltipTrigger onClick={() => navigate(`/jobs/${jobId}/settings`)}>
              <div className="bg-primary cursor-pointer text-primary-foreground px-3 py-2 rounded-lg hover:bg-hover-primary transition">
                <Settings className="w-4 h-4 inline" />
              </div>
            </TooltipTrigger>
            <TooltipContent><p>Settings</p></TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger>
              <div className="bg-primary cursor-pointer text-primary-foreground px-3 py-2 rounded-lg hover:bg-hover-primary transition">
                <Share2 className="w-4 h-4 inline" />
              </div>
            </TooltipTrigger>
            <TooltipContent><p>Share</p></TooltipContent>
          </Tooltip>

          <TrackCandidateDialog
            batch_id={activeBatchId || (jobData.job.current_batch_id ?? "") as string}
            job_id={jobId as string}
            externalOpen={trackerOpen}
            onOpenChange={setTrackerOpen}
            onComplete={() => queryClient.invalidateQueries({ queryKey: ['applications', jobId] })}
          />
          <AddCandidatePopup job_id={jobId as string} onBatchStarted={handleBatchStarted} />

          <Tooltip>
            <TooltipTrigger>
              <div
                className="bg-primary cursor-pointer text-primary-foreground px-3 py-2 rounded-lg hover:bg-hover-primary transition"
                onClick={() => navigate(`/jobs/${jobId}/rubric/edit`)}
              >
                <ListCheck className="w-4 h-4 inline" />
              </div>
            </TooltipTrigger>
            <TooltipContent><p>Edit rubric</p></TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger>
              <Button className="bg-primary cursor-pointer text-primary-foreground px-3 py-2 rounded-lg hover:bg-hover-primary transition">
                <RefreshCcw className="w-4 h-4 inline" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Rerank Applications</p></TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger onClick={() => setJdSheetOpen(true)}>
              <div className="bg-primary cursor-pointer text-primary-foreground px-3 py-2 rounded-lg hover:bg-hover-primary transition">
                <FileText className="w-4 h-4 inline" />
              </div>
            </TooltipTrigger>
            <TooltipContent><p>JD & Apply Link</p></TooltipContent>
          </Tooltip>

          <RubricVersionSwitcher
            activeVersion={activeVersion}
            handleVersionChange={handleVersionChange}
            versionData={rubricData}
          />
        </div>
      </div>

      {/* Public apply link bar — shown whenever a link is active */}
      {publicLinkData?.public_apply_enabled && publicLinkData.public_url && (
        <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg border border-green-500/30 bg-green-50/40 dark:bg-green-900/10">
          <Link2 className="w-3.5 h-3.5 text-green-600 shrink-0" />
          <span className="text-xs text-muted-foreground">Public apply link:</span>
          <span className="text-xs font-mono text-green-700 dark:text-green-400 truncate flex-1 min-w-0">
            {publicLinkData.public_url}
          </span>
          <Button variant="ghost" size="sm" className="h-7 px-2" onClick={handleCopyLink}>
            <Copy className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2"
            onClick={() => window.open(publicLinkData.public_url!, '_blank')}
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}

      {/* Analytics */}
      <div className="flex flex-wrap gap-4 mt-4">
        <TotalApplicationCard data={dashboard as any} />
        <AnalyticsCard
          title="Avg. Match Score"
          value={`${Math.round((dashboard as any).avg_score ?? 0)}%`}
          desc="based on skills & exp."
          icon={<TargetIcon className="h-5 w-5" />}
        />
      </div>

      {/* Applications table */}
      <Applications jobId={jobId}/>

      {/* JD & Apply Sheet */}
      <Sheet open={jdSheetOpen} onOpenChange={setJdSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>JD & Apply Link</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <JDSection onLinkChange={() => {}} />
          </div>
        </SheetContent>
      </Sheet>

    </div>
  );
};

export default JobOverview;
