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
import ApplicationRow from "@/components/jobs/jobPage/applicantRow";
import type { Application, ApplicationsResponse } from '@/types/applicationTypes';

interface ApplicationsTableProps {
  data?: ApplicationsResponse;
  isLoading?: boolean;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onViewDetails?: (application: Application) => void;
}

const TableRowSkeleton = () => (
  <TableRow>
    <TableCell>
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
      </div>
    </TableCell>
    <TableCell>
      <div className="flex items-center gap-2">
        <Skeleton className="h-2 w-28 rounded-full" />
        <Skeleton className="h-4 w-12" />
      </div>
    </TableCell>
    <TableCell>
      <Skeleton className="h-6 w-24 rounded-full" />
    </TableCell>
    <TableCell className="text-right">
      <Skeleton className="h-8 w-20 ml-auto" />
    </TableCell>
  </TableRow>
);

const ApplicationsTable: React.FC<ApplicationsTableProps> = ({
  data,
  isLoading = false,
  onPageChange,
  onPageSizeChange,
  onViewDetails,
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
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Candidate</TableHead>
              <TableHead>Match Score</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
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
                  onViewDetails={onViewDetails || (() => {})}
                />
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
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