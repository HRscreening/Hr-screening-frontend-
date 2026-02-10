import React, { useState, useRef } from 'react';
import { Upload, FileText, X, CheckCircle2, AlertCircle } from 'lucide-react';
import axios from '@/axiosConfig';
import Loader from '@/components/loader';

interface UploadJdProps {
  setCurrentStep: (step: number) => void;
  setExtractedJobData: (data: any) => void;
}


const UploadJd = ({ setExtractedJobData, setCurrentStep, }: UploadJdProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };



  const handleFile = (file: File) => {
    setError('');

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a PDF, DOC, DOCX, or TXT file');
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setUploadedFile(file);
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };



  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };




  // const handleContinue = async () => {
  //   try {

  //     const formData = new FormData();
  //     if (uploadedFile) {
  //       formData.append('file', uploadedFile);
  //     } else {
  //       setError('No file uploaded');
  //       return;
  //     }

  //     await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate loading time
  //     // const response = await axios.post('/jobs/upload-jd', formData);

  //     setTimeout(() => {
  //     }, 2000);
  //     // if (response.status === 200) {
  //     //   // Proceed to next step
  //     //   setExtractedJobData(response.data);
  //     //   setCurrentStep(2);
  //     //   console.log('File uploaded successfully');
  //     // } else {
  //     //   console.log(response.data);

  //     //   setError('Failed to upload file. Please try again.');
  //     // }

  //   } catch (error) {
  //     console.error('Error uploading file:', error);
  //     setError('An error occurred while uploading the file. Please try again.');
  //   }
  //     setIsLoading(false);


  // }

  const handleContinue = async () => {
    try {
      if (!uploadedFile) {
        setError('No file uploaded');
        return;
      }

      setError('');
      setIsLoading(true);

      const formData = new FormData();
      formData.append('file', uploadedFile);

      const response = await axios.post('/jobs/upload-jd', formData);
      if (response.status === 200) {
        // Proceed to next step
        setExtractedJobData(response.data);
        setCurrentStep(2);
        console.log('File uploaded successfully');
      } else {
        console.log(response.data);

        setError('Failed to upload file. Please try again.');
      }

    } catch (error) {
      console.error('Error uploading file:', error);
      setError('An error occurred while uploading the file.');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <>
      {isLoading ? (
        <Loader text="Extracting Job Details ....." />
      ) : <div className="w-full px-8 py-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-foreground mb-3">Upload Job Description</h2>
            <p className="text-muted-foreground  text-lg">
              Upload your job description document to get started. We support PDF, DOC, DOCX, and TXT files.
            </p>
          </div>

          {/* Upload Area */}
          <div
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
            relative border-2 border-dashed rounded-xl p-16
            transition-all duration-200
            ${isDragging
                ? 'border-primary bg-primary/5'
                : uploadedFile
                  ? 'border-primary/30 bg-background'
                  : error
                    ? 'border-destructive/40 bg-background'
                    : 'border-border bg-background hover:border-primary/40'
              }
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileInput}
              accept=".pdf,.doc,.docx,.txt"
              className="hidden"
            />

            {!uploadedFile ? (
              <div className="flex flex-col items-center justify-center text-center">
                {/* Upload Icon */}
                <div
                  className={`
                  w-20 h-20 rounded-2xl flex items-center justify-center mb-6
                  transition-all duration-200
                  ${isDragging
                      ? 'bg-primary/20'
                      : 'bg-primary/10'
                    }
                  `}
                >
                  <Upload
                    className={`
                    w-10 h-10 transition-all duration-200
                    ${isDragging ? 'text-primary' : 'text-primary'}
                    `}
                  />
                </div>

                {/* Text Content */}
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    Drag & drop your job description
                  </h3>
                  <p className="text-base text-muted-foreground">
                    or{' '}
                    <button
                      onClick={handleBrowseClick}
                      className="text-primary font-medium hover:underline focus:outline-none"
                    >
                      browse files
                    </button>
                  </p>
                </div>

                {/* Supported Formats - Dot Style */}
                <div className="flex items-center gap-8 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-sm text-muted-foreground">PDF</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-sm text-muted-foreground">DOC</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-sm text-muted-foreground">DOCX</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-sm text-muted-foreground">TXT</span>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">
                  Maximum file size: 10MB
                </p>
              </div>
            ) : (
              // Uploaded File Preview
              <div className="flex items-center justify-between p-6 bg-primary/5 rounded-xl border border-primary/20">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <FileText className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="font-semibold text-foreground text-lg">{uploadedFile.name}</h4>
                      <CheckCircle2 className="w-5 h-5 text-success" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(uploadedFile.size)} • {uploadedFile.type.split('/')[1].toUpperCase()}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleRemoveFile}
                  className="w-10 h-10 rounded-lg hover:bg-muted
                flex items-center justify-center transition-colors group ml-4"
                  title="Remove file"
                >
                  <X className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                </button>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-destructive mb-1">Upload Error</h4>
                <p className="text-sm text-destructive/90">{error}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {uploadedFile && !error && (
            <div className="mt-8 flex items-center justify-between gap-4">
              <button
                onClick={handleRemoveFile}
                className="px-5 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground 
              hover:bg-muted rounded-lg transition-all"
              >
                Upload Different File
              </button>

              <button
                onClick={handleContinue}
                className="px-6 py-2.5 text-sm font-medium bg-primary text-primary-foreground 
              rounded-lg hover:bg-hover-primary shadow-sm hover:shadow-md 
              transition-all active:scale-95"
              >
                Continue
              </button>
            </div>
          )}
        </div>
      </div>
      }
    </>
  );
};

export default UploadJd;