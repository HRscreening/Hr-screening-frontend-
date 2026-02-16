import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Users,
} from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import type { Dashboard} from '@/types/jobTypes';

type TotalApplicationCardProp = {
    data: Dashboard;
}

const TotalApplicationCard = ({ data }: TotalApplicationCardProp) => {

    const appliedPercent = (data.by_status.applied || 0 / data.total_applications) * 100;
    const shortlistedPercent = (data.by_status.shortlisted || 0 / data.total_applications) * 100;
    const interviewedPercent = (data.by_status.in_review || 0 / data.total_applications) * 100;
    const hiredPercent = (data.by_status.hired || 0 / data.total_applications) * 100;
    const rejectedPercent = (data.by_status.rejected || 0 / data.total_applications) * 100;

    // const appliedPercent = (data.applied / data.totalApplications) * 100;
    // const shortlistedPercent = (data.shortlisted / data.totalApplications) * 100;
    // const interviewedPercent = (data.interviewed / data.totalApplications) * 100;
    // const hiredPercent = (data.hired / data.totalApplications) * 100;
    // const rejectedPercent = (data.rejected / data.totalApplications) * 100;

    return (
        <Card className='my-4 min-w-80 w-fit p-5 bg-card border shadow-sm'>
            <CardHeader className='p-0 space-y-3'>
                <CardTitle className='text-sm font-medium text-foreground-500 uppercase tracking-wide flex flex-row items-center justify-between'>
                    Total Applicants
                    <Users className='h-5 w-5 text-muted-foreground' />
                </CardTitle>

                <div className='flex flex-row items-center gap-4'>
                    <div className='text-3xl font-bold text-foreground-900'>
                        {data.total_applications}
                    </div>

                    <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                        <div className="relative h-2 bg-muted rounded-full overflow-hidden w-48">
                            <div className="absolute inset-0 flex">


                                {/* Rejected */}
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div
                                            className="transition-all duration-500 cursor-pointer"
                                            style={{
                                                width: `${rejectedPercent}%`,
                                                backgroundColor: "var(--color-rejected)"
                                            }}
                                        />
                                    </TooltipTrigger>
                                    <TooltipContent>Rejected: {data.by_status.rejected}</TooltipContent>
                                </Tooltip>
                                {/* Applied */}
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div
                                            className="transition-all duration-500 cursor-pointer"
                                            style={{
                                                width: `${appliedPercent}%`,
                                                backgroundColor: "var(--color-applied)"
                                            }}
                                        />
                                    </TooltipTrigger>
                                    <TooltipContent>Applied: {data.by_status.applied}</TooltipContent>
                                </Tooltip>

                                {/* Shortlisted */}
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div
                                            className="transition-all duration-500 cursor-pointer"
                                            style={{
                                                width: `${shortlistedPercent}%`,
                                                backgroundColor: "var(--color-shortlisted)"
                                            }}
                                        />
                                    </TooltipTrigger>
                                    <TooltipContent >Shortlisted: {data.by_status.shortlisted}</TooltipContent>
                                </Tooltip>

                                {/* Interviewed */}
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div
                                            className="transition-all duration-500 cursor-pointer"
                                            style={{
                                                width: `${interviewedPercent}%`,
                                                backgroundColor: "var(--color-interviewed)"
                                            }}
                                        />
                                    </TooltipTrigger>
                                    <TooltipContent >In Review: {data.by_status.in_review}</TooltipContent>
                                </Tooltip>

                                {/* Hired */}
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div
                                            className="relative overflow-hidden transition-all duration-500 cursor-pointer"
                                            style={{
                                                width: `${hiredPercent}%`,
                                                backgroundColor: "var(--color-hired)"
                                            }}
                                        >

                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>Hired: {data.by_status.hired}</TooltipContent>
                                </Tooltip>


                            </div>

                        </div>

                    </div>


                </div>
            </CardHeader>
        </Card>
    )
}

export default TotalApplicationCard
