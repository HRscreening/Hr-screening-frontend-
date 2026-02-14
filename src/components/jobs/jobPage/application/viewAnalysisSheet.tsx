// import {
//     Sheet,
//     SheetContent,
//     SheetDescription,
//     SheetHeader,
//     SheetTitle,
//     SheetTrigger,
// } from "@/components/ui/sheet";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { Separator } from "@/components/ui/separator";
// import { ScrollArea } from "@/components/ui/scroll-area";
// import {
//     Collapsible,
//     CollapsibleContent,
//     CollapsibleTrigger,
// } from "@/components/ui/collapsible";
// import { Eye, FileText, CheckCircle2, XCircle, ChevronDown, ExternalLink, FileCheck } from "lucide-react";
// import type { GroundingData, AIAnalysis, Resume } from "@/types/applicationTypes";
// import { useState } from "react";
// import { cn } from "@/lib/utils";
// import { formatDistanceToNow } from "date-fns";

// type ViewAnalysisSheetProps = {
//     groundingData?: GroundingData;
//     aiAnalysis: AIAnalysis;
//     resume: Resume;
//     candidateName?: string;
// }

// export default function ViewAnalysisSheet({ groundingData, aiAnalysis, resume, candidateName }: ViewAnalysisSheetProps) {
//     const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

//     const toggleSection = (section: string) => {
//         const newExpanded = new Set(expandedSections);
//         if (newExpanded.has(section)) {
//             newExpanded.delete(section);
//         } else {
//             newExpanded.add(section);
//         }
//         setExpandedSections(newExpanded);
//     };

//     const formatSectionTitle = (key: string) => {
//         return key
//             .split('_')
//             .map(word => word.charAt(0).toUpperCase() + word.slice(1))
//             .join(' ');
//     };

//     const getStatusBadge = (status: string) => {
//         const config = {
//             parsed: { label: 'Parsed', className: 'bg-green-50 text-green-700 border-green-200' },
//             pending: { label: 'Pending', className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
//             failed: { label: 'Failed', className: 'bg-red-50 text-red-700 border-red-200' },
//         };
//         const statusConfig = config[status as keyof typeof config] || config.pending;
//         return (
//             <Badge variant="outline" className={statusConfig.className}>
//                 {statusConfig.label}
//             </Badge>
//         );
//     };

//     const renderGroundingDataSection = (key: string, value: string[] | Record<string, string[]>) => {
//         const isExpanded = expandedSections.has(key);
//         const items = Array.isArray(value) ? value : Object.values(value).flat();
//         const displayItems = isExpanded ? items : items.slice(0, 3);
//         const hasMore = items.length > 3;


//         return (
//             <Collapsible key={key} open={isExpanded} onOpenChange={() => toggleSection(key)}>
//                 <div className="space-y-2">
//                     <div className="flex items-center justify-between">
//                         <h4 className="text-sm font-semibold text-foreground">{formatSectionTitle(key)}</h4>
//                         {hasMore && (
//                             <CollapsibleTrigger asChild>
//                                 <Button variant="ghost" size="sm" className="h-6 text-xs">
//                                     {isExpanded ? 'Show Less' : `Show ${items.length - 3} More`}
//                                     <ChevronDown className={cn(
//                                         "ml-1 h-3 w-3 transition-transform",
//                                         isExpanded && "rotate-180"
//                                     )} />
//                                 </Button>
//                             </CollapsibleTrigger>
//                         )}
//                     </div>
//                     <ul className="space-y-1.5">
//                         {displayItems.map((item, idx) => (
//                             <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
//                                 <span className="text-primary mt-1">•</span>
//                                 <span className="flex-1">{item}</span>
//                             </li>
//                         ))}
//                     </ul>
//                     {hasMore && (
//                         <CollapsibleContent className="space-y-1.5">
//                             {items.slice(3).map((item, idx) => (
//                                 <li key={idx + 3} className="text-sm text-muted-foreground flex items-start gap-2 list-none">
//                                     <span className="text-primary mt-1">•</span>
//                                     <span className="flex-1">{item}</span>
//                                 </li>
//                             ))}
//                         </CollapsibleContent>
//                     )}
//                 </div>
//             </Collapsible>
//         );
//     };

//             const renderGroundingItems = (items: string[]) => {
//             if (!items.length) return null;

//             return (
//                 <ul className="space-y-1.5">
//                     {items.map((item, idx) => (
//                         <li
//                             key={idx}
//                             className="text-sm text-muted-foreground flex items-start gap-2"
//                         >
//                             <span className="text-primary mt-1">•</span>
//                             <span className="flex-1">{item}</span>
//                         </li>
//                     ))}
//                 </ul>
//             );
//         };


//     return (
//         <Sheet>
//             <SheetTrigger asChild>
//                 <Button variant="ghost" size="sm" className="h-8 gap-2">
//                     <Eye className="h-4 w-4" />
//                     View
//                 </Button>
//             </SheetTrigger>
//             <SheetContent className="w-full sm:max-w-150">
//                 <SheetHeader className="space-y-3 pb-4">
//                     <SheetTitle className="text-2xl">
//                         {candidateName ? `${candidateName}'s Analysis` : 'Candidate Analysis'}
//                     </SheetTitle>
//                     <SheetDescription>
//                         AI-powered analysis and resume details
//                     </SheetDescription>
//                 </SheetHeader>

//                 <ScrollArea className="h-[calc(100vh-120px)] pr-4">
//                     <div className="w-full space-y-6">
//                         {/* Resume Info Section */}
//                         <div className="space-y-4">
//                             <div className="flex items-center gap-2">
//                                 <FileText className="w-5 h-5 text-primary" />
//                                 <h3 className="text-lg font-semibold">Resume Information</h3>
//                             </div>

//                             <div className="bg-muted/50 rounded-lg p-4 space-y-3">
//                                 <div className="flex items-center justify-between">
//                                     <span className="text-sm text-muted-foreground">Status</span>
//                                     {getStatusBadge(resume.status)}
//                                 </div>

//                                 <div className="flex items-center justify-between">
//                                     <span className="text-sm text-muted-foreground">Pages</span>
//                                     <span className="text-sm font-medium">{resume.page_count}</span>
//                                 </div>

//                                 <div className="flex items-center justify-between">
//                                     <span className="text-sm text-muted-foreground">Uploaded</span>
//                                     <span className="text-sm font-medium">
//                                         {formatDistanceToNow(new Date(resume.uploaded_at), { addSuffix: true })}
//                                     </span>
//                                 </div>

//                                 <Separator />

//                                 <Button
//                                     variant="outline"
//                                     className="w-full"
//                                     onClick={() => window.open(resume.raw_file_url, '_blank')}
//                                 >
//                                     <FileText className="w-4 h-4 mr-2" />
//                                     View Resume
//                                     <ExternalLink className="w-3 h-3 ml-2" />
//                                 </Button>
//                             </div>
//                         </div>

//                         <Separator />

//                         {/* AI Analysis - Good Points */}
//                         <div className="space-y-4">
//                             <div className="flex items-center gap-2">
//                                 <CheckCircle2 className="w-5 h-5 text-green-600" />
//                                 <h3 className="text-lg font-semibold">Strengths</h3>
//                             </div>

//                             <div className="space-y-2">
//                                 {aiAnalysis?.good_points?.length > 0 ? (
//                                     <ul className="space-y-2">
//                                         {aiAnalysis.good_points.map((point, idx) => (
//                                             <li key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
//                                                 <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
//                                                 <span className="text-sm text-foreground">{point}</span>
//                                             </li>
//                                         ))}
//                                     </ul>
//                                 ) : (
//                                     <p className="text-sm text-muted-foreground italic">No strengths identified</p>
//                                 )}
//                             </div>
//                         </div>

//                         <Separator />

//                         {/* AI Analysis - Bad Points */}
//                         <div className="space-y-4">
//                             <div className="flex items-center gap-2">
//                                 <XCircle className="w-5 h-5 text-red-600" />
//                                 <h3 className="text-lg font-semibold">Areas for Improvement</h3>
//                             </div>

//                             <div className="space-y-2">
//                                 {aiAnalysis?.bad_points?.length > 0 ? (
//                                     <ul className="space-y-2">
//                                         {aiAnalysis.bad_points.map((point, idx) => (
//                                             <li key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
//                                                 <XCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
//                                                 <span className="text-sm text-foreground">{point}</span>
//                                             </li>
//                                         ))}
//                                     </ul>
//                                 ) : (
//                                     <p className="text-sm text-muted-foreground italic">No areas for improvement identified</p>
//                                 )}
//                             </div>
//                         </div>

//                         {/* Grounding Data Section */}
//                         {/* {groundingData && Object.keys(groundingData).length > 0 && (
//                             <>
//                                 <Separator />
//                                 <div className="space-y-4">
//                                     <div className="flex items-center gap-2">
//                                         <FileCheck className="w-5 h-5 text-primary" />
//                                         <h3 className="text-lg font-semibold">Detailed Evidence</h3>
//                                     </div>
                                    
//                                     <div className="space-y-4">
//                                         {Object.entries(groundingData).map(([key, value]) => (
//                                             <div key={key} className="p-4 rounded-lg bg-muted/30 border">
//                                                 {renderGroundingDataSection(key, value)}
//                                             </div>
//                                         ))}
//                                     </div>
//                                 </div>
//                             </>
//                         )} */}
//                         {/* Grounding Data Section */}
//                         {groundingData && Object.keys(groundingData).length > 0 && (
//                             <>
//                                 <Separator />
//                                 <div className="space-y-6">
//                                     <div className="flex items-center gap-2">
//                                         <FileCheck className="w-5 h-5 text-primary" />
//                                         <h3 className="text-lg font-semibold">Detailed Evidence</h3>
//                                     </div>

//                                     {Object.entries(groundingData).map(([groupKey, groupValue]) => (
//                                         <div key={groupKey} className="space-y-4">
//                                             {/* Group Header */}
//                                             <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
//                                                 {formatSectionTitle(groupKey)}
//                                             </h4>

//                                             {/* Criteria */}
//                                             <div className="grid gap-4">
//                                                 {Object.entries(groupValue).map(([criteriaKey, criteriaValue]) => {
//                                                     const values = Array.isArray(criteriaValue)
//                                                         ? criteriaValue
//                                                         : Object.values(criteriaValue).flat();

//                                                     if (!values.length) return null;

//                                                     return (
//                                                         <div
//                                                             key={criteriaKey}
//                                                             className="rounded-lg border bg-muted/30 p-4 space-y-2"
//                                                         >
//                                                             <h5 className="text-sm font-semibold text-foreground">
//                                                                 {formatSectionTitle(criteriaKey)}
//                                                             </h5>
//                                                             {renderGroundingItems(values)}
//                                                         </div>
//                                                     );
//                                                 })}
//                                             </div>
//                                         </div>
//                                     ))}
//                                 </div>
//                             </>
//                         )}

//                     </div>
//                 </ScrollArea>
//             </SheetContent>
//         </Sheet>
//     );
// }


// import {
//     Sheet,
//     SheetContent,
//     SheetDescription,
//     SheetHeader,
//     SheetTitle,
//     SheetTrigger,
// } from "@/components/ui/sheet";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { Separator } from "@/components/ui/separator";
// import { ScrollArea } from "@/components/ui/scroll-area";
// import { 
//     Eye, 
//     FileText, 
//     CheckCircle2, 
//     XCircle, 
//     ExternalLink, 
//     FileCheck,
//     AlertCircle,
//     Loader2
// } from "lucide-react";
// import type { GroundingData, AIAnalysis, Resume } from "@/types/applicationTypes";
// import { cn } from "@/lib/utils";
// import { formatDistanceToNow } from "date-fns";
// import React from "react";

// type ViewAnalysisSheetProps = {
//     groundingData?: GroundingData | null;
//     aiAnalysis?: AIAnalysis | null;
//     resume: Resume;
//     candidateName?: string;
// }

// export default function ViewAnalysisSheet({ 
//     groundingData, 
//     aiAnalysis, 
//     resume, 
//     candidateName 
// }: ViewAnalysisSheetProps) {

//     const formatSectionTitle = (key: string) => {
//         return key
//             .split('_')
//             .map(word => word.charAt(0).toUpperCase() + word.slice(1))
//             .join(' ');
//     };

//     const getStatusBadge = (status: string) => {
//         const config = {
//             parsed: { 
//                 label: 'Parsed', 
//                 className: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:border-green-800',
//                 icon: CheckCircle2
//             },
//             scored: { 
//                 label: 'Scored', 
//                 className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800',
//                 icon: CheckCircle2
//             },
//             pending: { 
//                 label: 'Pending', 
//                 className: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800',
//                 icon: Loader2
//             },
//             failed: { 
//                 label: 'Failed', 
//                 className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:border-red-800',
//                 icon: XCircle
//             },
//         };
        
//         const statusConfig = config[status as keyof typeof config] || config.pending;
//         const Icon = statusConfig.icon;
        
//         return (
//             <Badge variant="outline" className={cn("gap-1.5", statusConfig.className)}>
//                 <Icon className={cn("h-3 w-3", status === 'pending' && "animate-spin")} />
//                 {statusConfig.label}
//             </Badge>
//         );
//     };

//     // Type guards with stricter validation
//     const isStringArray = (value: any): value is string[] => {
//         return Array.isArray(value) && value.every(item => typeof item === 'string' && item.trim().length > 0);
//     };

//     const isPlainObject = (value: any): value is Record<string, any> => {
//         return value !== null && typeof value === 'object' && !Array.isArray(value);
//     };

//     // Safely check if data exists and has content
//     const hasContent = (data: any): boolean => {
//         if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
//             return false;
//         }
//         return true;
//     };

//     // Render string array as list
//     const renderItems = (items: string[]) => {
//         if (!items || items.length === 0) return null;

//         return (
//             <ul className="space-y-1.5">
//                 {items.map((item, idx) => (
//                     <li
//                         key={idx}
//                         className="text-sm text-muted-foreground flex items-start gap-2"
//                     >
//                         <span className="text-primary mt-1">•</span>
//                         <span className="flex-1">{item}</span>
//                     </li>
//                 ))}
//             </ul>
//         );
//     };

//     // Recursively render grounding data of any structure
//     const renderGroundingValue = (value: any, depth: number = 0): React.JSX.Element | null => {
//         // Handle null/undefined
//         if (value === null || value === undefined) {
//             return null;
//         }

//         // Base case: string array
//         if (isStringArray(value)) {
//             return renderItems(value);
//         }

//         // Handle empty arrays - don't render anything
//         if (Array.isArray(value) && value.length === 0) {
//             return null;
//         }

//         // Recursive case: nested object
//         if (isPlainObject(value)) {
//             const entries = Object.entries(value).filter(([_, val]) => {
//                 // Filter out null/undefined/empty values
//                 if (val === null || val === undefined) return false;
//                 if (Array.isArray(val) && val.length === 0) return false;
//                 if (isPlainObject(val) && Object.keys(val).length === 0) return false;
//                 return true;
//             });

//             if (entries.length === 0) {
//                 return null;
//             }

//             return (
//                 <div className="space-y-3">
//                     {entries.map(([key, val]) => (
//                         <div key={key} className={cn(
//                             "space-y-2",
//                             depth > 0 && "pl-4 border-l-2 border-muted"
//                         )}>
//                             <h5 className={cn(
//                                 "font-semibold text-foreground",
//                                 depth === 0 ? "text-sm" : "text-xs"
//                             )}>
//                                 {formatSectionTitle(key)}
//                             </h5>
//                             {renderGroundingValue(val, depth + 1)}
//                         </div>
//                     ))}
//                 </div>
//             );
//         }

//         // Fallback: render primitives as text
//         if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
//             const stringValue = String(value).trim();
//             return stringValue ? (
//                 <p className="text-sm text-muted-foreground">{stringValue}</p>
//             ) : null;
//         }

//         // Unknown type - don't render
//         return null;
//     };

//     // Extract strengths and improvements from AI analysis
//     const getAIAnalysisSections = () => {
//         if (!aiAnalysis || Object.keys(aiAnalysis).length === 0) {
//             return { strengths: [], improvements: [], other: {} };
//         }

//         const strengths: string[] = [];
//         const improvements: string[] = [];
//         const other: Record<string, string[]> = {};

//         Object.entries(aiAnalysis).forEach(([key, value]) => {
//             // Validate that value is a string array
//             if (!isStringArray(value)) {
//                 console.warn(`AI analysis key "${key}" has invalid format, expected string array`);
//                 return;
//             }

//             const lowerKey = key.toLowerCase();
            
//             // Categorize based on key name
//             if (lowerKey.includes('good') || lowerKey.includes('strength') || 
//                 lowerKey.includes('positive') || lowerKey.includes('pro') ||
//                 lowerKey.includes('highlight') || lowerKey.includes('advantage')) {
//                 strengths.push(...value);
//             } else if (lowerKey.includes('bad') || lowerKey.includes('improvement') || 
//                        lowerKey.includes('weakness') || lowerKey.includes('concern') || 
//                        lowerKey.includes('gap') || lowerKey.includes('con') ||
//                        lowerKey.includes('issue') || lowerKey.includes('area')) {
//                 improvements.push(...value);
//             } else {
//                 other[key] = value;
//             }
//         });

//         return { strengths, improvements, other };
//     };

//     const { strengths, improvements, other } = getAIAnalysisSections();
    
//     // Check if we have any analysis or grounding data
//     const hasAnyAnalysis = hasContent(aiAnalysis);
//     const hasAnyGrounding = hasContent(groundingData);
//     const hasAnyData = hasAnyAnalysis || hasAnyGrounding;
    
//     // Status checks
//     const isParsedOrScored = resume.status === 'parsed' || resume.status === 'scored';
//     const isPending = resume.status === 'pending';
//     const isFailed = resume.status === 'failed';

//     return (
//         <Sheet>
//             <SheetTrigger asChild>
//                 <Button variant="ghost" size="sm" className="h-8 gap-2">
//                     <Eye className="h-4 w-4" />
//                     View
//                 </Button>
//             </SheetTrigger>
//             <SheetContent className="w-full sm:max-w-xl lg:max-w-2xl">
//                 <SheetHeader className="space-y-3 pb-4">
//                     <SheetTitle className="text-2xl">
//                         {candidateName ? `${candidateName}'s Analysis` : 'Candidate Analysis'}
//                     </SheetTitle>
//                     <SheetDescription>
//                         AI-powered analysis and resume details
//                     </SheetDescription>
//                 </SheetHeader>

//                 <ScrollArea className="h-[calc(100vh-120px)] pr-4">
//                     <div className="w-full space-y-6">
//                         {/* Resume Info Section */}
//                         <div className="space-y-4">
//                             <div className="flex items-center gap-2">
//                                 <FileText className="w-5 h-5 text-primary" />
//                                 <h3 className="text-lg font-semibold">Resume Information</h3>
//                             </div>

//                             <div className="bg-muted/50 rounded-lg p-4 space-y-3">
//                                 <div className="flex items-center justify-between">
//                                     <span className="text-sm text-muted-foreground">Status</span>
//                                     {getStatusBadge(resume.status)}
//                                 </div>

//                                 {resume.page_count > 0 && (
//                                     <div className="flex items-center justify-between">
//                                         <span className="text-sm text-muted-foreground">Pages</span>
//                                         <span className="text-sm font-medium">{resume.page_count}</span>
//                                     </div>
//                                 )}

//                                 {resume.uploaded_at && (
//                                     <div className="flex items-center justify-between">
//                                         <span className="text-sm text-muted-foreground">Uploaded</span>
//                                         <span className="text-sm font-medium">
//                                             {formatDistanceToNow(new Date(resume.uploaded_at), { addSuffix: true })}
//                                         </span>
//                                     </div>
//                                 )}

//                                 <Separator />

//                                 <Button
//                                     variant="outline"
//                                     className="w-full"
//                                     onClick={() => window.open(resume.raw_file_url, '_blank')}
//                                     disabled={!resume.raw_file_url}
//                                 >
//                                     <FileText className="w-4 h-4 mr-2" />
//                                     View Resume
//                                     <ExternalLink className="w-3 h-3 ml-2" />
//                                 </Button>
//                             </div>
//                         </div>

//                         {/* Status-based messages */}
//                         {isPending && (
//                             <div className="flex items-start gap-3 p-4 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800">
//                                 <Loader2 className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0 animate-spin" />
//                                 <div className="space-y-1">
//                                     <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
//                                         Analysis in Progress
//                                     </p>
//                                     <p className="text-sm text-yellow-700 dark:text-yellow-300">
//                                         We're currently processing this resume. Analysis will be available shortly.
//                                     </p>
//                                 </div>
//                             </div>
//                         )}

//                         {isFailed && (
//                             <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
//                                 <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
//                                 <div className="space-y-1">
//                                     <p className="text-sm font-medium text-red-900 dark:text-red-100">
//                                         Analysis Failed
//                                     </p>
//                                     <p className="text-sm text-red-700 dark:text-red-300">
//                                         We encountered an error while processing this resume. Please try re-uploading or contact support.
//                                     </p>
//                                 </div>
//                             </div>
//                         )}

//                         {/* AI Analysis Section - only show if parsed/scored and data exists */}
//                         {isParsedOrScored && hasAnyAnalysis && (
//                             <>
//                                 <Separator />

//                                 {/* Strengths */}
//                                 {strengths.length > 0 && (
//                                     <div className="space-y-4">
//                                         <div className="flex items-center gap-2">
//                                             <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
//                                             <h3 className="text-lg font-semibold">Strengths</h3>
//                                         </div>

//                                         <div className="space-y-2">
//                                             <ul className="space-y-2">
//                                                 {strengths.map((point, idx) => (
//                                                     <li key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
//                                                         <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
//                                                         <span className="text-sm text-foreground">{point}</span>
//                                                     </li>
//                                                 ))}
//                                             </ul>
//                                         </div>
//                                     </div>
//                                 )}

//                                 {strengths.length > 0 && improvements.length > 0 && <Separator />}

//                                 {/* Areas for Improvement */}
//                                 {improvements.length > 0 && (
//                                     <div className="space-y-4">
//                                         <div className="flex items-center gap-2">
//                                             <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
//                                             <h3 className="text-lg font-semibold">Areas for Improvement</h3>
//                                         </div>

//                                         <div className="space-y-2">
//                                             <ul className="space-y-2">
//                                                 {improvements.map((point, idx) => (
//                                                     <li key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
//                                                         <XCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
//                                                         <span className="text-sm text-foreground">{point}</span>
//                                                     </li>
//                                                 ))}
//                                             </ul>
//                                         </div>
//                                     </div>
//                                 )}

//                                 {/* Other AI Analysis Sections */}
//                                 {Object.keys(other).length > 0 && (
//                                     <>
//                                         {(strengths.length > 0 || improvements.length > 0) && <Separator />}
//                                         <div className="space-y-4">
//                                             {Object.entries(other).map(([key, values]) => (
//                                                 <div key={key} className="space-y-3">
//                                                     <h3 className="text-lg font-semibold">{formatSectionTitle(key)}</h3>
//                                                     <div className="rounded-lg border bg-muted/30 p-4">
//                                                         {renderItems(values)}
//                                                     </div>
//                                                 </div>
//                                             ))}
//                                         </div>
//                                     </>
//                                 )}
//                             </>
//                         )}

//                         {/* Grounding Data Section - only show if parsed/scored and data exists */}
//                         {isParsedOrScored && hasAnyGrounding && (
//                             <>
//                                 <Separator />
//                                 <div className="space-y-6">
//                                     <div className="flex items-center gap-2">
//                                         <FileCheck className="w-5 h-5 text-primary" />
//                                         <h3 className="text-lg font-semibold">Detailed Evidence</h3>
//                                     </div>

//                                     <div className="space-y-4">
//                                         {Object.entries(groundingData!).map(([key, value]) => {
//                                             // Skip null/undefined/empty values
//                                             if (value === null || value === undefined) return null;
//                                             if (Array.isArray(value) && value.length === 0) return null;
//                                             if (isPlainObject(value) && Object.keys(value).length === 0) return null;

//                                             const renderedValue = renderGroundingValue(value);
//                                             if (!renderedValue) return null;

//                                             return (
//                                                 <div key={key} className="space-y-3">
//                                                     <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
//                                                         {formatSectionTitle(key)}
//                                                     </h4>
//                                                     <div className="rounded-lg border bg-muted/30 p-4">
//                                                         {renderedValue}
//                                                     </div>
//                                                 </div>
//                                             );
//                                         })}
//                                     </div>
//                                 </div>
//                             </>
//                         )}

//                         {/* Empty state - only show for parsed/scored resumes without data */}
//                         {isParsedOrScored && !hasAnyData && (
//                             <div className="py-12 text-center space-y-3">
//                                 <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto opacity-50" />
//                                 <div className="space-y-1">
//                                     <p className="text-lg font-medium">No Analysis Available</p>
//                                     <p className="text-sm text-muted-foreground max-w-md mx-auto">
//                                         The resume was processed successfully, but no analysis data is available yet. This might take a few moments.
//                                     </p>
//                                 </div>
//                             </div>
//                         )}
//                     </div>
//                 </ScrollArea>
//             </SheetContent>
//         </Sheet>
//     );
// }


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
    Eye, 
    FileText, 
    CheckCircle2, 
    XCircle, 
    ExternalLink, 
    FileCheck,
    AlertCircle,
    Loader2
} from "lucide-react";
import type { GroundingData, AIAnalysis, Resume } from "@/types/applicationTypes";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import React from "react";

type ViewAnalysisSheetProps = {
    groundingData?: GroundingData | null;
    aiAnalysis?: AIAnalysis | null;
    resume: Resume;
    candidateName?: string;
}

export default function ViewAnalysisSheet({ 
    groundingData, 
    aiAnalysis, 
    resume, 
    candidateName 
}: ViewAnalysisSheetProps) {

    const formatSectionTitle = (key: string) => {
        return key
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    const getStatusBadge = (status: string) => {
        const config = {
            parsed: { 
                label: 'Parsed', 
                className: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:border-green-800',
                icon: CheckCircle2
            },
            scored: { 
                label: 'Scored', 
                className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800',
                icon: CheckCircle2
            },
            pending: { 
                label: 'Pending', 
                className: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800',
                icon: Loader2
            },
            failed: { 
                label: 'Failed', 
                className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:border-red-800',
                icon: XCircle
            },
        };
        
        const statusConfig = config[status as keyof typeof config] || config.pending;
        const Icon = statusConfig.icon;
        
        return (
            <Badge variant="outline" className={cn("gap-1.5", statusConfig.className)}>
                <Icon className={cn("h-3 w-3", status === 'pending' && "animate-spin")} />
                {statusConfig.label}
            </Badge>
        );
    };

    // Type guards with stricter validation
    const isStringArray = (value: any): value is string[] => {
        return Array.isArray(value) && value.every(item => typeof item === 'string' && item.trim().length > 0);
    };

    // NEW: Check if array contains objects with "evidence" field
    const isEvidenceObjectArray = (value: any): value is Array<{evidence: string, criterion?: string}> => {
        return Array.isArray(value) && 
               value.length > 0 &&
               value.every(item => 
                   typeof item === 'object' && 
                   item !== null && 
                   'evidence' in item && 
                   typeof item.evidence === 'string' &&
                   item.evidence.trim().length > 0
               );
    };

    const isPlainObject = (value: any): value is Record<string, any> => {
        return value !== null && typeof value === 'object' && !Array.isArray(value);
    };

    // Safely check if data exists and has content
    const hasContent = (data: any): boolean => {
        if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
            return false;
        }
        return true;
    };

    // Normalize array to string array (handles both formats)
    const normalizeToStringArray = (value: any): string[] | null => {
        if (isStringArray(value)) {
            return value;
        }
        
        if (isEvidenceObjectArray(value)) {
            return value.map(item => item.evidence);
        }
        
        return null;
    };

    // Render string array as list
    const renderItems = (items: string[]) => {
        if (!items || items.length === 0) return null;

        return (
            <ul className="space-y-1.5">
                {items.map((item, idx) => (
                    <li
                        key={idx}
                        className="text-sm text-muted-foreground flex items-start gap-2"
                    >
                        <span className="text-primary mt-1">•</span>
                        <span className="flex-1">{item}</span>
                    </li>
                ))}
            </ul>
        );
    };

    // Recursively render grounding data of any structure
    const renderGroundingValue = (value: any, depth: number = 0): React.JSX.Element | null => {
        // Handle null/undefined
        if (value === null || value === undefined) {
            return null;
        }

        // Handle arrays (both string arrays and object arrays with evidence)
        if (Array.isArray(value)) {
            const normalized = normalizeToStringArray(value);
            
            if (normalized && normalized.length > 0) {
                return renderItems(normalized);
            }
            
            // Empty or invalid array
            return null;
        }

        // Recursive case: nested object
        if (isPlainObject(value)) {
            const entries = Object.entries(value).filter(([_, val]) => {
                // Filter out null/undefined/empty values
                if (val === null || val === undefined) return false;
                if (Array.isArray(val)) {
                    const normalized = normalizeToStringArray(val);
                    return normalized && normalized.length > 0;
                }
                if (isPlainObject(val) && Object.keys(val).length === 0) return false;
                return true;
            });

            if (entries.length === 0) {
                return null;
            }

            return (
                <div className="space-y-3">
                    {entries.map(([key, val]) => (
                        <div key={key} className={cn(
                            "space-y-2",
                            depth > 0 && "pl-4 border-l-2 border-muted"
                        )}>
                            <h5 className={cn(
                                "font-semibold text-foreground",
                                depth === 0 ? "text-sm" : "text-xs"
                            )}>
                                {formatSectionTitle(key)}
                            </h5>
                            {renderGroundingValue(val, depth + 1)}
                        </div>
                    ))}
                </div>
            );
        }

        // Fallback: render primitives as text
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
            const stringValue = String(value).trim();
            return stringValue ? (
                <p className="text-sm text-muted-foreground">{stringValue}</p>
            ) : null;
        }

        // Unknown type - don't render
        return null;
    };

    // Extract strengths and improvements from AI analysis
    const getAIAnalysisSections = () => {
        if (!aiAnalysis || Object.keys(aiAnalysis).length === 0) {
            return { strengths: [], improvements: [], other: {} };
        }

        const strengths: string[] = [];
        const improvements: string[] = [];
        const other: Record<string, string[]> = {};

        Object.entries(aiAnalysis).forEach(([key, value]) => {
            // Validate that value is a string array
            if (!isStringArray(value)) {
                console.warn(`AI analysis key "${key}" has invalid format, expected string array`);
                return;
            }

            const lowerKey = key.toLowerCase();
            
            // Categorize based on key name
            if (lowerKey.includes('good') || lowerKey.includes('strength') || 
                lowerKey.includes('positive') || lowerKey.includes('pro') ||
                lowerKey.includes('highlight') || lowerKey.includes('advantage')) {
                strengths.push(...value);
            } else if (lowerKey.includes('bad') || lowerKey.includes('improvement') || 
                       lowerKey.includes('weakness') || lowerKey.includes('concern') || 
                       lowerKey.includes('gap') || lowerKey.includes('con') ||
                       lowerKey.includes('issue') || lowerKey.includes('area')) {
                improvements.push(...value);
            } else {
                other[key] = value;
            }
        });

        return { strengths, improvements, other };
    };

    const { strengths, improvements, other } = getAIAnalysisSections();
    
    // Check if we have any analysis or grounding data
    const hasAnyAnalysis = hasContent(aiAnalysis);
    const hasAnyGrounding = hasContent(groundingData);
    const hasAnyData = hasAnyAnalysis || hasAnyGrounding;
    
    // Status checks
    const isParsedOrScored = resume.status === 'parsed' || resume.status === 'scored';
    const isPending = resume.status === 'pending';
    const isFailed = resume.status === 'failed';

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 gap-2">
                    <Eye className="h-4 w-4" />
                    {/* View */}
                </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-xl lg:max-w-2xl">
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

                                {resume.page_count > 0 && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Pages</span>
                                        <span className="text-sm font-medium">{resume.page_count}</span>
                                    </div>
                                )}

                                {resume.uploaded_at && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Uploaded</span>
                                        <span className="text-sm font-medium">
                                            {formatDistanceToNow(new Date(resume.uploaded_at), { addSuffix: true })}
                                        </span>
                                    </div>
                                )}

                                <Separator />

                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => window.open(resume.raw_file_url, '_blank')}
                                    disabled={!resume.raw_file_url}
                                >
                                    <FileText className="w-4 h-4 mr-2" />
                                    View Resume
                                    <ExternalLink className="w-3 h-3 ml-2" />
                                </Button>
                            </div>
                        </div>

                        {/* Status-based messages */}
                        {isPending && (
                            <div className="flex items-start gap-3 p-4 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800">
                                <Loader2 className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0 animate-spin" />
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                                        Analysis in Progress
                                    </p>
                                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                                        We're currently processing this resume. Analysis will be available shortly.
                                    </p>
                                </div>
                            </div>
                        )}

                        {isFailed && (
                            <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-red-900 dark:text-red-100">
                                        Analysis Failed
                                    </p>
                                    <p className="text-sm text-red-700 dark:text-red-300">
                                        We encountered an error while processing this resume. Please try re-uploading or contact support.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* AI Analysis Section - only show if parsed/scored and data exists */}
                        {isParsedOrScored && hasAnyAnalysis && (
                            <>
                                <Separator />

                                {/* Strengths */}
                                {strengths.length > 0 && (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                                            <h3 className="text-lg font-semibold">Strengths</h3>
                                        </div>

                                        <div className="space-y-2">
                                            <ul className="space-y-2">
                                                {strengths.map((point, idx) => (
                                                    <li key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                                                        <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                                                        <span className="text-sm text-foreground">{point}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                )}

                                {strengths.length > 0 && improvements.length > 0 && <Separator />}

                                {/* Areas for Improvement */}
                                {improvements.length > 0 && (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2">
                                            <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                                            <h3 className="text-lg font-semibold">Areas for Improvement</h3>
                                        </div>

                                        <div className="space-y-2">
                                            <ul className="space-y-2">
                                                {improvements.map((point, idx) => (
                                                    <li key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                                                        <XCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                                                        <span className="text-sm text-foreground">{point}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                )}

                                {/* Other AI Analysis Sections */}
                                {Object.keys(other).length > 0 && (
                                    <>
                                        {(strengths.length > 0 || improvements.length > 0) && <Separator />}
                                        <div className="space-y-4">
                                            {Object.entries(other).map(([key, values]) => (
                                                <div key={key} className="space-y-3">
                                                    <h3 className="text-lg font-semibold">{formatSectionTitle(key)}</h3>
                                                    <div className="rounded-lg border bg-muted/30 p-4">
                                                        {renderItems(values)}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </>
                        )}

                        {/* Grounding Data Section - only show if parsed/scored and data exists */}
                        {isParsedOrScored && hasAnyGrounding && (
                            <>
                                <Separator />
                                <div className="space-y-6">
                                    <div className="flex items-center gap-2">
                                        <FileCheck className="w-5 h-5 text-primary" />
                                        <h3 className="text-lg font-semibold">Detailed Evidence</h3>
                                    </div>

                                    <div className="space-y-4">
                                        {Object.entries(groundingData!).map(([key, value]) => {
                                            // Skip null/undefined/empty values
                                            if (value === null || value === undefined) return null;
                                            if (Array.isArray(value)) {
                                                const normalized = normalizeToStringArray(value);
                                                if (!normalized || normalized.length === 0) return null;
                                            }
                                            if (isPlainObject(value) && Object.keys(value).length === 0) return null;

                                            const renderedValue = renderGroundingValue(value);
                                            if (!renderedValue) return null;

                                            return (
                                                <div key={key} className="space-y-3">
                                                    <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                                                        {formatSectionTitle(key)}
                                                    </h4>
                                                    <div className="rounded-lg border bg-muted/30 p-4">
                                                        {renderedValue}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Empty state - only show for parsed/scored resumes without data */}
                        {isParsedOrScored && !hasAnyData && (
                            <div className="py-12 text-center space-y-3">
                                <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto opacity-50" />
                                <div className="space-y-1">
                                    <p className="text-lg font-medium">No Analysis Available</p>
                                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                                        The resume was processed successfully, but no analysis data is available yet. This might take a few moments.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}