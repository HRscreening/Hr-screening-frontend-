// List all jobs 

import { useState, useEffect } from 'react'
import axios from '@/axiosConfig'
import { useNavigate } from 'react-router-dom'
import type { JobCardType } from '@/types/types';
import { toast } from "sonner"
import JobCard from '@/components/jobs/jobCard';
import { Plus, Briefcase, Loader2, RefreshCw } from 'lucide-react';
import { Button } from "@/components/ui/button";

const Job = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<JobCardType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchJobs() {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get("/jobs/get-jobs");

      if (res.status !== 200) {
        const errorMsg = "Failed to fetch jobs, try again later";
        toast.error(errorMsg);
        setError(errorMsg);
        return;
      }

      // Transform backend data to match frontend type
      const transformedJobs: JobCardType[] = res.data.jobs.map((job: any) => ({
        id: job.id,
        title: job.title,
        status: job.status,
        location: job.location,
        created_at: job.created_at,
        jd_url: job.jd_url,
        head_count: job.target_headcount
      }));

      setJobs(transformedJobs);

    } catch (error) {
      console.error("Error fetching jobs:", error);
      const errorMsg = "Failed to fetch jobs, try again later";
      toast.error(errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchJobs()
  }, []);

  const handleCreateNew = () => {
    navigate('/create-job');
  };

  const handleJobClick = (jobId: string) => {
    navigate(`/jobs/${jobId}`);
  };

  // Loading State
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Loading jobs...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center max-w-md">
          <div className="bg-destructive/10 rounded-full p-6 mb-4 inline-block">
            <Briefcase className="w-10 h-10 text-destructive" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Failed to Load Jobs
          </h3>
          <p className="text-sm text-muted-foreground mb-6">{error}</p>
          <button
            onClick={fetchJobs}
            className="bg-primary text-primary-foreground px-5 py-2.5 rounded-lg hover:opacity-90 transition inline-flex items-center gap-2 text-sm font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Empty State
  if (jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="bg-muted/30 rounded-full p-6 mb-4">
          <Briefcase className="w-10 h-10 text-muted-foreground" />
        </div>

        <h3 className="text-xl font-semibold text-foreground mb-2">
          No jobs available yet
        </h3>

        <p className="text-sm text-muted-foreground text-center mb-6 max-w-md">
          Get started by creating your first job listing and begin finding the perfect candidates
        </p>

        <button
          onClick={handleCreateNew}
          className="bg-primary text-primary-foreground px-5 py-2.5 rounded-lg font-medium hover:opacity-90 transition-all transform hover:scale-105 inline-flex items-center gap-2 shadow-lg"
        >
          <Plus className="w-4 h-4" />
          Create New Job
        </button>
      </div>
    );
  }

  // Jobs Grid - Main Content
  return (
    <div className='p-2'>
      {/* Header */}
      <div className='flex flex-row w-full justify-between bg-card p-4 mb-4 border rounded-lg items-center'>
        <div>
          <h2 className="text-2xl font-bold mb-1">Job Listings</h2>
          <p className="text-sm text-muted-foreground">
            Manage and review all your job postings here.
          </p>
        </div>

        <Button className="bg-primary cursor-pointer text-background px-4 py-1 rounded-lg hover:bg-hover-primary transition text-sm"
          onClick={handleCreateNew}
        >
          <Plus className="w-2 h-2 mr-2 inline" />
          Add New Job
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {jobs.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            onClick={() => handleJobClick(job.id)}
          />
        ))}
      </div>
    </div>
  );
}

export default Job