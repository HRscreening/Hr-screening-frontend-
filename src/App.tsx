import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";

import Home from "@/pages/Home";
import Layout from "@/pages/layout";
import Dashboard from "@/pages/Dashboard";
import Jobs from "@/pages/jobs/Jobs";
import CreateJob from "@/pages/jobs/createJob";
import Settings from "@/pages/settings";
import JobPage from "@/pages/jobs/jobPage";

import NotFound from "@/pages/NotFound";

import RequireAuth from "@/guards/RequireAuth";
import RequireOrgContext from "@/guards/RequireOrgContext";
import RequireOrgRole from "@/guards/RequireOrgRole";

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

          <Route path="jobs/:jobId" element={<JobPage />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>

      <Toaster />
    </BrowserRouter>
  );
}


export default App;
