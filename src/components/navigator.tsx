import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useJobs } from "@/hooks/job_hooks/use-jobs";

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  jobs: "Jobs",
  settings: "Settings",
  "create-job": "Create Job",
  rubric: "Rubric",
  edit: "Edit",
  new: "New",
  rounds: "Rounds",
  "add-applications": "Add Applications",
  "track-resumes": "Track Resumes",
  "interview-settings": "Interview Settings",
  analytics: "Analytics",
  "job-info": "Job Info",
};

export default function Navigator() {
  const { pathname } = useLocation();
  const { data: jobs } = useJobs();

  const segments = pathname.split("/").filter(Boolean);

  const crumbs: { label: string; path: string }[] = [
    // { label: "Home", path: "/dashboard" },
  ];

  let cumulativePath = "";
  segments.forEach((segment, index) => {
    cumulativePath += `/${segment}`;

    const prevSegment = segments[index - 1];
    const isJobId = prevSegment === "jobs" && !(segment in SEGMENT_LABELS);

    let label: string;
    if (isJobId) {
      const job = jobs?.find((j: { id: string; title: string }) => j.id === segment);
      label = job ? job.title : "Job";
    } else {
      label = SEGMENT_LABELS[segment] ?? segment;
    }

    crumbs.push({ label, path: cumulativePath });
  });

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <React.Fragment key={crumb.path}>
              {index > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={crumb.path}>{crumb.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
