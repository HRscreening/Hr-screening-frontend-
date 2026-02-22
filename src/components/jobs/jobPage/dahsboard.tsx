import { Briefcase } from 'lucide-react';
import type { JobOverviewResponse } from '@/types/jobTypes';

interface JobdahsboardProps {
  jobData:JobOverviewResponse | null;
}

const Jobdahsboard = ({jobData}:JobdahsboardProps) => {
  return (
    <div>
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="p-2 rounded-lg bg-primary/10">
          <Briefcase className="w-4 h-4 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-semibold text-foreground truncate">
            {jobData?.job.title || "Job Title"}
          </h1>
        </div>
      </div>
    </div>
  )
}

export default Jobdahsboard
