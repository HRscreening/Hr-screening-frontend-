import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  AlertCircle,
  Monitor,
  Loader2,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import axios from "@/axiosConfig";

type UploadData = {
  total_files: number;
  processed_files: number;
  failed_files: number;
  status: string;
  created_at: string;
  failed_files_names?: {
    name: string;
    reason?: string;
  }[];
};

// for testing without backend
const  failed_files_names = [
      {
        name: "resume1.pdf",
        reason: "File format not supported",
      },
      {
        name: "resume2.pdf",
        reason: "File size exceeds limit",
      },
      {
        name: "resume3.pdf",
        reason: "Corrupted file",
      },
      {
        name: "resume4.pdf",
      },
      {
        name: "resume5.pdf",
        reason: "Invalid content",
      },
      {
        name: "resume2.pdf",
        reason: "File size exceeds limit",
      },
      {
        name: "resume3.pdf",
        reason: "Corrupted file",
      },
      {
        name: "resume4.pdf",
      },
      {
        name: "resume5.pdf",
        reason: "Invalid content",
      },
    ]


export default function TrackCandidateDialog({
  batch_id,
}: {
  batch_id: string;
}) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<UploadData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function fetchUploadData(batch_id: string) {
    try {
      setIsLoading(true);
      setError(null);
      const res = await axios.get(`/batch/get-summary/${batch_id}`);
      if (res.status === 200) {
        setData(res.data as UploadData);
      }
    } catch (error) {
      console.error("Error fetching upload data:", error);
      setError("Failed to load upload data");
    } finally {
      setIsLoading(false);
    }
  }

  // Fetch data when dialog opens
  useEffect(() => {
    if (open && batch_id) {
      fetchUploadData(batch_id);
    }
  }, [open, batch_id]);

  // Calculate values only when data exists
  const pending_files = data
    ? data.total_files - data.processed_files - data.failed_files
    : 0;
  const success_files = data?.processed_files || 0;

  const successPercent = data ? (success_files / data.total_files) * 100 : 0;
  const failedPercent = data
    ? (data.failed_files / data.total_files) * 100
    : 0;
  const pendingPercent = data ? (pending_files / data.total_files) * 100 : 0;

  const isComplete = pending_files === 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip >
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            {/* <Button className="bg-primary cursor-pointer text-primary-foreground px-4 py-2 rounded-lg hover:bg-hover-primary transition">
          <Plus className="w-4 h-4 mr-2 inline" />
          Add Candidates
        </Button> */}

            <Button className="bg-primary cursor-pointer text-primary-foreground px-3 py-2 rounded-lg hover:bg-hover-primary transition">
              <Monitor className="w-4 h-4 inline" />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>Track Uploaded Resumes</p>
        </TooltipContent>
      </Tooltip>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                Loading...
              </>
            ) : error ? (
              <>
                <AlertCircle className="h-5 w-5 text-destructive" />
                Error Loading Data
              </>
            ) : isComplete ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Upload Complete
              </>
            ) : (
              <>
                <Clock className="h-5 w-5 text-blue-500 animate-pulse" />
                Processing Resumes
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isLoading
              ? "Fetching upload status..."
              : error
                ? error
                : isComplete
                  ? "Your upload has been processed successfully"
                  : "Your uploaded resumes are being processed"}
          </DialogDescription>
        </DialogHeader>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-sm text-muted-foreground">
              Loading upload data...
            </p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button
              onClick={() => fetchUploadData(batch_id)}
              variant="outline"
            >
              Retry
            </Button>
          </div>
        )}

        {/* Data Display */}
        {data && !isLoading && !error && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg border bg-green-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-900">
                      Success
                    </p>
                    <p className="text-2xl font-bold text-green-700">
                      {success_files}
                    </p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
              </div>

              <div className="rounded-lg border bg-red-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-900">Failed</p>
                    <p className="text-2xl font-bold text-red-700">
                      {data.failed_files}
                    </p>
                  </div>
                  <XCircle className="h-8 w-8 text-red-600" />
                </div>
              </div>

              <div className="rounded-lg border bg-blue-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-900">Pending</p>
                    <p className="text-2xl font-bold text-blue-700">
                      {pending_files}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-blue-600" />
                </div>
              </div>
            </div>

            {/* Multi-colored Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Overall Progress</h3>
                <span className="text-sm text-muted-foreground">
                  {data.processed_files + data.failed_files} / {data.total_files}{" "}
                  files
                </span>
              </div>

              {/* Stacked Progress Bar */}
              <div className="relative h-4 w-full overflow-hidden rounded-full bg-gray-200">
                {/* Success portion */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className="absolute left-0 top-0 h-full bg-green-500 transition-all duration-500 cursor-pointer"
                      style={{ width: `${successPercent}%` }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Successfully processed: {success_files} files</p>
                  </TooltipContent>
                </Tooltip>

                {/* Failed portion */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className="absolute top-0 h-full bg-red-500 transition-all duration-500 cursor-pointer"
                      style={{
                        left: `${successPercent}%`,
                        width: `${failedPercent}%`,
                      }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Failed: {data.failed_files} files</p>
                  </TooltipContent>
                </Tooltip>

                {/* Pending portion - animated */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className="absolute top-0 h-full bg-blue-400 transition-all duration-500 cursor-pointer"
                      style={{
                        left: `${successPercent + failedPercent}%`,
                        width: `${pendingPercent}%`,
                      }}
                    >
                      {!isComplete && (
                        <div className="h-full w-full animate-pulse bg-blue-500/50" />
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Pending: {pending_files} files</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                  <span>Processed ({successPercent.toFixed(0)}%)</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-3 w-3 rounded-full bg-red-500" />
                  <span>Failed ({failedPercent.toFixed(0)}%)</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-3 w-3 rounded-full bg-blue-400" />
                  <span>Pending ({pendingPercent.toFixed(0)}%)</span>
                </div>
              </div>
            </div>

            {/* Failed Files Accordion */}
            {data.failed_files > 0 && data.failed_files_names && (
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="failed-files">
                  <AccordionTrigger className="text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      View Failed Files ({data.failed_files})
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {data.failed_files_names.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3"
                        >
                          <FileText className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-red-900 break-all">
                              {file.name}
                            </p>
                            {file.reason && (
                              <p className="text-xs text-red-700 mt-1">
                                {file.reason}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}

            {/* Action Button */}
            <div className="flex justify-end">
              <Button
                onClick={() => setOpen(false)}
                className="bg-primary hover:bg-hover-primary"
              >
                {isComplete ? "Done" : "Continue Processing"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}