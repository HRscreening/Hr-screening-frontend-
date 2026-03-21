import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Briefcase,
  MapPin,
  Upload,
  CheckCircle2,
  XCircle,
  Loader2,
  FileText,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface FormQuestion {
  id: string;
  key: string;
  label: string;
  type: string;
  required: boolean;
  enabled?: boolean;
  placeholder?: string;
}

interface JobInfo {
  job_id: string;
  title: string;
  location: string | null;
  description: string | null;
  organization_name: string | null;
  form_questions: FormQuestion[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000/api';

// ── Component ─────────────────────────────────────────────────────────────────

export default function PublicApplyPage() {
  const { slug } = useParams<{ slug: string }>();

  const [jobInfo, setJobInfo] = useState<JobInfo | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Form state
  const [fields, setFields] = useState<Record<string, string>>({});
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Load job info ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (!slug) return;
    const load = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/public/apply/${slug}`);
        setJobInfo(res.data);
      } catch (e: any) {
        const msg =
          e?.response?.data?.message ??
          'This job is no longer accepting applications.';
        setLoadError(msg);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [slug]);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const setField = (key: string, value: string) =>
    setFields((prev) => ({ ...prev, [key]: value }));

  const getField = (key: string) => fields[key] ?? '';

  // Only show questions that are enabled (default true for backward compat)
  const visibleQuestions = (jobInfo?.form_questions ?? []).filter(
    (q) => q.enabled !== false
  );

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields from form_questions
    for (const q of visibleQuestions) {
      if (q.key === 'resume') {
        if (!resumeFile) {
          toast.error('Please attach your resume');
          return;
        }
      } else if (q.required && !fields[q.key]?.trim()) {
        toast.error(`${q.label} is required`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();

      // Append all text/number/url/email fields
      for (const q of visibleQuestions) {
        if (q.key === 'resume') continue;
        const val = fields[q.key]?.trim();
        if (val) {
          formData.append(q.key, val);
        }
      }

      if (resumeFile) {
        formData.append('resume', resumeFile);
      }

      await axios.post(`${BASE_URL}/public/apply/${slug}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSubmitted(true);
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? 'Submission failed. Please try again.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Render: loading ───────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ── Render: error ─────────────────────────────────────────────────────────

  if (loadError || !jobInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="max-w-md w-full text-center shadow-md">
          <CardHeader>
            <div className="mx-auto mb-3 p-3 rounded-full bg-red-50 dark:bg-red-950/30 w-fit">
              <XCircle className="w-6 h-6 text-red-500" />
            </div>
            <CardTitle>Position Unavailable</CardTitle>
            <CardDescription>{loadError}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // ── Render: success ───────────────────────────────────────────────────────

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="max-w-md w-full text-center shadow-md">
          <CardHeader>
            <div className="mx-auto mb-3 p-3 rounded-full bg-green-50 dark:bg-green-950/30 w-fit">
              <CheckCircle2 className="w-6 h-6 text-green-500" />
            </div>
            <CardTitle>Application Submitted!</CardTitle>
            <CardDescription>
              Thanks for applying to <strong>{jobInfo.title}</strong>
              {jobInfo.organization_name ? ` at ${jobInfo.organization_name}` : ''}. We'll
              review your profile and get back to you soon.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // ── Render: form ──────────────────────────────────────────────────────────

  // Separate resume question (rendered as file upload) from text questions
  const resumeQ = visibleQuestions.find((q) => q.key === 'resume');
  const textQuestions = visibleQuestions.filter((q) => q.key !== 'resume');

  return (
    <div className="min-h-screen bg-muted/30 py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Job header */}
        <Card className="shadow-sm">
          <CardHeader>
            {jobInfo.organization_name && (
              <p className="text-sm text-muted-foreground font-medium">
                {jobInfo.organization_name}
              </p>
            )}
            <CardTitle className="flex items-start gap-2 text-2xl">
              <Briefcase className="w-5 h-5 mt-1 text-primary shrink-0" />
              {jobInfo.title}
            </CardTitle>
            {jobInfo.location && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {jobInfo.location}
              </p>
            )}
            {jobInfo.description && (
              <>
                <Separator className="my-2" />
                <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-5">
                  {jobInfo.description}
                </p>
              </>
            )}
          </CardHeader>
        </Card>

        {/* Application form */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Apply for this position</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Render text/number/etc. questions */}
              {textQuestions.map((q) => (
                <div key={q.id} className="space-y-1.5">
                  <Label htmlFor={q.key}>
                    {q.label}
                    {q.required && <span className="text-destructive ml-0.5">*</span>}
                  </Label>
                  {q.type === 'textarea' ? (
                    <Textarea
                      id={q.key}
                      placeholder={q.placeholder ?? q.label}
                      value={getField(q.key)}
                      onChange={(e) => setField(q.key, e.target.value)}
                      required={q.required}
                    />
                  ) : (
                    <Input
                      id={q.key}
                      type={
                        q.type === 'number'
                          ? 'number'
                          : q.type === 'email'
                          ? 'email'
                          : q.type === 'url'
                          ? 'url'
                          : 'text'
                      }
                      placeholder={q.placeholder ?? q.label}
                      value={getField(q.key)}
                      onChange={(e) => setField(q.key, e.target.value)}
                      required={q.required}
                    />
                  )}
                </div>
              ))}

              {/* Resume upload — always at the end */}
              {resumeQ && (
                <>
                  <Separator />
                  <div className="space-y-1.5">
                    <Label>
                      {resumeQ.label}
                      {resumeQ.required && <span className="text-destructive ml-0.5">*</span>}
                    </Label>
                    <div
                      className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${
                        resumeFile
                          ? 'border-green-400 bg-green-50/30 dark:bg-green-900/10'
                          : 'border-border hover:border-primary hover:bg-primary/5'
                      }`}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {resumeFile ? (
                        <>
                          <FileText className="w-6 h-6 text-green-500" />
                          <p className="text-sm font-medium text-green-700 dark:text-green-400">
                            {resumeFile.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(resumeFile.size / 1024 / 1024).toFixed(2)} MB — Click to change
                          </p>
                        </>
                      ) : (
                        <>
                          <Upload className="w-6 h-6 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            Click to upload your resume
                          </p>
                          <p className="text-xs text-muted-foreground">PDF or DOCX, max 5 MB</p>
                        </>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.doc,.docx"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) setResumeFile(f);
                        }}
                      />
                    </div>
                  </div>
                </>
              )}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting…
                  </>
                ) : (
                  'Submit Application'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
