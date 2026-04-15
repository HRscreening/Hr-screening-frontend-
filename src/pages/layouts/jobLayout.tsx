import { Outlet } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar"
import JobSidebar from "@/components/jobs/jobSideBar"
import Navigator from "@/components/navigator.tsx";
import ProfileButton from "@/components/profileButton.tsx";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function Layout() {


    console.log("Current Page:", "Dashboard");



    return (
        <div className="flex min-h-screen flex-col">
            {/* Header — full width, on top */}
            <header className="sticky top-0 z-30 w-full h-15 flex flex-row justify-between border-b bg-background p-4">
                <div className="flex flex-row items-center gap-4">
                    <Link to="/jobs" className="flex items-center gap-1 text-sm text-foreground/70 hover:text-foreground">
                        <div className="p-2 b-1 bg-primary/10 rounded-full">
                            <ArrowLeft className="w-4 h-4 text-foreground" />
                        </div>
                    </Link>
                    <Navigator />
                </div>
                <ProfileButton />
            </header>

            {/* Sidebar + page body sit below the header */}
            <SidebarProvider className="flex flex-1 min-h-[calc(100svh-3.75rem)]!">
                <JobSidebar />

                <main className="flex flex-1 flex-col overflow-auto">
                    <div className="w-full flex-1 p-4">
                        <Outlet />
                    </div>
                </main>
            </SidebarProvider>
        </div>
    );
}
