import React, { useState, useEffect} from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft,
  Briefcase,
  XCircle,
  Share2,
  RefreshCcw,
  ListCheck,
  TargetIcon,
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
import RubricManager from "@/components/jobs/jobPage/buttons/rubricManager"
import TotalApplicationCard from '@/components/jobs/cards/totalApplicationCard';
import AnalyticsCard from '@/components/jobs/cards/analyticsCard';
import Applications from '@/components/jobs/jobPage/application/application';
import Loader from '@/components/loader';
import type { JobOverviewResponse, RubricVersionData } from '@/types/jobTypes';


const application_stats = {
  totalApplications: 100,
  applied: 60,
  shortlisted: 15,
  rejected: 10,
  interviewed: 10,
  hired: 5,
}

const JobOverview: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const [jobData, setJobData] = useState<JobOverviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [versionData, setVersionData] = useState<RubricVersionData | null>(null);
  // TODO:Pass this version to applications and criterias component to fetch data based on version
  const [activeVersion, setActiveVersion] = useState<string>("");



  // Fetch job data
  useEffect(() => {
    const fetchJobData = async () => {
      try {
        setIsLoading(true);
        const res = await axios.get(`/jobs/get-job/${jobId}`);

        if (res.status === 200) {
          setJobData(res.data);
          if (res.data?.criteria?.version) {
            setActiveVersion(`v${res.data.criteria.version}`);
          }
          return;
        }

        // console.log("Using mock data for job overview",res.data);

        // setJobData(mockData);
      } catch (error) {
        console.error('Error fetching job data:', error);
        toast.error('Failed to load job data');
      } finally {
        setIsLoading(false);
      }
    };

    const fetchRubricVersions = async () => {
      try {
        const res = await axios.get(`/jobs/${jobId}/rubrics/versions`);
        const payload = res.data;
        const versions = (payload?.versions ?? []).map((v: any) => ({
          rubric_id: String(v.rubric_id),
          rubric_version: `v${v.version}`,
          created_at: v.created_at ? String(v.created_at) : "",
          is_active: v.is_active ?? false,
        }));
        const active = (payload?.versions ?? []).find((v: any) => v.is_active) ?? null;
        const mapped: RubricVersionData = {
          current_active_version: active ? `v${active.version}` : (versions[0]?.rubric_version ?? "v1"),
          active_rubric_id: payload?.active_rubric_id ? String(payload.active_rubric_id) : "",
          versions,
        };
        setVersionData(mapped);
        if (!activeVersion) {
          setActiveVersion(mapped.current_active_version);
        }
      } catch (e) {
        // Non-fatal: keep UI usable even if versions endpoint isn't available
        console.warn("Failed to fetch rubric versions", e);
      }
    };

    if (jobId) {
      fetchJobData();
      fetchRubricVersions();
    }
  }, [jobId]); // eslint-disable-line react-hooks/exhaustive-deps



  if (isLoading) {
    return <Loader />
  }

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


  const handleVersionChange = async (version: string) => {
    try {
      setActiveVersion(version);
      const found = versionData?.versions.find((v) => v.rubric_version === version);
      if (!found || !jobId) return;

      await axios.post(`/jobs/${jobId}/rubrics/${found.rubric_id}/activate`);

      // Refresh job + versions so UI reflects the new active rubric
      const [jobRes, versionsRes] = await Promise.all([
        axios.get(`/jobs/get-job/${jobId}`),
        axios.get(`/jobs/${jobId}/rubrics/versions`),
      ]);
      if (jobRes.status === 200) {
        setJobData(jobRes.data);
      }
      const payload = versionsRes.data;
      const versions = (payload?.versions ?? []).map((v: any) => ({
        rubric_id: String(v.rubric_id),
        rubric_version: `v${v.version}`,
        created_at: v.created_at ? String(v.created_at) : "",
      }));
      const active = (payload?.versions ?? []).find((v: any) => v.is_active) ?? null;
      setVersionData({
        current_active_version: active ? `v${active.version}` : (versions[0]?.rubric_version ?? "v1"),
        active_rubric_id: payload?.active_rubric_id ? String(payload.active_rubric_id) : "",
        versions,
      });
      toast.success(`Activated rubric ${version}`);
    } catch (e) {
      console.error("Failed to activate rubric version", e);
      toast.error("Failed to switch rubric version");
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

        <div id='button group' className='flex flex-row gap-4'>
          {/* <Button className="bg-gray-300/50 cursor-pointer text-black px-4 py-2 rounded-lg hover:bg-hover-primary transition">
            <Share className="w-5 h-5 inline" />
            Share
          </Button> */}
          <Tooltip >
            <TooltipTrigger>

              <Button className="bg-primary cursor-pointer text-primary-foreground px-3 py-2 rounded-lg hover:bg-hover-primary transition">
                <Share2 className="w-4 h-4 inline" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Share</p>
            </TooltipContent>
          </Tooltip>
          <TrackCandidateDialog batch_id={jobId as string} />  {/* TODO: pass Batch_id instead of job_id*/}
          <AddCandidatePopup job_id={jobId as string} />

          {/* <Button className="bg-green-600 cursor-pointer text-primary-foreground px-4 py-2 rounded-lg hover:bg-hover-primary transition">
            <Sparkle className="w-5 h-5 inline" />
            Rerank AI
          </Button> */}
          <Tooltip >
            <TooltipTrigger>
              <Button
                className="bg-primary cursor-pointer text-primary-foreground px-3 py-2 rounded-lg hover:bg-hover-primary transition"
                onClick={() => navigate(`/jobs/${jobId}/rubric/edit`)}
              >
                <ListCheck className="w-4 h-4 inline" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Edit rubric</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip >
            <TooltipTrigger>
              <Button className="bg-primary cursor-pointer text-primary-foreground px-3 py-2 rounded-lg hover:bg-hover-primary transition">
                <RefreshCcw className="w-4 h-4 inline" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Rerank Applications</p>
            </TooltipContent>
          </Tooltip>
          <RubricManager
            jobId={jobId as string}
            jobData={jobData}
            versionData={versionData}
            onVersionChange={handleVersionChange}
          />
        </div>
      </div>

      {/* Analytics */}
      <div className='flex flex-wrap gap-4'>
        <TotalApplicationCard data={application_stats} />
        <AnalyticsCard title='Avg. Match Score' value={"76%"} desc='based on skills & exp.' icon={<TargetIcon className='h-5 w-5' />} />
      </div>

      {/* Rubric */}
      <Applications job_id={jobId as string} rubric_version={jobData.criteria?.rubric_id ?? "5488"} />


    </div>
  );
};


export default JobOverview;