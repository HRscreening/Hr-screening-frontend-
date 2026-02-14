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
import RubricVersionSwitcher from "@/components/jobs/jobPage/buttons/rubricVersionButton"
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

const version_data: RubricVersionData = {
  current_active_version: "v1",
  active_rubric_id: "5488",
  versions: [
    { rubric_version: "v1", created_at: "2024-08-01", rubric_id: "5488" },
    { rubric_version: "v2", created_at: "2024-08-01", rubric_id: "5487" },
    { rubric_version: "v2", created_at: "2024-08-01", rubric_id: "5486" },
    { rubric_version: "v2", created_at: "2024-08-01", rubric_id: "5485" },
    { rubric_version: "v2", created_at: "2024-08-01", rubric_id: "5484" },
    { rubric_version: "v2", created_at: "2024-08-01", rubric_id: "5483" },
  ]
}


const JobOverview: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const [jobData, setJobData] = useState<JobOverviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);


  // TODO:Pass this version to applications and criterias component to fetch data based on version
  const [activeVersion, setActiveVersion] = useState(version_data.current_active_version);



  // Fetch job data
  useEffect(() => {
    const fetchJobData = async () => {
      try {
        setIsLoading(true);
        // Replace with your actual API call
        // const response = await fetch(`/api/jobs/${jobId}`);
        // const data = await response.json();
        // setJobData(data);

        // Mock data
        // const mockData: JobOverviewResponse = {
        //   job: {
        //     id: jobId || '',
        //     title: 'Senior Software Engineer',
        //     status: 'open',
        //     target_headcount: 5,
        //   },
        //   dashboard: {
        //     total_applications: 42,
        //     by_status: {
        //       APPLIED: 15,
        //       SHORTLISTED: 12,
        //       REJECTED: 10,
        //       HIRED: 3,
        //       WITHDRAWN: 2,
        //     },
        //   },
        //   criteria: {
        //     rubric_id: 'rubric-123',
        //     version: 1,
        //     threshold_score: 70,
        //     criteria: {
        //       mandatory_criteria: {
        //         "experience": { weight: 50, value: "5+ years" },
        //         "skills": { weight: 50, value: "JavaScript, React" },
        //       },
        //       screening_criteria: {
        //         "culture_fit": { weight: 30 },
        //       }
        //     }
        //   },
        //   settings: {
        //     voice_ai_enabled: true,
        //     manual_rounds_count: 3,
        //     is_confidential: false,
        //     job_metadata: null,
        //     closing_reason: null,
        //   },
        // };

        const res = await axios.get(`/jobs/get-job/${jobId}`);

        if (res.status === 200) {
          setJobData(res.data);
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

    if (jobId) {
      fetchJobData();
    }
  }, [jobId]);



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


  const handleVersionChange = (version: string) => {
    setActiveVersion(version);
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
              <Button className="bg-primary cursor-pointer text-primary-foreground px-3 py-2 rounded-lg hover:bg-hover-primary transition">
                <ListCheck className="w-4 h-4 inline" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Manage Criterias</p>
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
          <RubricVersionSwitcher activeVersion={activeVersion} handleVersionChange={handleVersionChange} versionData={version_data} />
        </div>
      </div>

      {/* Analytics */}
      <div className='flex flex-wrap gap-4'>
        <TotalApplicationCard data={application_stats} />
        <AnalyticsCard title='Avg. Match Score' value={"76%"} desc='based on skills & exp.' icon={<TargetIcon className='h-5 w-5' />} />
      </div>


      <Applications job_id={jobId as string} rubric_version='5488' />


    </div>
  );
};


export default JobOverview;