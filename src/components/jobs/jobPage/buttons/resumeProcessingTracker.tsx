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

// Per-file status from the backend
type FileStatus = {
  name: string;
  status: "parsed" | "failed" | "processing";
  detail?: string;
};

// Shape returned by GET /api/jobs/{job_id}/batch-progress
type BatchProgressResponse = {
  batch_id: string;
  job_id: string;
  phase: "parsing" | "scoring" | "completed";
  parsing: { total: number; success: number; failed: number; pending: number; status: string };
  scoring: { total: number; completed: number; failed: number; status: string };
  file_statuses?: FileStatus[];
  all_complete: boolean;
  created_at: string;
};

type UploadData = {
  total_files: number;
  processed_files: number;
  failed_files: number;
  scoring_total: number;
  scoring_completed: number;
  scoring_failed: number;
  phase: "parsing" | "scoring" | "completed";
  all_complete: boolean;
  created_at: string;
  file_statuses: FileStatus[];
};

function mapResponse(r: BatchProgressResponse): UploadData {
  return {
    total_files: r.parsing.total,
    processed_files: r.parsing.success,
    failed_files: r.parsing.failed,
    scoring_total: r.scoring.total,
    scoring_completed: r.scoring.completed,
    scoring_failed: r.scoring.failed,
    phase: r.phase,
    all_complete: r.all_complete,
    created_at: r.created_at,
    file_statuses: r.file_statuses ?? [],
  };
}

function FileStatusIcon({ status }: { status: string }) {
  if (status === "parsed") return <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />;
  if (status === "failed") return <XCircle className="h-4 w-4 text-red-600 shrink-0" />;
  return <Loader2 className="h-4 w-4 text-blue-500 animate-spin shrink-0" />;
}

export default function TrackCandidateDialog({
  batch_id,
  job_id,
  externalOpen,
  onOpenChange,
}: {
  batch_id: string;
  job_id: string;
  externalOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = (v: boolean) => {
    setInternalOpen(v);
    onOpenChange?.(v);
  };
  const [data, setData] = useState<UploadData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function fetchUploadData() {
    if (!batch_id || !job_id) return;
    try {
      setError(null);
      const res = await axios.get<BatchProgressResponse>(
        `/jobs/${job_id}/batch-progress?batch_id=${batch_id}`
      );
      if (res.status === 200) {
        setData(mapResponse(res.data));
      }
    } catch (err) {
      console.error("Error fetching upload data:", err);
      setError("Failed to load upload data");
    } finally {
      setIsLoading(false);
    }
  }

  // Initial fetch when dialog opens
  useEffect(() => {
    if (open && batch_id && job_id) {
      setIsLoading(true);
      fetchUploadData();
    }
  }, [open, batch_id, job_id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Poll every 3 s while processing is still in progress
  useEffect(() => {
    if (!open || !batch_id || !job_id || data?.all_complete) return;
    const interval = setInterval(() => { fetchUploadData(); }, 3000);
    return () => clearInterval(interval);
  }, [open, batch_id, job_id, data?.all_complete]); // eslint-disable-line react-hooks/exhaustive-deps

  // Calculate values only when data exists
  const success_files = data?.processed_files ?? 0;
  const failed_files = data?.failed_files ?? 0;
  const total_files = data?.total_files ?? 0;
  const pending_files = total_files > 0
    ? Math.max(0, total_files - success_files - failed_files)
    : 0;

  const successPercent = total_files > 0 ? (success_files / total_files) * 100 : 0;
  const failedPercent = total_files > 0 ? (failed_files / total_files) * 100 : 0;
  const pendingPercent = total_files > 0 ? (pending_files / total_files) * 100 : 0;

  const isComplete = data?.all_complete ?? false;
  const phase = data?.phase ?? "parsing";

  // Separate file statuses
  const parsedFiles = data?.file_statuses.filter(f => f.status === "parsed") ?? [];
  const failedFilesList = data?.file_statuses.filter(f => f.status === "failed") ?? [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip >
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
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
                Processing Complete
              </>
            ) : phase === "scoring" ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin text-purple-500" />
                Scoring Resumes
              </>
            ) : (
              <>
                <Clock className="h-5 w-5 text-blue-500 animate-pulse" />
                Parsing Resumes
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {!batch_id
              ? "No active batch to track"
              : isLoading
              ? "Fetching upload status..."
              : error
                ? error
                : isComplete
                  ? "All resumes parsed and scored"
                  : phase === "scoring"
                    ? "Parsing done — AI scoring in progress"
                    : "Resumes are being parsed"}
          </DialogDescription>
        </DialogHeader>

        {/* No Batch State */}
        {!batch_id && !isLoading && (
          <div className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-sm text-muted-foreground">
              No processing batch found. Upload resumes to start tracking.
            </p>
          </div>
        )}

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
              onClick={() => fetchUploadData()}
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
                      {success_files} / {total_files}
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
                      {failed_files}
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
                <h3 className="text-sm font-medium">Parsing Progress</h3>
                <span className="text-sm text-muted-foreground">
                  {success_files + failed_files} / {total_files}{" "}
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
                    <p>Successfully parsed: {success_files} files</p>
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
                    <p>Failed: {failed_files} files</p>
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
                  <span>Parsed ({successPercent.toFixed(0)}%)</span>
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

            {/* Scoring Phase */}
            {data && (data.scoring_total > 0 || phase === "scoring" || isComplete) && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">AI Scoring Progress</h3>
                  <span className="text-sm text-muted-foreground">
                    {data.scoring_completed + data.scoring_failed} / {data.scoring_total} scored
                  </span>
                </div>
                <div className="relative h-4 w-full overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="absolute left-0 top-0 h-full bg-purple-500 transition-all duration-500"
                    style={{
                      width: data.scoring_total > 0
                        ? `${((data.scoring_completed) / data.scoring_total) * 100}%`
                        : "0%",
                    }}
                  />
                  {!isComplete && phase === "scoring" && (
                    <div className="absolute inset-0 bg-purple-300/30 animate-pulse" />
                  )}
                </div>
                <div className="flex flex-wrap gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="h-3 w-3 rounded-full bg-purple-500" />
                    <span>Scored ({data.scoring_completed})</span>
                  </div>
                  {data.scoring_failed > 0 && (
                    <div className="flex items-center gap-1">
                      <div className="h-3 w-3 rounded-full bg-red-500" />
                      <span>Failed ({data.scoring_failed})</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Per-Resume File Statuses */}
            {data.file_statuses.length > 0 && (
              <Accordion type="single" collapsible className="w-full">
                {/* Parsed Files */}
                {parsedFiles.length > 0 && (
                  <AccordionItem value="parsed-files">
                    <AccordionTrigger className="text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        Parsed Resumes ({parsedFiles.length})
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-1.5 max-h-48 overflow-y-auto">
                        {parsedFiles.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-3 py-2"
                          >
                            <FileStatusIcon status={file.status} />
                            <span className="text-sm text-green-900 break-all flex-1">
                              {file.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}

                {/* Failed Files */}
                {failedFilesList.length > 0 && (
                  <AccordionItem value="failed-files">
                    <AccordionTrigger className="text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-red-500" />
                        Failed Resumes ({failedFilesList.length})
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-1.5 max-h-48 overflow-y-auto">
                        {failedFilesList.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2"
                          >
                            <FileStatusIcon status={file.status} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-red-900 break-all">
                                {file.name}
                              </p>
                              {file.detail && (
                                <p className="text-xs text-red-700 mt-0.5">
                                  {file.detail}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}
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
