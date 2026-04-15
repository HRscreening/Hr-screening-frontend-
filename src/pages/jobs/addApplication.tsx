import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Upload, Cloud, FileArchive, X, Play, Loader2, RefreshCw, AlertCircle, Monitor } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import axios from "@/axiosConfig";
import { useParams } from "react-router-dom";
import ResumeProcessingTracker from "@/components/jobs/jobPage/ResumeProcessingTracker";
import { useQueryClient } from "@tanstack/react-query";

interface ProcessingResponse {
    batch_id: string;
    message?: string;
}

export default function AddApplications() {
    const { jobId: job_id } = useParams();
    const queryClient = useQueryClient();
    const [source, setSource] = useState<'upload' | 'cloud'>('upload');
    const [cloudUrl, setCloudUrl] = useState("");
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [batchId, setBatchId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files ? Array.from(e.target.files) : [];

        if (files.length > 0) {
            setSelectedFiles(prev => [...prev, ...files]);
            setError(null);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files || []);

        if (files.length > 0) {
            setSelectedFiles(prev => [...prev, ...files]);
            setError(null);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const removeFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleStartProcessing = async () => {
        if ((source === 'upload' && selectedFiles.length > 0) || (source === 'cloud' && cloudUrl)) {
          setIsProcessing(true);
          setError(null);

          try {
            if (source === 'upload' && selectedFiles.length > 0) {
              const formData = new FormData();
              selectedFiles.forEach((file) => {
                formData.append('raw_files', file);
              });

              const res = await axios.post<ProcessingResponse>(`/jobs/process-applications-zip-file/${job_id}`, formData);

              if (res.status === 202) {
                setBatchId(res.data.batch_id);
                // Clear selection after starting
                setSelectedFiles([]);
              }
            }

            if (source === 'cloud' && cloudUrl) {
              const res = await axios.post<ProcessingResponse>('/api/process-resumes', {
                cloud_url: cloudUrl,
              });

              if (res.status === 202) {
                setBatchId(res.data.batch_id);
                setCloudUrl("");
              }
            }
          } catch (error) {
            console.error('Error during AI processing:', error);
            if (axios.isAxiosError(error)) {
              setError(error.response?.data?.detail || error.response?.data?.message || 'Failed to process resumes. Please try again.');
            } else {
              setError('An unexpected error occurred. Please try again.');
            }
          } finally {
            setIsProcessing(false);
          }
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    };

    return (
        <div className="container mx-auto py-8">
            <div className="flex flex-col lg:flex-row gap-8 items-start">
                {/* Left Column: Form Section */}
                <div className="flex-1 w-full max-w-2xl bg-card rounded-xl border p-6 shadow-sm">
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold tracking-tight">Add Candidates</h1>
                        <p className="text-muted-foreground">Choose how to import candidate resumes for this position.</p>
                    </div>
                    
                    <div className="space-y-6">
                        {/* Source Selection */}
                        <RadioGroup value={source} onValueChange={(val) => setSource(val as 'upload' | 'cloud')}>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <RadioGroupItem value="upload" id="upload" className="peer sr-only" />
                                    <Label
                                        htmlFor="upload"
                                        className={cn(
                                            "flex flex-col items-center justify-between rounded-xl border-2 border-muted p-4 hover:bg-accent/50 cursor-pointer transition-all h-full",
                                            source === 'upload' && "border-primary bg-primary/5"
                                        )}
                                    >
                                        <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-3">
                                            <Upload className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div className="text-center">
                                            <div className="font-semibold">Upload Archive</div>
                                            <div className="text-xs text-muted-foreground mt-1">ZIP or multiple PDFs</div>
                                        </div>
                                    </Label>
                                </div>

                                <div>
                                    <RadioGroupItem value="cloud" id="cloud" className="peer sr-only" />
                                    <Label
                                        htmlFor="cloud"
                                        className={cn(
                                            "flex flex-col items-center justify-between rounded-xl border-2 border-muted p-4 hover:bg-accent/50 cursor-pointer transition-all h-full",
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
                            <div className="space-y-4">
                                <Label className="text-sm font-semibold">Upload Files</Label>
                                <div
                                    onDrop={handleDrop}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    className={cn(
                                        "relative border-2 border-dashed rounded-xl p-10 text-center hover:border-primary/50 hover:bg-muted/30 transition-all cursor-pointer",
                                        isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/20"
                                    )}
                                >
                                    <input
                                        id="file-upload"
                                        type="file"
                                        multiple
                                        accept=".pdf,.doc,.docx,.zip"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        onChange={handleFileChange}
                                    />
                                    <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Plus className="w-6 h-6 text-muted-foreground" />
                                    </div>
                                    <p className="text-sm font-medium mb-1">
                                        Click to upload or drag & drop files
                                    </p>
                                    <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                                        Support for .ZIP archives containing multiple resumes, or individual .PDF/.DOCX files.
                                    </p>
                                </div>

                                {/* Selected files list */}
                                {selectedFiles.length > 0 && (
                                    <div className="space-y-2 max-h-75 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-muted">
                                        {selectedFiles.map((file, index) => (
                                            <div key={index} className="flex items-center justify-between border rounded-lg p-3 bg-muted/30 group">
                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                    <div className="w-8 h-8 rounded bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                                                        <FileArchive className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium truncate">{file.name}</p>
                                                        <p className="text-[10px] text-muted-foreground uppercase">{formatFileSize(file.size)}</p>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={() => removeFile(index)}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Cloud Section */}
                        {source === 'cloud' && (
                            <div className="space-y-4">
                                <Label htmlFor="cloud-url" className="text-sm font-semibold">
                                    Shared Folder Link
                                </Label>
                                <Input
                                    id="cloud-url"
                                    type="url"
                                    placeholder="https://drive.google.com/..."
                                    value={cloudUrl}
                                    onChange={(e) => setCloudUrl(e.target.value)}
                                    className="h-11 rounded-lg"
                                />
                                <div className="flex items-start gap-2 bg-muted/50 p-3 rounded-lg">
                                    <AlertCircle className="w-4 h-4 text-muted-foreground mt-0.5" />
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        Ensure the link is public or shared with our processing account. We'll automatically scan sub-folders for compatible resume formats.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Error Alert */}
                        {error && (
                            <Alert variant="destructive" className="bg-destructive/5 border-destructive/20">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        {/* Action Button */}
                        <Button
                            className="w-full h-12 shadow-lg shadow-primary/20 text-base font-semibold transition-all hover:-translate-y-px"
                            disabled={
                                (source === 'upload' && selectedFiles.length === 0) ||
                                (source === 'cloud' && !cloudUrl) ||
                                isProcessing
                            }
                            onClick={handleStartProcessing}
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Initialising AI Worker...
                                </>
                            ) : (
                                <>
                                    <Play className="w-4 h-4 mr-2 fill-current" />
                                    Start Processing {selectedFiles.length > 0 ? `(${selectedFiles.length} files)` : ''}
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Right Column: Tracking Progress Section */}
                <div className="flex-1 w-full lg:max-w-xl">
                    {batchId && job_id ? (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                             <div className="flex items-center justify-between mb-4 px-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Active Batch</h3>
                                </div>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => setBatchId(null)}
                                    className="h-8 rounded-full border-dashed px-4 hover:bg-destructive/5 hover:text-destructive hover:border-destructive/30 transition-colors"
                                >
                                    <RefreshCw className="w-3 h-3 mr-2" />
                                    New Batch
                                </Button>
                            </div>
                            <ResumeProcessingTracker 
                                batch_id={batchId} 
                                job_id={job_id}
                                onComplete={() => {
                                    console.log("Processing complete!");
                                    // Invalidate applications query to refresh the list 
                                    // since new candidates have been processed
                                    queryClient.invalidateQueries({
                                        queryKey: ['applications', job_id]
                                    });
                                }} 
                            />
                        </div>
                    ) : (
                        <div className="h-full min-h-100 flex flex-col items-center justify-center border-2 border-dashed rounded-xl bg-muted/20 border-muted-foreground/10 p-8 text-center">
                            <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mb-4">
                                <Monitor className="w-8 h-8 text-muted-foreground/40" />
                            </div>
                            <h3 className="text-lg font-semibold text-muted-foreground/60">No Active Processing</h3>
                            <p className="text-sm text-muted-foreground/40 max-w-60 mt-2">
                                Upload files and start the AI worker to see real-time progress here.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}