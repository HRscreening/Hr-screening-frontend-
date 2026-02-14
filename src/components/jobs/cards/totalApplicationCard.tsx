import { Card,CardHeader, CardTitle } from '@/components/ui/card';
import {
    Users,
} from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"


type TotalApplicationdataType = {
    totalApplications: number;
    applied: number;
    shortlisted: number;
    interviewed: number;
    hired: number;
    rejected: number;
}


type TotalApplicationCardProp = {
    data: TotalApplicationdataType;
}

const TotalApplicationCard = ({data}: TotalApplicationCardProp) => {


    const appliedPercent = (data.applied / data.totalApplications) * 100;
    const shortlistedPercent = (data.shortlisted / data.totalApplications) * 100;
    const interviewedPercent = (data.interviewed / data.totalApplications) * 100;
    const hiredPercent = (data.hired / data.totalApplications) * 100;
    const rejectedPercent = (data.rejected / data.totalApplications) * 100;

    return (
        <Card className='my-4 min-w-80 w-fit p-5 bg-card border shadow-sm'>
            <CardHeader className='p-0 space-y-3'>
                <CardTitle className='text-sm font-medium text-foreground-500 uppercase tracking-wide flex flex-row items-center justify-between'>
                    Total Applicants
                    <Users className='h-5 w-5 text-muted-foreground' />
                </CardTitle>

                <div className='flex flex-row items-center gap-4'>
                    <div className='text-3xl font-bold text-foreground-900'>
                        {data.totalApplications}
                    </div>

                    <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                        <div className="relative h-3 bg-muted rounded-full overflow-hidden w-48">
                            <div className="absolute inset-0 flex">

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
                                    <TooltipContent>Applied: {data.applied}</TooltipContent>
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
                                    <TooltipContent >Shortlisted: {data.shortlisted}</TooltipContent>
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
                                    <TooltipContent >Interviewed: {data.interviewed}</TooltipContent>
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
                                    <TooltipContent>Hired: {data.hired}</TooltipContent>
                                </Tooltip>

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
                                    <TooltipContent>Rejected: {data.rejected}</TooltipContent>
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
