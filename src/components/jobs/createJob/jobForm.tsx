import { useImperativeHandle, forwardRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';
import { type ExtractedJD } from '@/types/types';
import ParsedJdViewer from './parsedJdViewer';
import { Button } from '@/components/ui/button';

// Form validation schema
const jobFormSchema = z.object({
  title: z.string().min(1, 'Job title is required').max(200, 'Title is too long'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  location: z.string().optional(),
  salary: z.string().optional(),
  target_headcount: z
    .number()
    .min(1, 'Must hire at least 1 person')
    .max(1000, 'Target headcount seems too high'),
  voice_ai_enabled: z.boolean(),
  is_confidential: z.boolean(),
  manual_rounds_count: z.number().min(0).max(10).optional(),
});

type JobFormValues = z.infer<typeof jobFormSchema>;

interface JobFormProps {
  extractedJD: ExtractedJD;
  onUpdate: (updatedJD: ExtractedJD) => void;
  onNext?: (updatedJD: ExtractedJD) => void | Promise<void>;
}

const JobForm = forwardRef(function JobForm(
  { extractedJD, onUpdate, onNext }: JobFormProps,
  ref
) {
  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      title: extractedJD.job_data.title || '',
      description: extractedJD.job_data.description || '',
      location: extractedJD.job_data.location || '',
      salary: extractedJD.job_data.salary || '',
      target_headcount: extractedJD.job_data.target_headcount || 1,
      voice_ai_enabled: extractedJD.job_data.voice_ai_enabled || false,
      is_confidential: extractedJD.job_data.is_confidential || false,
      manual_rounds_count: extractedJD.job_data.manual_rounds_count || 0,
    },
  });

  const onSubmit = (values: JobFormValues) => {
    // Collect all user-entered details into the temp JSON (no DB write yet)
    const updatedJD: ExtractedJD = {
      ...extractedJD,
      job_data: {
        ...extractedJD.job_data,
        ...values,
      },
    };

    onUpdate(updatedJD);
    // Pass updatedJD so the parent has the freshest data for rubric generation
    void onNext?.(updatedJD);
  };

  useImperativeHandle(ref, () => ({

    submit: form.handleSubmit(onSubmit),
  }));

  const [showParsedJd, setShowParsedJd] = useState(false);

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      {/* Info banner — rubric will be generated on next step */}
      <div className="mb-6 p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-start gap-3">
        <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-foreground">Complete your job details below</p>
          <p className="text-xs text-muted-foreground mt-1">
            Fill in or edit the details extracted from your JD. Location, salary, and degree information
            you enter here will be used by AI when generating the rubric on the next step.
          </p>
        </div>
      </div>

      {/* Parsed JD Viewer (Collapsible) */}
      {extractedJD._rrg && (
        <Card className="mb-6 border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Parsed Job Description</CardTitle>
                <CardDescription className="text-sm">
                  AI-extracted information from your uploaded JD
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowParsedJd(!showParsedJd)}
                className="gap-2"
              >
                {showParsedJd ? (
                  <>
                    Hide <ChevronUp className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    View Details <ChevronDown className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          {showParsedJd && (
            <CardContent className="pt-0">
              <ParsedJdViewer parsedJd={extractedJD._rrg} />
            </CardContent>
          )}
        </Card>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information Card */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Essential details about the job position
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Title *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Senior Software Engineer" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Description *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the role, responsibilities, and requirements..."
                        className="min-h-50 resize-y"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Provide a comprehensive description of the role
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Job Details Card */}
          <Card>
            <CardHeader>
              <CardTitle>Job Details</CardTitle>
              <CardDescription>
                Additional information about the position — used for rubric generation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., New York, NY (Remote)" {...field} />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Will be used by AI to set location constraints in rubric
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="salary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Salary Range</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., $100k - $150k" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="target_headcount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Headcount *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          placeholder="1"
                          value={field.value ?? 1}
                          onChange={(e) => {
                            const raw = e.target.value;
                            field.onChange(raw === "" ? 1 : Number(raw));
                          }}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                        />
                      </FormControl>
                      <FormDescription>Number of positions to fill</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="manual_rounds_count"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Manual Interview Rounds</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={10}
                          placeholder="0"
                          value={field.value ?? 0}
                          onChange={(e) => {
                            const raw = e.target.value;
                            field.onChange(raw === "" ? 0 : Number(raw));
                          }}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                        />
                      </FormControl>
                      <FormDescription>Number of manual interview rounds</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Settings Card */}
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
              <CardDescription>
                Configure additional job posting options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="voice_ai_enabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Enable Voice AI Screening</FormLabel>
                      <FormDescription>
                        Use AI-powered voice interviews for initial candidate screening
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_confidential"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Confidential Job Posting</FormLabel>
                      <FormDescription>
                        Hide company information from the public job listing
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Hidden submit button - can be triggered from parent */}
          <button type="submit" id="job-form-submit" className="hidden">
            Submit
          </button>
        </form>
      </Form>
    </div>
  );
});

export default JobForm;