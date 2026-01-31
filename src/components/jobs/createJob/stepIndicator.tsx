import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Upload, FileText, Sparkles } from 'lucide-react';
import { Separator } from "@/components/ui/separator";

interface StepIndicatorProps {
  currentStep: number;
  steps: {
    number: number;
    title: string;
    description: string;
    icon: React.ComponentType<any>;
  }[];
  handleStepClick: (stepNumber: number) => void;
  handleNext: () => void;
  handlePrevious: () => void;

}



const StepIndicator = ({ steps, currentStep, handleNext, handlePrevious, handleStepClick }: StepIndicatorProps) => {






  return (
    <div className="w-full bg-card border-b rounded-lg border sticky top-0 z-100">
      <div className="flex flex-col w-full items-center text-center">
        <h2 className="text-xl font-bold">Create Job</h2>
        <p className="text-sm text-muted-foreground mb-1">
          Fill in the details to create a new job listing
        </p>
        <Separator orientation='horizontal'/>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-5">
        <div className="flex items-center justify-between gap-8">
          {/* Steps */}
          <div className="flex-1 flex items-center justify-center gap-4">
            {steps.map((step, index) => {
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;
              const Icon = step.icon;

              return (
                <React.Fragment key={step.number}>
                  <button
                    // onClick={() => handleStepClick(step.number)}
                    className="group flex items-center gap-3 transition-all duration-300"
                  >
                    <div
                      className={`
                        relative w-11 h-11 rounded-xl flex items-center justify-center
                        transition-all duration-300
                        ${isActive
                          ? 'bg-primary shadow-md shadow-primary/25'
                          : isCompleted
                            ? 'bg-primary/10 border-2 border-primary hover:bg-primary/20'
                            : 'bg-muted border-2 border-border hover:border-muted-foreground/30'}
                        ${!isActive && 'group-hover:scale-105'}
                      `}
                    >
                      {isCompleted && !isActive ? (
                        <svg
                          className="w-5 h-5 text-primary"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="3"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        <Icon
                          className={`w-5 h-5 transition-colors ${isActive
                              ? 'text-primary-foreground'
                              : isCompleted
                                ? 'text-primary'
                                : 'text-muted-foreground'
                            }`}
                        />
                      )}
                    </div>

                    <div className="text-left">
                      <div
                        className={`
                          font-semibold text-sm transition-colors
                          ${isActive ? 'text-primary' : isCompleted ? 'text-foreground' : 'text-muted-foreground'}
                        `}
                      >
                        {step.title}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {step.description}
                      </div>
                    </div>
                  </button>

                  {index < steps.length - 1 && (
                    <div className="flex-1 max-w-30 h-0.5 bg-border relative">
                      <div
                        className="absolute inset-0 bg-primary transition-all duration-500"
                        style={{
                          width: currentStep > step.number ? '100%' : '0%'
                        }}
                      />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className={`
                flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium
                transition-all duration-200
                ${currentStep === 1
                  ? 'text-muted-foreground cursor-not-allowed opacity-40'
                  : 'text-foreground hover:bg-accent active:scale-95'}
              `}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            <div className="text-xs font-medium text-muted-foreground px-3">
              Step {currentStep} of {steps.length}
            </div>

            <button
              onClick={handleNext}
              // disabled={currentStep === steps.length}
              className={`
                flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium
                transition-all duration-200
                bg-primary text-primary-foreground hover:bg-hover-primary shadow-sm active:scale-95'
                `}
            >
              {currentStep === steps.length ? 'Complete' : 'Next'}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepIndicator;