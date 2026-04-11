import { useState } from 'react';
import ApplicationsTable from "@/components/jobs/jobPage/application/applicationTable";
import type { Application } from '@/types/applicationTypes';
import { Separator } from "@/components/ui/separator";
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useJobPageStore } from '@/store/jobPageStore';
import RoundSlotsStatus from "@/components/jobs/jobPage/buttons/roundSlotStatus"
import { useApplications } from '@/hooks/job_hooks/useApplications';

function Applications({ jobId }: { jobId: string }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [activeTab, setActiveTab] = useState<'all_candidates' | 'shortlisted' | 'rejected'>('all_candidates');

  const { jobData } = useJobPageStore();
  const { data: currentData, isLoading } = useApplications(jobId, page, pageSize);

  // TODOO: add rubric version as query param once backend supports fetching applications based on rubric version.
  // TODO: filter query param to be added once backend supports filtering applications based on status and other params.

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1);
  };

  const handleViewDetails = (application: Application) => {
    console.log('View details for:', application);
  };

  const tabs: {
    label: string;
    value: 'all_candidates' | 'shortlisted' | 'rejected';
  }[] = [
    { label: 'All Candidates', value: 'all_candidates' },
    { label: 'Shortlisted', value: 'shortlisted' },
    { label: 'Rejected', value: 'rejected' },
  ];

  return (
    <div className="space-y-4 my-2 flex flex-col">
      <div className='flex flex-row items-center justify-between'>
        <div className='flex flex-row gap-5 items-center justify-items-start'>
          {tabs.map((tab) => (
            <span
              key={tab.value}
              className={`${activeTab === tab.value ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} cursor-pointer inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              onClick={() => setActiveTab(tab.value)}
            >{tab.label}</span>
          ))}
        </div>
        <div className='flex flex-row gap-4 items-center justify-items-end'>
          <RoundSlotsStatus roundSlots={jobData && jobData.round_slots} />
          <div className="relative w-65 max-w-sm">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={18}
            />
            <Input
              placeholder="Search..."
              className="pl-9 bg-primary/10 border-none rounded-lg shadow-accent focus-visible:ring-1"
            />
          </div>
        </div>
      </div>

      <Separator />
      <ApplicationsTable
        data={currentData}
        isLoading={isLoading}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onViewDetails={handleViewDetails}
      />
    </div>
  );
}

export default Applications;
