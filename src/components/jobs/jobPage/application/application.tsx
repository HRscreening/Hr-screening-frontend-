import { useState, useEffect } from 'react';
import ApplicationsTable from "@/components/jobs/jobPage/application/applicationTable";
import type { ApplicationsResponse, Application } from '@/types/applicationTypes';
// import applicationData from '@/assets/test.json';
import axios from "@/axiosConfig"
import { Separator } from "@/components/ui/separator";
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';



function Applications({ job_id,rubric_version }: { job_id: string, rubric_version: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [currentData, setCurrentData] = useState<ApplicationsResponse | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState<'all_candidates' | 'shortlisted' | 'rejected'>('all_candidates');
  const [pageSize, setPageSize] = useState(20);


  // async function getApplicationData() {
  //   try {

  //     // Simulate an API call to fetch application data
  //     setIsLoading(true);
  //     setTimeout(() => {
  //       setCurrentData(applicationData as ApplicationsResponse);
  //       setIsLoading(false);
  //     }, 800);

  //   } catch (error) {
  //     console.error('Error loading application data:', error);

  //   }
  // }

  // TODOO: add rubric version as query param once backend supports fetching applications based on rubric version. This will be used to show different applications based on the rubric version selected in the dashboard.
  
  
  async function getApplicationData(
    jobId: string,
    page: number,
    pageSize: number
  ) {
    try {
      setIsLoading(true);

      //TODO: fliter query param to be added once backend supports filtering applications based on status and other params.
      const response = await axios.get(
        `jobs/get-applications/${jobId}`,
        {
          params: {
            page,
            page_size: pageSize,
          },
          withCredentials: true,
        }
      );
      console.log(rubric_version)
      setCurrentData(response.data as ApplicationsResponse);
    } catch (error) {
      console.error("Error loading application data:", error);
    } finally {
      setIsLoading(false);
    }
  }



  useEffect(() => {
    if (!job_id) return;

    getApplicationData(job_id, page, pageSize);
  }, [job_id, page, pageSize]);


  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1);
  };

  const handleViewDetails = (application: Application) => {
    // Handle viewing application details
    // This could open a modal, navigate to a detail page, etc.
    console.log('View details for:', application);
  };

  const tabs: {
    label: string;
    value: 'all_candidates' | 'shortlisted' | 'rejected';
  }[] = [
      { label: 'All Candidates', value: 'all_candidates' },
      { label: 'Shortlisted', value: 'shortlisted' },
      { label: 'Rejected', value: 'rejected' },
    ]

  return (
    <div className="space-y-4 my-2 flex flex-col">

      <div className='flex flex-row items-center justify-between'>
        <div className='flex flex-row gap-5 items-center justify-items-start'>
          {
            tabs.map((tab) => (
              <span
                className={`${activeTab === tab.value ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} cursor-pointer inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                onClick={() => setActiveTab(tab.value)}
              >{tab.label}</span>
            ))
          }
        </div>
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
};

export default Applications;



//  failed_files_names: [
//       {
//         name: "resume1.pdf",
//         reason: "File format not supported",
//       },
//       {
//         name: "resume2.pdf",
//         reason: "File size exceeds limit",
//       },
//       {
//         name: "resume3.pdf",
//         reason: "Corrupted file",
//       },
//       {
//         name: "resume4.pdf",
//       },
//       {
//         name: "resume5.pdf",
//         reason: "Invalid content",
//       },
//       {
//         name: "resume2.pdf",
//         reason: "File size exceeds limit",
//       },
//       {
//         name: "resume3.pdf",
//         reason: "Corrupted file",
//       },
//       {
//         name: "resume4.pdf",
//       },
//       {
//         name: "resume5.pdf",
//         reason: "Invalid content",
//       },
//     ],