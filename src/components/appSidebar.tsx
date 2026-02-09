import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
} from "@/components/ui/sidebar"
import { MdDashboard} from "react-icons/md";
import { IoSettingsSharp } from "react-icons/io5";
import { useNavigate, useLocation } from "react-router-dom";
import { LogOut, type LucideIcon,Briefcase } from "lucide-react"
import type { IconType } from "react-icons/lib";
import { useEffect } from "react";
import Logo from '@/assets/image.png'
import { useAuthStore } from "@/store/authStore.ts";
import { useContextStore } from "@/store/contextStore.ts";

type SidebarItem = {
    name: string;
    icon: IconType | LucideIcon;
    link: string;
    pageTitle: string;
    subItems?: SidebarItem[];
}

function LogoIcon() {
    return (
        <div className="flex items-center justify-center rounded-lg text-primary-foreground p-0">
            {/* <Wallet className="h-4 w-4" /> */}
            <img src={Logo} alt="logo" className="rounded-full" width={30} />
        </div>
    )
}

export function AppSidebar({ setPageTitle }: { setPageTitle: (title: string) => void }) {
    const navigate = useNavigate();
    const location = useLocation();

    const sidebarItem: SidebarItem[] = [
        {
            name: "Dashboard",
            icon: MdDashboard,
            link: "/dashboard",
            pageTitle: "Dashboard"
        },
        {
            name: "Jobs",
            icon: Briefcase,
            link: "/jobs",
            pageTitle: "Job Listings",
            subItems: [

            ]
        },
        // {
        //     name: "Meeting MOMS",
        //     icon: FaClipboardList,
        //     link: "/user/funds",
        //     pageTitle: "Minutes of Meetings"
        // },
        // {
        //     name: "RCA/GC",
        //     icon: FaTrophy,
        //     link: "/user/Rca_Gc",
        //     pageTitle: "InterHostel Events"
        // },
        // {
        //     name: "Inventory",
        //     icon: MdInventory,
        //     link: "/user/inventory",
        //     pageTitle: "Wallet"
        // },
        // {
        //        name: "Your Profile",
        //     icon: CircleUserRound,
        //     link: "/user/create-fund",
        //     pageTitle: "This is how you appear to others"
        // },
        {
            name: "Settings",
            icon: IoSettingsSharp,
            link: "/settings",
            pageTitle: "Manage your Account"
        },
    ]

    useEffect(() => {
        const currentItem = sidebarItem.find(item => item.link === location.pathname);
        if (currentItem) {
            setPageTitle(currentItem.pageTitle);
        }
    }, [])

    const handleNavigation = (link: string, pageTitle: string) => {
        setPageTitle(pageTitle);
        navigate(link);
    }

    const isActive = (link: string) => {
        return location.pathname === link;
    }

    return (
        <Sidebar variant="sidebar" collapsible="icon" className="border-r" >
            <SidebarHeader className="border-b px-6 py-4">
                <div className="flex items-center gap-2">
                    <LogoIcon />
                    <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                        <span className="text-[18px] font-bold italic">DeskZero</span>
                    </div>
                </div>
            </SidebarHeader>

            <SidebarContent className="px-2 py-4">
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {sidebarItem.map((item, index) => {
                                const Icon = item.icon;
                                const active = isActive(item.link);

                                return (
                                    <SidebarMenuItem key={index}>
                                        <SidebarMenuButton
                                            onClick={() => handleNavigation(item.link, item.pageTitle)}
                                            isActive={active}
                                            tooltip={item.name}
                                            className="h-10"
                                        >
                                            <Icon className="h-5 w-5" />
                                            <span className="capitalize">{item.name}</span>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="border-t p-2">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            onClick={async () => {
                                try {
                                    localStorage.removeItem("access_token");
                                    useAuthStore.getState().clearUser();
                                    useContextStore.getState().setPersonal();
                                    navigate("/", { replace: true });

                                    console.log("Logged out successfully");
                                } catch (error) {
                                    console.error("Logout failed", error);
                                    // Even if backend fails, navigate home
                                    navigate("/", { replace: true });
                                }
                            }}

                            tooltip="Logout"
                            className="h-10 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                            <LogOut className="h-5 w-5" />
                            <span>Logout</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    )
}