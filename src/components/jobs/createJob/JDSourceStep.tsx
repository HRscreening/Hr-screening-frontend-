/**
 * JDSourceStep — Step 1 of the Create Job wizard.
 *
 * Offers two paths:
 *   A) Upload a JD file (existing flow)
 *   B) Build JD with AI (new: 3-step inline wizard → generate markdown → pre-fill job data)
 *
 * Both paths produce an ExtractedJD and call `onComplete(extractedJD)` to advance to Step 2.
 */

import { useState, useRef } from 'react';
import axios from '@/axiosConfig';
import { toast } from 'sonner';
import { normalizeExtractedJDResponse } from '@/utils/normalizeRubric';
import type { ExtractedJD } from '@/types/types';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Upload,
  Sparkles,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronRight,
  ChevronLeft,
  Loader2,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  onComplete: (data: ExtractedJD) => void;
}

type Mode = null | 'upload' | 'ai';

// ── Upload path ───────────────────────────────────────────────────────────────

function UploadPath({ onComplete }: { onComplete: (data: ExtractedJD) => void }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ];

  const handleFile = (file: File) => {
    setError('');
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a PDF, DOC, DOCX, or TXT file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }
    setUploadedFile(file);
  };

  const handleContinue = async () => {
    if (!uploadedFile) { setError('No file uploaded'); return; }
    setError('');
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);
      const uploadResponse = await axios.post('/jobs/upload-jd', formData);
      if (uploadResponse.status !== 200) { setError('Failed to upload file. Please try again.'); return; }
      const normalized = normalizeExtractedJDResponse(uploadResponse.data);
      onComplete(normalized);
    } catch {
      setError('An error occurred while uploading the file.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">Extracting job details…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div
        onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        className={`relative border-2 border-dashed rounded-xl p-16 transition-all cursor-pointer ${
          isDragging ? 'border-primary bg-primary/5'
          : uploadedFile ? 'border-primary/30 bg-background'
          : error ? 'border-destructive/40'
          : 'border-border hover:border-primary/40'
        }`}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          accept=".pdf,.doc,.docx,.txt"
          className="hidden"
        />
        {!uploadedFile ? (
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            <div>
              <p className="text-lg font-semibold">Drag & drop your job description</p>
              <p className="text-muted-foreground text-sm mt-1">PDF, DOC, DOCX, or TXT — max 10 MB</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl border border-primary/20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold flex items-center gap-2">
                  {uploadedFile.name}
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                </p>
                <p className="text-sm text-muted-foreground">
                  {(uploadedFile.size / 1024 / 1024).toFixed(1)} MB
                </p>
              </div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setUploadedFile(null); }}
              className="p-2 rounded-lg hover:bg-muted"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {uploadedFile && !error && (
        <div className="flex justify-end">
          <Button onClick={handleContinue}>
            Continue
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Prompt nudges shown as clickable chips ────────────────────────────────────

const NUDGES = [
  'Senior backend engineer, Python/FastAPI, 4+ years, remote, Bangalore',
  'Frontend developer React + TypeScript, 2-4 years, hybrid, ₹15-22 LPA',
  'Data scientist with ML/NLP experience, fintech startup, full-time',
  'DevOps engineer, AWS + Kubernetes, 5+ years, Series B startup',
  'Product manager for B2B SaaS, 3-6 years, cross-functional leadership',
];

function AIPromptPath({ onComplete }: { onComplete: (data: ExtractedJD) => void }) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    const trimmed = prompt.trim() || 'Generate a generic software engineer job description';
    setIsGenerating(true);
    try {
      const res = await axios.post('/jd-builder/preview-from-prompt', { prompt: trimmed });
      const result = res.data;

      const extractedJD: ExtractedJD = {
        domain: '',
        domain_confidence: 0,
        threshold_score: 70,
        raw_jd_text: result.generated_jd_text,
        job_data: {
          title: result.suggested_title || 'Job Opening',
          description: result.generated_jd_text,
          location: result.suggested_location ?? null,
          salary: result.suggested_salary ?? null,
          target_headcount: 1,
        },
        sections: [],
        criteria: { mandatory_criteria: {}, screening_criteria: {} },
      };

      toast.success('JD generated — review and continue.');
      onComplete(extractedJD);
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Failed to generate JD. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Describe the role in your own words
        </Label>
        <Textarea
          placeholder="e.g. We need a senior backend engineer with Python and FastAPI experience, 4+ years, remote-friendly, based in Bangalore. They'll own our data pipeline and work closely with the product team."
          className="min-h-36 text-sm resize-none"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={isGenerating}
        />
        <p className="text-xs text-muted-foreground">
          The more detail you add, the better the JD. But even a short description works — AI will fill in the gaps.
        </p>
      </div>

      {/* Nudge chips */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground font-medium">Try an example →</p>
        <div className="flex flex-wrap gap-2">
          {NUDGES.map((nudge) => (
            <button
              key={nudge}
              type="button"
              onClick={() => setPrompt(nudge)}
              className="text-xs px-2.5 py-1 rounded-full border border-border bg-muted/40 hover:bg-muted hover:border-primary/40 transition-colors text-muted-foreground hover:text-foreground"
            >
              {nudge}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end pt-1">
        <Button onClick={handleGenerate} disabled={isGenerating}>
          {isGenerating ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating JD…</>
          ) : (
            <><Sparkles className="w-4 h-4 mr-2" /> Generate JD</>
          )}
        </Button>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function JDSourceStep({ onComplete }: Props) {
  const [mode, setMode] = useState<Mode>(null);

  // Method selection screen
  if (!mode) {
    return (
      <div className="w-full px-8 py-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-xl font-bold text-foreground mb-2">How would you like to create the Job Description?</h2>
            <p className="text-muted-foreground">
              Upload an existing document or let AI generate one from your requirements.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Upload card */}
            <button
              onClick={() => setMode('upload')}
              className="group text-left border-2 border-border rounded-2xl p-8 hover:border-primary hover:bg-primary/5 transition-all focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                <Upload className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Upload JD</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Have an existing job description? Upload a PDF, DOCX, or TXT file and we'll extract the details automatically.
              </p>
              <div className="mt-5 flex items-center gap-1 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                Choose this <ChevronRight className="w-4 h-4" />
              </div>
            </button>

            {/* AI builder card */}
            <button
              onClick={() => setMode('ai')}
              className="group text-left border-2 border-border rounded-2xl p-8 hover:border-primary hover:bg-primary/5 transition-all focus:outline-none focus:ring-2 focus:ring-primary relative overflow-hidden"
            >
              <div className="absolute top-3 right-3">
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">AI</span>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-5 group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors">
                <Sparkles className="w-7 h-7 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Build with AI</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Answer a few questions about the role and we'll generate a polished job description using AI.
              </p>
              <div className="mt-5 flex items-center gap-1 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                Choose this <ChevronRight className="w-4 h-4" />
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Upload mode
  if (mode === 'upload') {
    return (
      <div className="w-full px-8 py-6">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => setMode(null)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Back to method selection
          </button>
          <UploadPath onComplete={onComplete} />
        </div>
      </div>
    );
  }

  // AI mode
  return (
    <div className="w-full px-8 py-6">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => setMode(null)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back to method selection
        </button>
        <div className="mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            Build JD with AI
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Fill in the details below and we'll generate a professional job description.
            You can review and edit it in the next step.
          </p>
        </div>
        <AIPromptPath onComplete={onComplete} />
      </div>
    </div>
  );
}
