"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "react-router-dom";
import axios from "@/axiosConfig";

// shadcn/ui
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";

// Icons
import {
  Star,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Zod Schema
// ─────────────────────────────────────────────────────────────────────────────

const buildSchema = (criterias: string[]) => {
  const criteriaFields: Record<string, z.ZodTypeAny> = {};
  criterias.forEach((_, i) => {
    criteriaFields[`rating_${i}`] = z
      .number({ message: "Rating is required" })
      .min(1, "Rating is required")
      .max(10);
    criteriaFields[`comment_${i}`] = z.string().optional();
  });

  return z.object({
    ...criteriaFields,
    final_verdict: z.enum(["Hire", "No Hire"], {
      message: "Please select an option",
    }),
  });
};

type FormValues = Record<string, any>;

// ─────────────────────────────────────────────────────────────────────────────
// StarRating Component
// ─────────────────────────────────────────────────────────────────────────────

interface StarRatingProps {
  value: number;
  onChange: (val: number) => void;
  error?: boolean;
}

function StarRating({ value, onChange, error }: StarRatingProps) {
  const [hovered, setHovered] = useState<number>(0);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }, (_, i) => i + 1).map((star) => {
          const active = star <= (hovered || value);
          return (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              className="group p-0.5 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded"
            >
              <Star
                className={`h-5 w-5 transition-colors duration-100 ${active
                  ? "fill-amber-400 text-amber-400"
                  : error
                    ? "fill-transparent text-rose-300"
                    : "fill-transparent text-slate-300 group-hover:text-amber-300"
                  }`}
              />
            </button>
          );
        })}
        {value > 0 && (
          <span className="ml-2 text-sm font-semibold tabular-nums text-amber-500">
            {value}
            <span className="text-muted-foreground font-normal">/5</span>
          </span>
        )}
      </div>
      {error && !value && (
        <p className="text-xs text-destructive">Rating is required</p>
      )}
    </div>
  );
}



// ─────────────────────────────────────────────────────────────────────────────
// StatusScreen
// ─────────────────────────────────────────────────────────────────────────────

function StatusScreen({
  title,
  message,
}: {
  title: string;
  message?: string;
}) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center pt-4 sm:pt-8 px-4">
      <div className="max-w-2xl w-full">
        <div className="w-full h-1.5 bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 rounded-t-xl shadow-sm" />
        <Card className="rounded-t-none border-t-0 shadow-sm border-slate-200/60 overflow-hidden">
          <CardContent className="p-6 sm:p-10 space-y-4">
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900">
              {title}
            </h1>
            <div className="pt-2 pb-6 border-b border-slate-100">
              <p className="text-[15px] text-slate-600 leading-relaxed">
                {message || "Your evaluation has been successfully recorded in DeskZero."}
              </p>
            </div>
            <div className="pt-6">
              <Button 
                variant="ghost" 
                className="text-indigo-600 hover:bg-indigo-50 p-0 h-auto font-medium"
                onClick={() => window.location.reload()}
              >
                Submit another response
              </Button>
            </div>
          </CardContent>
        </Card>
        <p className="text-[11px] text-slate-400 mt-8 text-center text-center">
          Powered by <span className="font-semibold text-slate-600">DeskZero</span>
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section wrapper for visual consistency
// ─────────────────────────────────────────────────────────────────────────────



// ─────────────────────────────────────────────────────────────────────────────
// AssessmentFormPage — main component
// Route: /assessment?token=<jwt>
// ─────────────────────────────────────────────────────────────────────────────

export default function AssessmentFormPage() {
  const location = useLocation();
  const token = new URLSearchParams(location.search).get("token");

  // const [criterias, setCriterias] = useState<string[]>(["Technical Skills", "Communication", "Cultural Fit"]);
  // const [loading, setLoading] = useState(false);
  const [criterias, setCriterias] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);


  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Build dynamic schema once criterias are loaded
  const schema = buildSchema(criterias);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: {},
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  useEffect(() => {
    if (!token) {
      setFetchError(
        "No token found. Please use the link from your invitation."
      );
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const res = await axios.get(`/assessment/get-criterias?token=${token}`);
        // console.log("Fetched criterias:", res.data);
        setCriterias(res.data);
      } catch (err: any) {
        setFetchError(
          err?.response?.data?.detail ||
          err?.response?.data?.message ||
          "Failed to load assessment. Please use the link from your invitation."
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const criteria_ratings = criterias.map((criteria, i) => ({
        criteria,
        rating: values[`rating_${i}`],
        comment: values[`comment_${i}`] || null,
      }));

      const payload = {
        criteria_ratings,
        final_verdict: values.final_verdict,
      };
      console.log("Submitting payload:", payload);
      await axios.post(`/assessment/submit/${token}`, payload);
      setSubmitSuccess(true);
      toast.success("Assessment submitted successfully!");
    } catch (err: any) {
      toast.error(
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-7 w-7 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Loading assessment…</p>
        </div>
      </div>
    );
  }

  // ── Fetch error ─────────────────────────────────────────────────────────────
  if (fetchError) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center pt-4 sm:pt-8 px-4">
        <div className="max-w-2xl w-full">
          <div className="w-full h-1.5 bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 rounded-t-xl shadow-sm" />
          <Card className="rounded-t-none border-t-0 shadow-sm border-slate-200/60 overflow-hidden">
            <CardContent className="p-6 sm:p-10 space-y-4">
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900">
                Assessment Not Available
              </h1>
              <div className="pt-2 pb-6 border-b border-slate-100">
                <p className="text-[15px] text-slate-600 leading-relaxed">
                  {fetchError}
                </p>
              </div>
              <p className="text-[14px] text-slate-500 pt-4">
                If you believe this is an error, please contact the recruitment team.
              </p>
              <div className="pt-6">
                <Button 
                  variant="ghost" 
                  className="text-indigo-600 hover:bg-indigo-50 p-0 h-auto font-medium"
                  onClick={() => window.location.reload()}
                >
                  Reload page
                </Button>
              </div>
            </CardContent>
          </Card>
          <p className="text-[11px] text-slate-400 mt-8 text-center text-center">
            Powered by <span className="font-semibold text-slate-600">DeskZero</span>
          </p>
        </div>
      </div>
    );
  }

  // ── Success ─────────────────────────────────────────────────────────────────
  if (submitSuccess) {
    return (
      <StatusScreen
        title="Assessment Submitted!"
        message="Thank you for completing the candidate assessment."
      />
    );
  }

  // ── Main render ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto pt-4 sm:pt-8 px-4 text-center mb-2">
         {/* Custom Branding Element */}
         <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100/50">
            <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600/80">DeskZero Assessment</span>
         </div>
      </div>

      <div className="max-w-2xl mx-auto px-4">
        <div className="w-full h-1.5 bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 rounded-t-xl shadow-sm" />
        <Card className="rounded-t-none border-t-0 shadow-sm border-slate-200/60 overflow-hidden">
          <CardContent className="p-6 sm:p-10 space-y-4">
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900">
              Candidate Evaluation
            </h1>
            <p className="text-[15px] text-slate-500 leading-relaxed max-w-prose">
              Please provide your honest feedback regarding the candidate's performance during the interview session.
            </p>
            <div className="pt-4 border-t border-slate-100">
              <p className="text-[13px] font-medium text-indigo-600/70 flex items-center gap-1.5">
                <span className="text-rose-500">*</span> Required response
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto px-4 mt-6 space-y-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

            {/* ── Criteria Cards ────────────────────────────────────────────── */}
            {criterias.map((criteria, i) => (
              <Card
                key={i}
                className="border-slate-200/60 shadow-sm overflow-hidden hover:border-indigo-200/50 transition-colors"
              >
                <CardContent className="p-6 sm:p-10 space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="text-base font-normal text-foreground">
                        {criteria} <span className="text-destructive">*</span>
                      </h3>
                    </div>

                    <FormField
                      control={form.control}
                      name={`rating_${i}`}
                      render={({ field, fieldState }) => (
                        <FormItem className="space-y-3">
                          <label className="text-sm font-medium text-muted-foreground">
                            Rating (1-5)
                          </label>
                          <StarRating
                            value={field.value ?? 0}
                            onChange={field.onChange}
                            error={!!fieldState.error}
                          />
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-3 pt-2">
                      <label className="text-sm font-medium text-muted-foreground">
                        Observations / Reason (optional)
                      </label>
                      <Controller
                        control={form.control}
                        name={`comment_${i}`}
                        render={({ field }) => (
                          <Textarea
                            {...field}
                            placeholder="Your answer"
                            className="resize-none border-0 border-b border-slate-200 focus-visible:ring-0 focus-visible:border-b-2 focus-visible:border-indigo-600 rounded-none px-0 min-h-[40px] bg-transparent transition-all placeholder:text-slate-300"
                            rows={1}
                          />
                        )}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

 
            {/* ── Final Verdict ────────────────────────────────────────────── */}
            <Card className="border-slate-200/60 shadow-sm overflow-hidden hover:border-indigo-200/50 transition-colors">
              <CardContent className="p-6 sm:p-10 space-y-6">
                <div className="space-y-4">
                  <h3 className="text-base font-semibold text-slate-800">
                    Final Verdict <span className="text-rose-500">*</span>
                  </h3>

                  <FormField
                    control={form.control}
                    name="final_verdict"
                    render={({ field, fieldState }) => (
                      <FormItem className="space-y-3">
                        <div className="space-y-3">
                          {[
                            { value: "Hire", label: "Hire" },
                            { value: "No Hire", label: "No Hire" },
                          ].map((opt) => (
                            <div key={opt.value} className="flex items-center space-x-3 group cursor-pointer" onClick={() => field.onChange(opt.value)}>
                              <div
                                className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all ${field.value === opt.value
                                    ? "border-primary bg-white"
                                    : "border-muted-foreground/40 bg-white group-hover:border-muted-foreground/60"
                                  }`}
                              >
                                {field.value === opt.value && (
                                  <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                                )}
                              </div>
                              <span className="text-[14px] text-foreground font-normal">
                                {opt.label}
                              </span>
                            </div>
                          ))}
                        </div>
                        {fieldState.error && (
                          <FormMessage className="text-xs" />
                        )}
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* ── Submit ─────────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between pt-4">
              <Button
                type="submit"
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 h-10 rounded text-[14px] font-medium transition-all shadow-sm"
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Submit"}
              </Button>
              <button 
                type="button"
                onClick={() => form.reset()}
                className="text-[14px] text-primary hover:bg-primary/5 px-4 py-2 rounded font-medium transition-all"
              >
                Clear form
              </button>
            </div>
            
            <p className="text-[11px] text-muted-foreground mt-4 text-center">
              Never submit passwords through Google Forms.
            </p>
          </form>
        </Form>
      </div>
    </div>
  );
}