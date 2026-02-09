import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Eye, FileText, CheckCircle2, XCircle, ChevronDown, ExternalLink, Calendar, FileCheck } from "lucide-react";
import type { GroundingData, AIAnalysis, Resume } from "@/types/applicationTypes";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

type ViewAnalysisSheetProps = {
    groundingData?: GroundingData;
    aiAnalysis: AIAnalysis;
    resume: Resume;
    candidateName?: string;
}

export default function ViewAnalysisSheet({ groundingData, aiAnalysis, resume, candidateName }: ViewAnalysisSheetProps) {
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

    const toggleSection = (section: string) => {
        const newExpanded = new Set(expandedSections);
        if (newExpanded.has(section)) {
            newExpanded.delete(section);
        } else {
            newExpanded.add(section);
        }
        setExpandedSections(newExpanded);
    };

    const formatSectionTitle = (key: string) => {
        return key
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    const getStatusBadge = (status: string) => {
        const config = {
            parsed: { label: 'Parsed', className: 'bg-green-50 text-green-700 border-green-200' },
            pending: { label: 'Pending', className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
            failed: { label: 'Failed', className: 'bg-red-50 text-red-700 border-red-200' },
        };
        const statusConfig = config[status as keyof typeof config] || config.pending;
        return (
            <Badge variant="outline" className={statusConfig.className}>
                {statusConfig.label}
            </Badge>
        );
    };

    const renderGroundingDataSection = (key: string, value: string[] | Record<string, string[]>) => {
        const isExpanded = expandedSections.has(key);
        const items = Array.isArray(value) ? value : Object.values(value).flat();
        const displayItems = isExpanded ? items : items.slice(0, 3);
        const hasMore = items.length > 3;

        return (
            <Collapsible key={key} open={isExpanded} onOpenChange={() => toggleSection(key)}>
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-foreground">{formatSectionTitle(key)}</h4>
                        {hasMore && (
                            <CollapsibleTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-6 text-xs">
                                    {isExpanded ? 'Show Less' : `Show ${items.length - 3} More`}
                                    <ChevronDown className={cn(
                                        "ml-1 h-3 w-3 transition-transform",
                                        isExpanded && "rotate-180"
                                    )} />
                                </Button>
                            </CollapsibleTrigger>
                        )}
                    </div>
                    <ul className="space-y-1.5">
                        {displayItems.map((item, idx) => (
                            <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                                <span className="text-primary mt-1">•</span>
                                <span className="flex-1">{item}</span>
                            </li>
                        ))}
                    </ul>
                    {hasMore && (
                        <CollapsibleContent className="space-y-1.5">
                            {items.slice(3).map((item, idx) => (
                                <li key={idx + 3} className="text-sm text-muted-foreground flex items-start gap-2 list-none">
                                    <span className="text-primary mt-1">•</span>
                                    <span className="flex-1">{item}</span>
                                </li>
                            ))}
                        </CollapsibleContent>
                    )}
                </div>
            </Collapsible>
        );
    };

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 gap-2">
                    <Eye className="h-4 w-4" />
                    View
                </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-150">
                <SheetHeader className="space-y-3 pb-4">
                    <SheetTitle className="text-2xl">
                        {candidateName ? `${candidateName}'s Analysis` : 'Candidate Analysis'}
                    </SheetTitle>
                    <SheetDescription>
                        AI-powered analysis and resume details
                    </SheetDescription>
                </SheetHeader>

                <ScrollArea className="h-[calc(100vh-120px)] pr-4">
                    <div className="w-full space-y-6">
                        {/* Resume Info Section */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <FileText className="w-5 h-5 text-primary" />
                                <h3 className="text-lg font-semibold">Resume Information</h3>
                            </div>
                            
                            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Status</span>
                                    {getStatusBadge(resume.status)}
                                </div>
                                
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Pages</span>
                                    <span className="text-sm font-medium">{resume.page_count}</span>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Uploaded</span>
                                    <span className="text-sm font-medium">
                                        {formatDistanceToNow(new Date(resume.uploaded_at), { addSuffix: true })}
                                    </span>
                                </div>

                                <Separator />

                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => window.open(resume.raw_file_url, '_blank')}
                                >
                                    <FileText className="w-4 h-4 mr-2" />
                                    View Resume
                                    <ExternalLink className="w-3 h-3 ml-2" />
                                </Button>
                            </div>
                        </div>

                        <Separator />

                        {/* AI Analysis - Good Points */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                                <h3 className="text-lg font-semibold">Strengths</h3>
                            </div>
                            
                            <div className="space-y-2">
                                {aiAnalysis?.good_points?.length > 0 ? (
                                    <ul className="space-y-2">
                                        {aiAnalysis.good_points.map((point, idx) => (
                                            <li key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                                                <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                                                <span className="text-sm text-foreground">{point}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-muted-foreground italic">No strengths identified</p>
                                )}
                            </div>
                        </div>

                        <Separator />

                        {/* AI Analysis - Bad Points */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <XCircle className="w-5 h-5 text-red-600" />
                                <h3 className="text-lg font-semibold">Areas for Improvement</h3>
                            </div>
                            
                            <div className="space-y-2">
                                {aiAnalysis?.bad_points?.length > 0 ? (
                                    <ul className="space-y-2">
                                        {aiAnalysis.bad_points.map((point, idx) => (
                                            <li key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                                                <XCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                                                <span className="text-sm text-foreground">{point}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-muted-foreground italic">No areas for improvement identified</p>
                                )}
                            </div>
                        </div>

                        {/* Grounding Data Section */}
                        {groundingData && Object.keys(groundingData).length > 0 && (
                            <>
                                <Separator />
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <FileCheck className="w-5 h-5 text-primary" />
                                        <h3 className="text-lg font-semibold">Detailed Evidence</h3>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        {Object.entries(groundingData).map(([key, value]) => (
                                            <div key={key} className="p-4 rounded-lg bg-muted/30 border">
                                                {renderGroundingDataSection(key, value)}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}