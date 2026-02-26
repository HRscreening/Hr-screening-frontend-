import React from 'react'
import StepIndicator from '@/components/jobs/createJob/stepIndicator'
import { Upload, FileText, Sparkles, CalendarDays} from 'lucide-react';
import UploadJd from '@/components/jobs/createJob/uploadJd';
import { toast } from 'sonner';
import { type ExtractedJD } from '@/types/types';
import JobForm from '@/components/jobs/createJob/jobForm';
import InterviewForm from '@/components/jobs/createJob/InterviewForm';
import ManageCriterias from '@/components/jobs/createJob/manageCriterias';
import Loader from '@/components/loader';
import axios from "@/axiosConfig"
import { useNavigate } from 'react-router-dom';


const steps = [
  {
    number: 1,
    title: 'Upload JD',
    description: 'Upload job description',
    icon: Upload
  },
  {
    number: 2,
    title: 'Basic Details',
    description: 'Fill essential information',
    icon: FileText
  },
  {
    number: 3,
    title: 'Interview Setup',
    description: 'Configure interview rounds (optional)',
    icon: CalendarDays
  },
  {
    number: 4,
    title: 'Create & Review Criteria',
    description: 'Finalize and publish',
    icon: Sparkles
  }
];

const CreateJob = () => {

  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = React.useState<number>(1);
  const [extractedJData, setExtractedJobData] = React.useState<ExtractedJD | null>(null);

  const jobFormRef = React.useRef<{ submit: () => void } | null>(null);
  const interviewFormRef = React.useRef<{ submit: () => void } | null>(null);
  const criteriaRef = React.useRef<{ submit: () => void } | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);





  const handleNext = () => {

    if (currentStep === 1 && !extractedJData) {
      toast.error('Please upload a job description to proceed.');
      return;
    }

    if (currentStep === 2) {
      jobFormRef.current?.submit();
      return;
    }

    if (currentStep === 3) {
      interviewFormRef.current?.submit();
      return;
    }

    if (currentStep === 4) {
      criteriaRef.current?.submit();
      return;
    }

    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };



  const handlePrevious = () => {

    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (stepNumber: number) => {
    setCurrentStep(stepNumber);
  };

  async function handleCreateJob() {
    try {
      setLoading(true);
      console.log("Creating job with data:", extractedJData);
      const response = await axios.post('/jobs/add-new-job', extractedJData);

      if (response.status === 201) {
        toast.success('Job created successfully!');
        navigate(`/jobs/${response.data.job_id}`, { replace: true });
      }

    } catch (error) {
      console.log('Error creating job:', error);
      toast.error('Failed to create job. Please try again.');
    }
    finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <StepIndicator steps={steps} currentStep={currentStep} handleNext={handleNext} handlePrevious={handlePrevious
      } handleStepClick={handleStepClick} />

      {
        currentStep === 1 && (
          <UploadJd setExtractedJobData={setExtractedJobData} setCurrentStep={setCurrentStep} />
        )
      }

      {
        currentStep === 2 && extractedJData && (
          <JobForm
            ref={jobFormRef}
            extractedJD={extractedJData}
            onUpdate={(updatedJD) => setExtractedJobData(updatedJD)}
            onNext={() => setCurrentStep(3)}
          />

        )
      }

      {
        currentStep === 3 && (
          // ✅ Correct
          <InterviewForm
            ref={interviewFormRef}
            interviewDetails={extractedJData?.interview_details}
            onUpdate={(details) =>
              setExtractedJobData(prev => prev ? { ...prev, interview_details: details } : prev)
            }
            onNext={() => setCurrentStep(4)}   
          />
        )
      }

      {
        currentStep === 4 && extractedJData?.criteria && (
          <ManageCriterias
            ref={criteriaRef}
            extractedJD={extractedJData}
            onUpdate={(updatedJD) => setExtractedJobData(updatedJD)}
            onNext={handleCreateJob}
          />
        )
      }

      {
        loading && <Loader text='Creating You New Job' />
      }


    </div>
  )
}

export default CreateJob
