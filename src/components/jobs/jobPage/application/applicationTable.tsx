import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ApplicationRow from "@/components/jobs/jobPage/application/applicantRow";
import ScoreAllButton from "@/components/jobs/jobPage/buttons/scoreAllButton";
import type { Application, ApplicationsResponse } from '@/types/applicationTypes';

interface ApplicationsTableProps {
  data?: ApplicationsResponse;
  isLoading?: boolean;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onViewDetails?: (application: Application) => void;
  onApplicationDeleted?: () => void;
  jobId?: string;
  isProcessing?: boolean;
  onScoreAllSuccess?: () => void;
}
const TableRowSkeleton = () => (
  <TableRow>
    {/* Candidate */}
    <TableCell>
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
      </div>
    </TableCell>

    {/* Current Role */}
    <TableCell>
      <Skeleton className="h-4 w-28" />
    </TableCell>

    {/* Match */}
    <TableCell>
      <div className="flex items-center gap-2">
        <Skeleton className="h-2 w-28 rounded-full" />
        <Skeleton className="h-4 w-10" />
      </div>
    </TableCell>

    {/* Status */}
    <TableCell>
      <Skeleton className="h-6 w-20 rounded-full" />
    </TableCell>

    {/* Sub-Status ✅ added */}
    <TableCell>
      <Skeleton className="h-4 w-24" />
    </TableCell>

    {/* Actions ✅ fixed alignment */}
    <TableCell className="text-right">
      <div className="flex justify-end gap-2">
        <Skeleton className="h-8 w-8 rounded-md" />
        <Skeleton className="h-8 w-8 rounded-md" />
      </div>
    </TableCell>
  </TableRow>
);

const ApplicationsTable: React.FC<ApplicationsTableProps> = ({
  data,
  isLoading = false,
  onPageChange,
  onPageSizeChange,
  onViewDetails,
  onApplicationDeleted,
  jobId,
  isProcessing: _isProcessing,
  onScoreAllSuccess,
}) => {
  const [pageSize, setPageSize] = useState(data?.pagination.page_size || 15);
  const currentPage = data?.pagination.page || 1;
  const totalPages = data?.pagination.total_pages || 1;
  const total = data?.pagination.total || 0;

  const handlePageSizeChange = (value: string) => {
    const newSize = parseInt(value);
    setPageSize(newSize);
    onPageSizeChange?.(newSize);
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange?.(page);
    }
  };

  const getPageRange = () => {
    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, total);
    return { start, end };
  };

  const { start, end } = getPageRange();

  return (
    <div className="w-full space-y-4">
      {jobId && (
        <div className="flex justify-end">
          <ScoreAllButton jobId={jobId} onSuccess={onScoreAllSuccess} />
        </div>
      )}
      <div className="rounded-md border bg-card px-5">
        <Table >
          <TableHeader >
            <TableRow>
              <TableHead>Candidate</TableHead>
              <TableHead className="w-48">Current Role</TableHead>
              <TableHead className="w-36">Match</TableHead>
              <TableHead className="w-36">Status</TableHead>
              <TableHead className="w-36">Sub-Status</TableHead>
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRowSkeleton key={index} />
              ))
            ) : data?.applications && data.applications.length > 0 ? (
              data.applications.map((application) => (
                <ApplicationRow
                  key={application.id}
                  application={application}
                  onViewDetails={onViewDetails || (() => { })}
                  onApplicationDeleted={onApplicationDeleted}
                  jobId={jobId}
                />
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No applications found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">Rows per page</p>
          <Select
            value={pageSize.toString()}
            onValueChange={handlePageSizeChange}
            disabled={isLoading}
          >
            <SelectTrigger className="h-8 w-17.5">
              <SelectValue placeholder={pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 15, 20, 25, 50].map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex w-25 items-center justify-center text-sm font-medium">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1 || isLoading}
            >
              <span className="sr-only">Go to previous page</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages || isLoading}
            >
              <span className="sr-only">Go to next page</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="text-xs text-muted-foreground">
        Showing <span className="font-medium">{start}</span> to <span className="font-medium">{end}</span> of{' '}
        <span className="font-medium">{total}</span> results
      </div>
    </div>
  );
};

export default ApplicationsTable;