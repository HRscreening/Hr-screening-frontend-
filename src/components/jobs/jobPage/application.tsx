import { useState, useEffect } from 'react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ApplicationsTable from "@/components/jobs/jobPage/applicationTable";
import type { ApplicationsResponse, Application } from '@/types/applicationTypes';
// import applicationData from '@/assets/test.json';
import axios from "@/axiosConfig"
import AddCandidatePopup from "@/components/jobs/jobPage/addCandidatePopUp";



function Applications({ job_id }: { job_id: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [currentData, setCurrentData] = useState<ApplicationsResponse | undefined>(undefined);
  const [page, setPage] = useState(1);
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


  async function getApplicationData(
    jobId: string,
    page: number,
    pageSize: number
  ) {
    try {
      setIsLoading(true);

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

  return (
    <div className="space-y-4 ">
      <Card className="border-0 shadow-none flex flex-row justify-between items-center">
        <CardHeader className="px-0 pt-0">
          <CardTitle>Applications</CardTitle>
          <CardDescription>
            Manage and review candidate applications
          </CardDescription>
        </CardHeader>

        <AddCandidatePopup job_id={job_id} />
      </Card>

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