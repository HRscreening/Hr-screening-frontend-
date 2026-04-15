import { Button } from "@/components/ui/button";
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
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useEffect, useState } from "react";
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

export default function ResumeProcessingTracker({
  batch_id,
  job_id,
  onComplete,
}: {
  batch_id: string;
  job_id: string;
  onComplete?: () => void;
}) {
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

  // Initial fetch
  useEffect(() => {
    if (batch_id && job_id) {
      setIsLoading(true);
      fetchUploadData();
    }
  }, [batch_id, job_id]);

  // Poll every 3 s while processing is still in progress
  useEffect(() => {
    if (!batch_id || !job_id || data?.all_complete) return;
    const interval = setInterval(() => { fetchUploadData(); }, 3000);
    return () => clearInterval(interval);
  }, [batch_id, job_id, data?.all_complete]);

  // Notify parent on completion
  useEffect(() => {
    if (data?.all_complete) {
      onComplete?.();
    }
  }, [data?.all_complete, onComplete]);

  // Calculate values
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

  if (isLoading && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-12 border rounded-xl bg-card">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-sm text-muted-foreground">Loading upload data...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-12 border rounded-xl bg-card">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <p className="text-sm text-muted-foreground mb-4">{error}</p>
        <Button onClick={() => fetchUploadData()} variant="outline">Retry</Button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6 border rounded-xl p-6 bg-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
            {isComplete ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : phase === "scoring" ? (
              <Loader2 className="h-5 w-5 animate-spin text-purple-500" />
            ) : (
              <Clock className="h-5 w-5 text-blue-500 animate-pulse" />
            )}
            <h3 className="font-semibold text-lg">
                {isComplete ? "Processing Complete" : phase === "scoring" ? "Scoring Resumes" : "Parsing Resumes"}
            </h3>
        </div>
        <p className="text-sm text-muted-foreground">
            {isComplete ? "All resumes parsed and scored" : phase === "scoring" ? "AI scoring in progress" : "Resumes are being parsed"}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border bg-green-50/50 dark:bg-green-900/10 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-900 dark:text-green-400">Success</p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">{success_files} / {total_files}</p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-500" />
          </div>
        </div>

        <div className="rounded-lg border bg-red-50/50 dark:bg-red-900/10 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-900 dark:text-red-400">Failed</p>
              <p className="text-2xl font-bold text-red-700 dark:text-red-300">{failed_files}</p>
            </div>
            <XCircle className="h-8 w-8 text-red-600 dark:text-red-500" />
          </div>
        </div>

        <div className="rounded-lg border bg-blue-50/50 dark:bg-blue-900/10 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-400">Pending</p>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{pending_files}</p>
            </div>
            <Clock className="h-8 w-8 text-blue-600 dark:text-blue-500" />
          </div>
        </div>
      </div>

      {/* Progress Bars */}
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Parsing Progress</h4>
            <span className="text-sm text-muted-foreground">{success_files + failed_files} / {total_files} files</span>
          </div>
          <div className="relative h-3 w-full overflow-hidden rounded-full bg-secondary">
            <div className="absolute left-0 top-0 h-full bg-green-500 transition-all duration-500" style={{ width: `${successPercent}%` }} />
            <div className="absolute top-0 h-full bg-red-500 transition-all duration-500" style={{ left: `${successPercent}%`, width: `${failedPercent}%` }} />
            <div className="absolute top-0 h-full bg-blue-400 transition-all duration-500" style={{ left: `${successPercent + failedPercent}%`, width: `${pendingPercent}%` }}>
              {!isComplete && <div className="h-full w-full animate-pulse bg-blue-500/50" />}
            </div>
          </div>
        </div>

        { (data.scoring_total > 0 || phase === "scoring" || isComplete) && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">AI Scoring Progress</h4>
              <span className="text-sm text-muted-foreground">{data.scoring_completed + data.scoring_failed} / {data.scoring_total} scored</span>
            </div>
            <div className="relative h-3 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="absolute left-0 top-0 h-full bg-purple-500 transition-all duration-500"
                style={{ width: data.scoring_total > 0 ? `${((data.scoring_completed) / data.scoring_total) * 100}%` : "0%" }}
              />
              {!isComplete && phase === "scoring" && <div className="absolute inset-0 bg-purple-300/30 animate-pulse" />}
            </div>
          </div>
        )}
      </div>

      {/* File Details */}
      {data.file_statuses.length > 0 && (
        <Accordion type="single" collapsible className="w-full">
          {parsedFiles.length > 0 && (
            <AccordionItem value="parsed-files" className="border-none">
              <AccordionTrigger className="text-sm font-medium hover:no-underline py-2">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  Parsed Resumes ({parsedFiles.length})
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 max-h-48 overflow-y-auto">
                  {parsedFiles.map((file, index) => (
                    <div key={index} className="flex items-center gap-2 rounded-md border border-green-100 bg-green-50/50 px-3 py-1.5 dark:bg-green-900/5 dark:border-green-900/20">
                      <FileStatusIcon status={file.status} />
                      <span className="text-xs text-green-900 dark:text-green-300 truncate">{file.name}</span>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {failedFilesList.length > 0 && (
            <AccordionItem value="failed-files" className="border-none">
              <AccordionTrigger className="text-sm font-medium hover:no-underline py-2">
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  Failed Resumes ({failedFilesList.length})
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 mt-2 max-h-48 overflow-y-auto">
                  {failedFilesList.map((file, index) => (
                    <div key={index} className="flex items-start gap-2 rounded-md border border-red-100 bg-red-50/50 px-3 py-2 dark:bg-red-900/5 dark:border-red-900/20">
                      <FileStatusIcon status={file.status} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-red-900 dark:text-red-300 truncate">{file.name}</p>
                        {file.detail && <p className="text-[10px] text-red-700 dark:text-red-400 mt-0.5">{file.detail}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
      )}
    </div>
  );
}
