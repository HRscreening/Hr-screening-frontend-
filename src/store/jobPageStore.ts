// src/store/jobPageStore.ts
//
// Centralised state for the Job-overview page.
// Eliminates prop-drilling of jobId, jobData, activeVersion, max_round, etc.
//
// React-Query migration note:
//   When you add React Query, move the fetch logic (fetchJobData / fetchRubricVersions)
//   into custom query hooks and keep this store for **client-only UI state**
//   (activeVersion, versionData derived from query cache, etc.).
//   The store shape intentionally separates "server data" from "UI state" to make
//   that migration straightforward.

import { create } from "zustand";
import type { JobOverviewResponse } from "@/types/newJobType";
import type { RubricVersionData } from "@/types/jobTypes";

/* ------------------------------------------------------------------ */
/*  State shape                                                        */
/* ------------------------------------------------------------------ */

interface JobPageState {
  /* ---- identifiers ---- */
  jobId: string | null;

  /* ---- server data (will move to React Query) ---- */
  jobData: JobOverviewResponse | null;
  versionData: RubricVersionData | null;
  isLoading: boolean;

  /* ---- UI state ---- */
  activeVersion: string | undefined;
}

/* ------------------------------------------------------------------ */
/*  Actions                                                            */
/* ------------------------------------------------------------------ */

interface JobPageActions {
  /** Call once when the page mounts / jobId changes. Resets stale data. */
  initJob: (jobId: string) => void;

  setJobData: (data: JobOverviewResponse | null) => void;
  setVersionData: (data: RubricVersionData | null) => void;
  setActiveVersion: (version: string | undefined) => void;
  setIsLoading: (loading: boolean) => void;

  /** Clean up when navigating away from the job page */
  reset: () => void;
}

/* ------------------------------------------------------------------ */
/*  Initial state (handy for reset)                                    */
/* ------------------------------------------------------------------ */

const initialState: JobPageState = {
  jobId: null,
  jobData: null,
  versionData: null,
  isLoading: true,
  activeVersion: undefined,
};

/* ------------------------------------------------------------------ */
/*  Store                                                              */
/* ------------------------------------------------------------------ */

export const useJobPageStore = create<JobPageState & JobPageActions>()(
  (set, get) => ({
    ...initialState,

    initJob: (jobId) => {
      // Only reset if the job actually changed (prevents flicker on re-render)
      if (get().jobId !== jobId) {
        set({ ...initialState, jobId, isLoading: true });
      }
    },

    setJobData: (jobData) => set({ jobData }),
    setVersionData: (versionData) => set({ versionData }),
    setActiveVersion: (activeVersion) => set({ activeVersion }),
    setIsLoading: (isLoading) => set({ isLoading }),

    reset: () => set(initialState),
  })
);

/* ------------------------------------------------------------------ */
/*  Selectors – keep renders tight by selecting only what you need     */
/* ------------------------------------------------------------------ */

/** Use in any deeply-nested component that just needs the jobId */
export const useJobId = () => useJobPageStore((s) => s.jobId);

/** Max interview rounds configured for the job */
export const useMaxRound = () =>
  useJobPageStore((s) => s.jobData?.job.manual_rounds_count ?? 0);

/** Current active rubric version string */
export const useActiveVersion = () =>
  useJobPageStore((s) => s.activeVersion);

/** The criteria overview block from jobData */
export const useCriteriaOverview = () =>
  useJobPageStore((s) => s.jobData?.criteria);

/** Dashboard stats */
export const useDashboard = () => useJobPageStore((s) => s.jobData?.dashboard);

/** Job info (title, status, etc.) */
export const useJobInfo = () => useJobPageStore((s) => s.jobData?.job);
