import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import axios from "@/axiosConfig";
import Loader from "@/components/loader";
import { Button } from "@/components/ui/button";
import ManageCriterias from "@/components/jobs/createJob/manageCriterias";
import { normalizeCriteriaJsonb } from "@/utils/normalizeRubric";

import type { ExtractedJD } from "@/types/types";
import type { JobOverviewResponse } from "@/types/jobTypes";

type Mode = "edit" | "new";

export default function RubricEditorPage({ mode }: { mode: Mode }) {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [jobData, setJobData] = useState<JobOverviewResponse | null>(null);
  const [extractedJD, setExtractedJD] = useState<ExtractedJD | null>(null);

  const criteriaRef = useRef<{ submit: () => void } | null>(null);

  const title = useMemo(() => {
    if (mode === "new") return "Create new rubric version";
    return "Edit rubric (creates new version)";
  }, [mode]);

  useEffect(() => {
    const load = async () => {
      if (!jobId) return;
      try {
        setIsLoading(true);
        const res = await axios.get(`/jobs/get-job/${jobId}`);
        if (res.status !== 200) throw new Error("Failed to load job");

        const data = res.data as JobOverviewResponse;
        setJobData(data);

        const criteriaJsonb = normalizeCriteriaJsonb(data.criteria.criteria);
        const domain = String((data.settings?.job_metadata as any)?.domain ?? "other");

        const next: ExtractedJD = {
          domain,
          domain_confidence: 1,
          job_data: {
            title: data.job.title,
            description: (data as any)?.job?.description ?? "",
            location: (data as any)?.job?.location ?? null,
            salary: (data as any)?.job?.salary ?? null,
            target_headcount: data.job.target_headcount,
          },
          threshold_score: data.criteria.threshold_score ?? 0,
          raw_jd_text: (data as any)?.job?.raw_jd_text ?? null,
          sections: criteriaJsonb.sections,
        };
        setExtractedJD(next);
      } catch (e) {
        console.error(e);
        toast.error("Failed to load rubric editor");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [jobId]);

  const save = async () => {
    if (!jobId || !extractedJD) return;
    try {
      const payload = {
        threshold_score: extractedJD.threshold_score,
        sections: extractedJD.sections,
        raw_jd_text: extractedJD.raw_jd_text ?? null,
        // Audit hints (backend still enforces invariants)
        source: "combined",
        created_via: "ui_edit",
        change_reason: mode === "new" ? "copy" : "edit",
        change_type: "major",
      };

      const res = await axios.put(`/jobs/${jobId}/rubric`, payload);
      if (res.status === 200) {
        toast.success("Rubric saved as a new version");
        navigate(`/jobs/${jobId}`, { replace: true });
        return;
      }
      toast.error("Failed to save rubric");
    } catch (e) {
      console.error(e);
      toast.error("Failed to save rubric");
    }
  };

  if (isLoading) return <Loader />;
  if (!jobData || !extractedJD) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm text-muted-foreground">{jobData.job.title}</div>
          <h1 className="text-xl font-semibold truncate">{title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate(`/jobs/${jobId}`)}>
            Cancel
          </Button>
          <Button onClick={() => criteriaRef.current?.submit()}>Save rubric</Button>
        </div>
      </div>

      <ManageCriterias
        ref={criteriaRef}
        extractedJD={extractedJD}
        onUpdate={setExtractedJD}
        onNext={save}
      />
    </div>
  );
}

