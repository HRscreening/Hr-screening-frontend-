// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  LayoutDashboard,
  Users,
  Target,
  Settings,
  ChevronLeft,
  Play,
  Pause,
  Archive,
  XCircle,
  TrendingUp,
  Lock,
} from 'lucide-react';
import { toast } from 'sonner';

import axios from "@/axiosConfig"

import DashboardSection from '@/components/jobs/jobPage/dahsboard';
import Applications from '@/components/jobs/jobPage/application/application';
// NOTE: Archived file; criteria UI not wired in current app.
// import Criterias from '@/components/jobs/jobPage/criterias';
import Loader from '@/components/loader';
// import AddCandidate from '@/components/jobs/jobPage/addCandidatePopUp';
// Types
import type { JobStatus, JobOverviewResponse, } from '@/types/jobTypes';



const JobOverview: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [jobData, setJobData] = useState<JobOverviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

        if(res.status === 200){
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

  const getStatusConfig = (status: JobStatus) => {
    const configs = {
      open: {
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-900',
        icon: <Play className="w-3 h-3" />,
        label: 'OPEN',
      },
      paused: {
        color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-900',
        icon: <Pause className="w-3 h-3" />,
        label: 'PAUSED',
      },
      closed: {
        color: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-950/50 dark:text-slate-400 dark:border-slate-900',
        icon: <XCircle className="w-3 h-3" />,
        label: 'CLOSED',
      },
      archived: {
        color: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-900',
        icon: <Archive className="w-3 h-3" />,
        label: 'ARCHIVED',
      },
    };
    return configs[status];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/20 border-t-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
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

  if(isLoading){
    return <Loader />
  }

  const statusConfig = getStatusConfig(jobData.job.status);

  return (
    <div className="min-h-screen bg-background">

      {/* Main Content Area - Maximum Space */}
      <div className="container mx-auto px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Clean Minimal Tabs */}
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="dashboard" className="gap-2 text-sm">
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="applications" className="gap-2 text-sm">
              <Users className="w-4 h-4" />
              Applications
              {/* {jobData.dashboard.total_applications > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-xs">
                  {jobData.dashboard.total_applications}
                </Badge>
              )} */}
            </TabsTrigger>
            <TabsTrigger value="criteria" className="gap-2 text-sm">
              <Target className="w-4 h-4" />
              Criteria
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2 text-sm">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Content Sections - Full Space Available */}
          <TabsContent value="dashboard" className="mt-0">
            <DashboardSection jobData={jobData} />
            {/* <div className="text-center py-20">
              Dashboard content coming soon! 🚀
              </div> */}
          </TabsContent>

          <TabsContent value="applications" className="mt-0">
            
            <Applications job_id={jobId as string}/>
          </TabsContent>

          <TabsContent value="criteria" className="mt-0">
            {/* <Criterias criterias={jobData.criteria} onUpdate={()=>{}} /> */}
          </TabsContent>

          <TabsContent value="settings" className="mt-0">
            <SettingsPlaceholder data={jobData} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};


const SettingsPlaceholder: React.FC<{ data: JobOverviewResponse }> = ({ data }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Job Settings</CardTitle>
        <CardDescription>Configure job preferences and features</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <TrendingUp className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Voice AI Screening</p>
                <p className="text-xs text-muted-foreground">Automated interviews</p>
              </div>
            </div>
            <Badge variant={data.settings.voice_ai_enabled ? 'default' : 'secondary'}>
              {data.settings.voice_ai_enabled ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>
          
          <Separator />
          
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Users className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Manual Rounds</p>
                <p className="text-xs text-muted-foreground">Interview rounds</p>
              </div>
            </div>
            <span className="text-lg font-semibold">{data.settings.manual_rounds_count}</span>
          </div>
          
          <Separator />
          
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Lock className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Confidential Job</p>
                <p className="text-xs text-muted-foreground">Hidden from public</p>
              </div>
            </div>
            <Badge variant={data.settings.is_confidential ? 'default' : 'secondary'}>
              {data.settings.is_confidential ? 'Yes' : 'No'}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default JobOverview;