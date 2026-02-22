import React from 'react'
import StepIndicator from '@/components/jobs/createJob/stepIndicator'
import { Upload, FileText, Sparkles } from 'lucide-react';
import UploadJd from '@/components/jobs/createJob/uploadJd';
import { toast } from 'sonner';
import { type ExtractedJD } from '@/types/types';
import JobForm from '@/components/jobs/createJob/jobForm';
import ManageCriterias from '@/components/jobs/createJob/manageCriterias';
import axios from "@/axiosConfig"
import { useNavigate } from 'react-router-dom';

const steps = [
  { number: 1, title: 'Upload JD', description: 'Upload job description', icon: Upload },
  { number: 2, title: 'Basic Details', description: 'Fill essential information', icon: FileText },
  { number: 3, title: 'Set Rubric', description: 'Review & finalize rubric', icon: Sparkles },
];

// Friendly status messages shown during rubric generation
const RUBRIC_GENERATION_STATUSES = [
  { delay: 0, msg: "Reading your job description…" },
  { delay: 4000, msg: "Extracting must-have requirements…" },
  { delay: 9000, msg: "Grouping skills and competencies…" },
  { delay: 15000, msg: "Assigning weights by importance…" },
  { delay: 22000, msg: "Identifying location & degree constraints…" },
  { delay: 30000, msg: "Validating rubric structure…" },
  { delay: 40000, msg: "Almost there — polishing the final rubric…" },
];

const CreateJob = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = React.useState<number>(1);
  const [extractedJData, setExtractedJobData] = React.useState<ExtractedJD | null>(null);
  const jobFormRef = React.useRef<{ submit: () => void } | null>(null);
  const criteriaRef = React.useRef<{ submit: () => void } | null>(null);

  /** Global loading state — also disables the Next button */
  const [loading, setLoading] = React.useState<boolean>(false);

  /** Current friendly status message shown during rubric generation */
  const [statusMsg, setStatusMsg] = React.useState<string>("");

  /** Timers cleanup ref for status messages */
  const statusTimersRef = React.useRef<ReturnType<typeof setTimeout>[]>([]);

  const startStatusMessages = () => {
    // Clear any previous timers
    statusTimersRef.current.forEach(clearTimeout);
    statusTimersRef.current = [];
    setStatusMsg(RUBRIC_GENERATION_STATUSES[0].msg);

    for (const { delay, msg } of RUBRIC_GENERATION_STATUSES) {
      if (delay === 0) continue; // already set above
      const timer = setTimeout(() => setStatusMsg(msg), delay);
      statusTimersRef.current.push(timer);
    }
  };

  const stopStatusMessages = () => {
    statusTimersRef.current.forEach(clearTimeout);
    statusTimersRef.current = [];
    setStatusMsg("");
  };

  /**
   * Step 2 → Step 3:
   * Sends raw_jd_text + job_data (temp JSON) to AI for rubric generation.
   * No DB writes here.
   */
  const generateRubricAndGoNext = async (updatedJD: ExtractedJD) => {
    if (!updatedJD?.raw_jd_text) {
      toast.error("Missing raw JD text — please go back and re-upload.");
      return;
    }

    try {
      setLoading(true);
      startStatusMessages();

      const resp = await axios.post("/jobs/generate-rubric-preview", {
        raw_jd_text: updatedJD.raw_jd_text,
        job_data: updatedJD.job_data,
      });

      if (resp.status !== 200) {
        toast.error("Failed to generate rubric. Please try again.");
        return;
      }

      const rubricData = resp.data;
      setExtractedJobData({
        ...rubricData,
        job_data: updatedJD.job_data,   // keep user's form data authoritative
        raw_jd_text: updatedJD.raw_jd_text,
      });
      setCurrentStep(3);
      toast.success("Rubric ready — review and adjust as needed.");
    } catch (e) {
      console.error("Rubric generation failed:", e);
      const err = e as any;
      const detail = err?.response?.data?.detail || err?.response?.data?.message;
      toast.error(detail ? String(detail) : "Rubric generation failed. Please try again.");
    } finally {
      setLoading(false);
      stopStatusMessages();
    }
  };

  const handleNext = () => {
    if (loading) return; // prevent double-click

    if (currentStep === 1 && !extractedJData) {
      toast.error('Please upload a job description first.');
      return;
    }
    if (currentStep === 2) {
      jobFormRef.current?.submit();
      return;
    }
    if (currentStep === 3) {
      criteriaRef.current?.submit();
      return;
    }
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (loading) return;
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleStepClick = (stepNumber: number) => {
    if (loading) return;
    if (stepNumber < currentStep) setCurrentStep(stepNumber);
  };

  /**
   * Step 3 → DB Write (only place tables are written).
   */
  async function handleSetRubric() {
    if (!extractedJData) { toast.error("Missing job data. Please start over."); return; }
    try {
      setLoading(true);
      setStatusMsg("Creating your job and saving the rubric…");

      const payload = {
        job_data: extractedJData.job_data,
        threshold_score: extractedJData.threshold_score,
        domain: extractedJData.domain,
        raw_jd_text: extractedJData.raw_jd_text ?? null,
        sections: extractedJData.sections,
      };

      const response = await axios.post('/jobs/set-rubric', payload);

      if (response.status === 201) {
        toast.success('Job created successfully! Taking you to the job page…');
        navigate(`/jobs/${response.data.job_id}`, { replace: true });
      }
    } catch (error) {
      console.error('Error setting rubric:', error);
      toast.error('Failed to save job. Please try again.');
    } finally {
      setLoading(false);
      setStatusMsg("");
    }
  }

  return (
    <div className="relative min-h-screen">
      <StepIndicator
        steps={steps}
        currentStep={currentStep}
        loading={loading}
        handleNext={handleNext}
        handlePrevious={handlePrevious}
        handleStepClick={handleStepClick}
      />

      {currentStep === 1 && (
        <UploadJd setExtractedJobData={setExtractedJobData} setCurrentStep={setCurrentStep} />
      )}

      {currentStep === 2 && extractedJData && (
        <JobForm
          ref={jobFormRef}
          extractedJD={extractedJData}
          onUpdate={(updatedJD) => setExtractedJobData(updatedJD)}
          onNext={generateRubricAndGoNext}
        />
      )}

      {currentStep === 3 && extractedJData?.sections && (
        <ManageCriterias
          ref={criteriaRef}
          extractedJD={extractedJData}
          onUpdate={(updatedJD) => setExtractedJobData(updatedJD)}
          onNext={handleSetRubric}
        />
      )}

      {/* ── Rubric generation overlay ── */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-6 px-8 py-10 rounded-2xl border border-primary/20 bg-card shadow-2xl max-w-sm w-full mx-4">
            {/* Animated spinner */}
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
              <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
              <div className="absolute inset-2 rounded-full border-2 border-primary/20 border-t-primary/50 animate-spin [animation-duration:1.5s] [animation-direction:reverse]" />
            </div>

            {/* Title */}
            <div className="text-center space-y-1.5">
              <p className="text-base font-semibold text-foreground">
                {currentStep === 2 ? "Generating Rubric with AI" : "Saving Your Job"}
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed min-h-[40px] transition-all duration-500">
                {statusMsg || "Processing…"}
              </p>
            </div>

            {/* Progress dots */}
            {currentStep === 2 && (
              <div className="flex items-center gap-2">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full bg-primary animate-bounce"
                    style={{ animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </div>
            )}

            <p className="text-xs text-muted-foreground text-center">
              {currentStep === 2
                ? "This usually takes 20–40 seconds. Please don't close the page."
                : "Saving to database…"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateJob;
