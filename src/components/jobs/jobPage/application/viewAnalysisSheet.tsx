import { useState } from "react";

import {
    Sheet,
    SheetContent,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
    Eye,
} from "lucide-react";
import type { Breakdown, AIAnalysis, Resume } from "@/types/applicationTypes";
import ResumeAnalysisSheet from "@/components/jobs/jobPage/application/analysis_sheets/resumeAnalysisSheet"
import InterviewAnalysisSheet from "@/components/jobs/jobPage/application/analysis_sheets/interviewAnalysisSheet"
import { FileText, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Component ─────────────────────────────────────────────────────────────────
interface ViewAnalysisSheetProps {
    breakdown?: Breakdown | null;
    aiAnalysis?: AIAnalysis | null;
    resume: Resume;
    overallScore: number | undefined;
    openSheet: boolean;
    setOpenSheet: (open: boolean) => void;

}
export default function ViewAnalysisSheet({
    breakdown,
    aiAnalysis,
    resume,
    overallScore,
    openSheet,
    setOpenSheet,
}: ViewAnalysisSheetProps) {

    const [currentTab, setCurrentTab] = useState<"resume" | "interview">("resume")

    return (
        <Sheet open={openSheet} onOpenChange={(open) => setOpenSheet(open)}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 gap-2">
                    <Eye className="h-4 w-4" />
                </Button>
            </SheetTrigger>

            <SheetContent className="w-full sm:max-w-xl lg:max-w-2xl flex flex-col p-0 gap-0 overflow-hidden">

                {/* Tab switcher */}
                <div className="flex items-center gap-1 px-4 pt-3 pb-0 border-b bg-background shrink-0">
                    {(["resume", "interview"] as const).map((tab) => {
                        const isActive = currentTab === tab
                        const Icon = tab === "resume" ? FileText : MessageSquare
                        const label = tab === "resume" ? "Resume" : "Interview"
                        return (
                            <button
                                key={tab}
                                onClick={() => setCurrentTab(tab)}
                                className={cn(
                                    "relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-md transition-colors select-none",
                                    isActive
                                        ? "text-foreground"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                                )}
                            >
                                <Icon className="w-3.5 h-3.5" />
                                {label}
                                {/* Active underline indicator */}
                                {isActive && (
                                    <span className="absolute bottom-0 inset-x-0 h-0.5 bg-primary rounded-full" />
                                )}
                            </button>
                        )
                    })}
                </div>

                {currentTab === "resume" && (
                    <ResumeAnalysisSheet
                        breakdown={breakdown}
                        aiAnalysis={aiAnalysis}
                        resume={resume}
                        overallScore={overallScore}
                    />
                )}

                {currentTab === "interview" && <InterviewAnalysisSheet />}
            </SheetContent>
        </Sheet>
    )
}