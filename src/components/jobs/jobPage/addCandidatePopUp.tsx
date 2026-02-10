import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Upload, Cloud, FileArchive, X, Play, CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import axios from "axios";

interface ProcessingResponse {
  batch_id: string;
  message?: string;
}

export default function AddCandidatesDialog({job_id}: {job_id: string}) {
  const [open, setOpen] = useState(false);
  const [source, setSource] = useState<'upload' | 'cloud'>('upload');
  const [cloudUrl, setCloudUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [batchStarted, setBatchStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.name.endsWith('.zip')) {
      setSelectedFile(file);
      setError(null);
    } else {
      setError('Please upload a ZIP file');
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const removeFile = () => {
    setSelectedFile(null);
    setError(null);
  };

  const handleStartProcessing = async () => {
    if ((source === 'upload' && selectedFile) || (source === 'cloud' && cloudUrl)) {
      setIsProcessing(true);
      setError(null);

      try {
        if (source === 'upload' && selectedFile) {
          const formData = new FormData();
          formData.append('zip_file', selectedFile);

          const res = await axios.post<ProcessingResponse>(`/jobs/process-applications-zip-file/${job_id}`, formData);

          if (res.status === 202) {
            setBatchStarted(true);
          }
        }

        if (source === 'cloud' && cloudUrl) {
          const res = await axios.post<ProcessingResponse>('/api/process-resumes', {
            cloud_url: cloudUrl,
          });

          if (res.status === 202) {
            setBatchStarted(true);
          }
        }
      } catch (error) {
        console.error('Error during AI processing:', error);
        if (axios.isAxiosError(error)) {
          setError(error.response?.data?.message || 'Failed to process resumes. Please try again.');
        } else {
          setError('An unexpected error occurred. Please try again.');
        }
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleClose = () => {
    setOpen(false);
    // Reset state after dialog closes
    setTimeout(() => {
      setSource('upload');
      setCloudUrl('');
      setSelectedFile(null);
      setBatchStarted(false);
      setError(null);
    }, 200);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary cursor-pointer text-primary-foreground px-4 py-2 rounded-lg hover:bg-hover-primary transition">
          <Plus className="w-4 h-4 mr-2 inline" />
          Add Candidates
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-137.5" onCloseAutoFocus={handleClose}>
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {batchStarted ? 'Processing Started!' : 'Add Candidates'}
          </DialogTitle>
          <DialogDescription>
            {batchStarted 
              ? 'Your resumes are being processed by AI'
              : 'Choose how to import candidate resumes'
            }
          </DialogDescription>
        </DialogHeader>

        {!batchStarted ? (
          <div className="space-y-6 py-4">
            {/* Source Selection */}
            <RadioGroup value={source} onValueChange={(val) => setSource(val as 'upload' | 'cloud')}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <RadioGroupItem value="upload" id="upload" className="peer sr-only" />
                  <Label
                    htmlFor="upload"
                    className={cn(
                      "flex flex-col items-center justify-between rounded-lg border-2 border-muted p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-all",
                      source === 'upload' && "border-primary bg-primary/5"
                    )}
                  >
                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-3">
                      <Upload className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="text-center">
                      <div className="font-semibold">Upload Archive</div>
                      <div className="text-xs text-muted-foreground mt-1">ZIP file</div>
                    </div>
                  </Label>
                </div>

                <div>
                  <RadioGroupItem value="cloud" id="cloud" className="peer sr-only" />
                  <Label
                    htmlFor="cloud"
                    className={cn(
                      "flex flex-col items-center justify-between rounded-lg border-2 border-muted p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-all",
                      source === 'cloud' && "border-primary bg-primary/5"
                    )}
                  >
                    <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-3">
                      <Cloud className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="text-center">
                      <div className="font-semibold">Cloud Sync</div>
                      <div className="text-xs text-muted-foreground mt-1">Drive/Dropbox</div>
                    </div>
                  </Label>
                </div>
              </div>
            </RadioGroup>

            {/* Upload Section */}
            {source === 'upload' && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Upload Resume Archive</Label>
                
                {!selectedFile ? (
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    className={cn(
                      "relative border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 hover:bg-muted/50 transition-all cursor-pointer",
                      isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"
                    )}
                  >
                    <input
                      id="file-upload"
                      type="file"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      accept=".zip"
                      onChange={handleFileChange}
                    />
                    <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm font-medium mb-1">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ZIP file containing PDF/DOCX resumes (Max 500MB)
                    </p>
                  </div>
                ) : (
                  <div className="border rounded-lg p-4 bg-muted/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                          <FileArchive className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                          <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={removeFile}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Cloud Section */}
            {source === 'cloud' && (
              <div className="space-y-3">
                <Label htmlFor="cloud-url" className="text-sm font-medium">
                  Shared Folder URL
                </Label>
                <Input
                  id="cloud-url"
                  type="url"
                  placeholder="https://drive.google.com/..."
                  value={cloudUrl}
                  onChange={(e) => setCloudUrl(e.target.value)}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Paste a shared link to your Google Drive, Dropbox, or Box folder
                </p>
              </div>
            )}

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Action Button */}
            <Button
              className="w-full bg-primary hover:bg-hover-primary text-primary-foreground font-semibold py-5"
              disabled={
                (source === 'upload' && !selectedFile) ||
                (source === 'cloud' && !cloudUrl) ||
                isProcessing
              }
              onClick={handleStartProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2 fill-current" />
                  Start AI Processing
                </>
              )}
            </Button>
          </div>
        ) : (
          // Success State
          <div className="space-y-6 py-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Processing Started Successfully!</h3>
                <p className="text-sm text-muted-foreground">
                  Your resumes are being analyzed by our AI. This may take a few minutes.
                  You will be notified once the processing is complete and candidates are added to the system.
                </p>
              </div>
            </div>

            {/* Action Button */}
            <Button
              variant="default"
              className="w-full bg-primary hover:bg-hover-primary"
              onClick={handleClose}
            >
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}