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
import { CheckCircle2, XCircle, Clock, FileText, AlertCircle, Monitor } from "lucide-react";
import { useState } from "react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";


type UploadData = {
  total_files: number;
  processed_files: number;
  failed_files: number;
  failed_files_names?: {
    name: string;
    reason?: string;
  }[];
};

export default function TrackCandidateDialog({ batch_id: _batch_id }: { batch_id: string }) {
  const [open, setOpen] = useState(false);

  const data: UploadData = {
    total_files: 40,
    processed_files: 20,
    failed_files: 5,
    failed_files_names: [
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
    ],
  };

  const pending_files = data.total_files - data.processed_files - data.failed_files;
  const success_files = data.processed_files;

  // Calculate percentages
  const successPercent = (success_files / data.total_files) * 100;
  const failedPercent = (data.failed_files / data.total_files) * 100;
  const pendingPercent = (pending_files / data.total_files) * 100;


  const isComplete = pending_files === 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}  >
      <DialogTrigger asChild>
        <Tooltip >
          <TooltipTrigger>

            <Button className="bg-primary cursor-pointer text-primary-foreground px-3 py-2 rounded-lg hover:bg-hover-primary transition">
              <Monitor className="w-4 h-4 inline" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Track Resume Processing</p>
          </TooltipContent>
        </Tooltip>
        {/* <Button className="bg-primary cursor-pointer text-primary-foreground px-4 py-2 rounded-lg hover:bg-hover-primary transition">
          <Monitor className="w-4 h-4 inline" />
          Track Upload
        </Button> */}
      </DialogTrigger>

      <DialogContent className="sm:max-w-137.5" >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            {isComplete ? (
              <>
                <CheckCircle2 className="h-6 w-6 text-success" />
                Upload Complete
              </>
            ) : (
              <>
                <Clock className="h-6 w-6 text-primary animate-pulse" />
                Processing Resumes
              </>
            )}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {isComplete
              ? "Your upload has been processed successfully"
              : "Your uploaded resumes are being processed"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-success/10 rounded-lg p-4 border border-success/20">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span className="text-xs font-medium text-success uppercase">Success</span>
              </div>
              <p className="text-2xl font-bold text-success">{success_files}</p>
            </div>

            <div className="bg-destructive/10 rounded-lg p-4 border border-destructive/20">
              <div className="flex items-center gap-2 mb-1">
                <XCircle className="h-4 w-4 text-destructive" />
                <span className="text-xs font-medium text-destructive uppercase">Failed</span>
              </div>
              <p className="text-2xl font-bold text-destructive">{data.failed_files}</p>
            </div>

            <div className="bg-warning/10 rounded-lg p-4 border border-warning/20">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-warning" />
                <span className="text-xs font-medium text-warning uppercase">Pending</span>
              </div>
              <p className="text-2xl font-bold text-warning">{pending_files}</p>
            </div>
          </div>

          {/* Multi-colored Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium text-foreground">Overall Progress</span>
              <span className="text-muted-foreground">
                {data.processed_files + data.failed_files} / {data.total_files} files
              </span>
            </div>

            {/* Stacked Progress Bar */}
            <div className="relative h-3 bg-muted rounded-full overflow-hidden">
              <div className="absolute inset-0 flex">
                {/* Success portion */}
                <div
                  className="bg-success transition-all duration-500"
                  style={{ width: `${successPercent}%` }}
                />
                {/* Failed portion */}
                <div
                  className="bg-destructive transition-all duration-500"
                  style={{ width: `${failedPercent}%` }}
                />
                {/* Pending portion - animated */}
                <div
                  className="bg-warning relative overflow-hidden transition-all duration-500"
                  style={{ width: `${pendingPercent}%` }}
                >
                  {!isComplete && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                  )}
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="flex gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-success" />
                <span>Processed ({successPercent.toFixed(0)}%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-destructive" />
                <span>Failed ({failedPercent.toFixed(0)}%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-warning" />
                <span>Pending ({pendingPercent.toFixed(0)}%)</span>
              </div>
            </div>
          </div>

          {/* Failed Files Accordion */}
          {data.failed_files > 0 && data.failed_files_names && (
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="failed-files" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline py-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    <span>View Failed Files ({data.failed_files})</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 pt-2 pb-3 overflow-y-scroll max-h-60">
                    {data.failed_files_names.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 bg-destructive/5 rounded-md border border-destructive/10"
                      >
                        <FileText className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {file.name}
                          </p>
                          {file.reason && (
                            <p className="text-xs text-muted-foreground mt-1">
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
          <div className="flex justify-end pt-2">
            <Button
              onClick={() => setOpen(false)}
              className="bg-primary hover:bg-hover-primary"
            >
              {isComplete ? "Done" : "Continue Processing"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}