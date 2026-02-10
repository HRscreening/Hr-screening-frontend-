import { Outlet } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/appSidebar"
// import NotificationBell from "@/components/notification";
// import CreateJobButton from "@/components/jobs/createJobButton";
import { useState } from "react"


export default function Layout() {


  const [pageTitle, setPageTitle] = useState("Dashboard");

   console.log("Current Page:", pageTitle);


  return (
    <SidebarProvider>
      {/* Sidebar */}
      <AppSidebar setPageTitle={setPageTitle} />

      {/* Main content — sibling, NOT wrapped */}
      <main className="flex min-h-screen flex-1 flex-col">

        {/* Header */}
        {/* <div className="w-full flex flex-row justify-between border-b bg-white p-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <Separator orientation="vertical" className="h-5" />
            <h1 className="text-xl font-bold">{pageTitle}</h1>
          </div>

            {showCreateJobButton && <CreateJobButton />}

        </div> */}

        {/* Page body */}
        <div className="flex-1 overflow-auto p-4">
          <Outlet />
        </div>

      </main>
    </SidebarProvider>
  );
}

