import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
} from "@/components/ui/sidebar"
import { useNavigate, useLocation, useParams } from "react-router-dom";
import {
    Users,
    BarChart3,
    ClipboardList,
    UserPlus,
    FileText,
    Settings,
    CalendarCog,
    InfoIcon,
    type LucideIcon,
} from "lucide-react"

type SidebarItem = {
    name: string;
    icon: LucideIcon;
    link: string;
    iconColor: string;
    matchHash?: string;
}



export default function JobSidebar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { jobId } = useParams<{ jobId: string }>();

    const base = `/jobs/${jobId ?? ""}`;

    const sidebarItem: SidebarItem[] = [
        {
            name: "Applications",
            icon: Users,
            link: base,
            iconColor: "text-blue-500",
            matchHash: "",
        },
        {
            name: "Analytics",
            icon: BarChart3,
            link: `${base}/analytics`,
            iconColor: "text-purple-500",
            matchHash: "#analysis",
        },
        {
            name: "Edit Criterias",
            icon: ClipboardList,
            link: `${base}/rubric/edit`,
            iconColor: "text-orange-500",
        },
        {
            name: "Add Applications",
            icon: UserPlus,
            link: `${base}/add-applications`,
            iconColor: "text-emerald-500",
            matchHash: "#add-applications",
        },
        {
            name: "Track Uploaded Resumes",
            icon: FileText,
            link: `${base}/track-resumes`,
            iconColor: "text-amber-500",
            matchHash: "#track-resumes",
        },
        {
            name: "Interview Rounds",
            icon: CalendarCog,
            link: `${base}/settings/rounds`,
            iconColor: "text-indigo-500",
        },
        {
            name: "Panelists Availability",
            icon: CalendarCog,
            link: `${base}/view_slots/`,
            iconColor: "text-yellow-500",
        },
        {
            name: "Settings",
            icon: Settings,
            link: `${base}/interview/settings`,
            iconColor: "text-gray-500",
        },
        {
            name: "Job Info",
            icon: InfoIcon,
            link: `${base}/job-info`,
            iconColor: "text-slate-500",
        },
    ]

    const handleNavigation = (link: string) => {
        navigate(link);
    }

    const isActive = (item: SidebarItem) => {
        const [pathPart] = item.link.split("#");
        if (location.pathname !== pathPart) return false;
        if (item.matchHash !== undefined) {
            return (location.hash || "") === item.matchHash;
        }
        return true;
    }

    return (
        <Sidebar
            variant="sidebar"
            collapsible="icon"
            className="border-r top-15! h-[calc(100svh-3.75rem)]!"
        >
            {/* <SidebarHeader className="border-b px-6 py-4">
                <div className="flex items-center gap-2">
                    <LogoIcon />
                    <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                        <span className="text-[18px] font-bold italic">DeskZero</span>
                    </div>
                </div>
            </SidebarHeader> */}

            <SidebarContent className="px-2 py-4">
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {sidebarItem.map((item, index) => {
                                const Icon = item.icon;

                                return (
                                    <SidebarMenuItem key={index}>
                                        <SidebarMenuButton
                                            onClick={() => handleNavigation(item.link)}
                                            isActive={isActive(item)}
                                            tooltip={item.name}
                                            className={`h-10 transition-colors ${isActive(item) ? "bg-blue-50 text-blue-600 hover:bg-blue-100" : "hover:bg-slate-100"}`}
                                        >
                                            <Icon className={`h-5 w-5 ${item.iconColor}`} />
                                            <span className="capitalize font-medium">{item.name}</span>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

        </Sidebar>
    )
}