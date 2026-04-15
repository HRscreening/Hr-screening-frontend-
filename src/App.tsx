import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";

import Home from "@/pages/Home";
import Layout from "@/pages/layout";
import Dashboard from "@/pages/Dashboard";
import Jobs from "@/pages/jobs/Jobs";
import CreateJob from "@/pages/jobs/createJob";
import Settings from "@/pages/settings";
import JobPage from "@/pages/jobs/jobPage";
import RubricEditorPage from "@/pages/jobs/rubricEditor";
import TrackUploadedResumes from "@/pages/jobs/trackUploadedResumes";
import JobInfoPage from "@/pages/jobs/jobInfo";
import InterviewSettings from  "@/pages/jobs/interviewSettings";
import RoundSettings from "@/pages/jobs/rounds"

import NotFound from "@/pages/NotFound";

import RequireAuth from "@/guards/RequireAuth";
import RequireOrgContext from "@/guards/RequireOrgContext";
import RequireOrgRole from "@/guards/RequireOrgRole";

import PanelAvailabilityForm from "@/pages/panelAvailabilityFormcopy";
import PanelistRescheduleAvailabilityForm from "@/pages/panelistRescheduleForm";
import AssessmentPreview from "@/pages/jobs/assessment/assessment_preview";
import AssessmentForm from "@/pages/jobs/assessment/assessment_form";
// import PanelAvailabilityForm from "@/pages/panelAvailabilityForm";
import CandidateSlotBooking from "@/pages/slotBookingPage";
import PublicApplyPage from "@/pages/PublicApplyPage";
import ErrorBoundary from "@/components/ErrorBoundary";
import JobLayout from "@/pages/layouts/jobLayout";
import Analytics from "@/pages/jobs/analytics";
import AddApplications from "./pages/jobs/addApplication";
import PanelistSlots from "@/pages/jobs/viewSlots"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />

        {/* Protected */}
        <Route element={<RequireAuth />}>
          <Route path="/" element={<Layout />}>

            <Route path="dashboard" element={<Dashboard />} />
            <Route path="jobs" element={<Jobs />} />
            <Route path="settings" element={<Settings />} />
            <Route path="create-job" element={<CreateJob />} />

            {/* Org-only */}
            <Route element={<RequireOrgContext />}>
              {/* <Route path="org/settings" element={<OrgSettings />} /> */}
            </Route>

            {/* Org admin-only */}
            <Route element={<RequireOrgRole roles={["owner", "admin"]} />}>
              {/* <Route path="org/jobs/create" element={<CreateJob />} /> */}
            </Route>

          </Route>
          <Route path="/" element={<JobLayout />}>
            <Route
              path="jobs/:jobId"
              element={
                <ErrorBoundary fallbackTitle="Job page crashed">
                  <JobPage />
                </ErrorBoundary>
              }
            />
            <Route path="jobs/:jobId/rubric/edit" element={<RubricEditorPage mode="edit" />} />
            <Route path="jobs/:jobId/rubric/new" element={<RubricEditorPage mode="new" />} />
            <Route path="jobs/:jobId/job-info" element={<JobInfoPage />} />
            <Route path="jobs/:jobId/analytics" element={<Analytics />} />
            <Route path="jobs/:jobId/add-applications" element={<AddApplications />} />
            <Route path="jobs/:jobId/track-resumes" element={<TrackUploadedResumes />} />
            <Route path="jobs/:jobId/interview/settings" element={<InterviewSettings />} />
            <Route path="jobs/:jobId/settings/rounds" element={<RoundSettings />} />
            <Route path="jobs/:jobId/view_slots" element={<PanelistSlots />} />
            {/* <Route path="jobs/:jobId/view_slots/:round_config_id" element={<ViewSlots />} /> */}

          </Route>


          {/* Without Layout */}
          <Route path="jobs/:jobId/assessment-form/preview" element={<AssessmentPreview />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
        {/* Public — no auth required */}
        <Route path="/apply/:slug" element={<PublicApplyPage />} />
        <Route path="/panelist/availability" element={<PanelAvailabilityForm />} />
        <Route path="/panelist/edit-slots" element={<PanelAvailabilityForm />} />
        <Route path="/panelist/reschedule" element={<PanelistRescheduleAvailabilityForm />} />
        <Route path="/interview/book" element={<CandidateSlotBooking />} />
        <Route path="/interview/reschedule" element={<CandidateSlotBooking is_reschedule={true} />} />
        <Route path="/interview/assessment" element={<AssessmentForm />} />
      </Routes>

      <Toaster />
    </BrowserRouter>
  );
}


export default App;
