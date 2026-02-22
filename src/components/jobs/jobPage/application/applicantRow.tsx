import React, { useState } from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Application, statusType } from '@/types/applicationTypes';
import ViewAnalysis from "./viewAnalysisSheet"
import { EllipsisVertical } from "lucide-react"
import { Mic } from "lucide-react"
import EditNameEmail from "@/components/jobs/jobPage/buttons/editNameEmail"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Share,
  Info,
  Trash,
  FlagTriangleRight

} from "lucide-react"
import { Button } from '@/components/ui/button';


type MenuItemsProps = {
  applicationId: string;
  name: string | null;
  email: string | null;
  candidate_id: string | null;
  phone: string | null;
}
export function MenuItems({ ...data }: MenuItemsProps) {

  const [editOpen, setEditOpen] = useState(false);

  async function handleShare() {
    // Implement share functionality
    console.log("Share action triggered");
  }

  async function handleFlag() {
    // Implement flag functionality
    console.log("Flag action triggered");
  }

  async function handleDelete() {
    // Implement delete functionality
    console.log("Delete action triggered");
  }

  return (
    <>
      <DropdownMenu >
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-5 w-5 p-1 rounded-full">
            <EllipsisVertical className="h-4 w-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent >
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();   // 🔥 important
              setEditOpen(true);
            }}
          >
          Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleShare}>
            <Share />
            Share
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleFlag}>
            <FlagTriangleRight />
            Flag
          </DropdownMenuItem>
          <DropdownMenuItem >
            <Info />
            Info
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDelete}>
            <Trash color='red' />
            <span className='text-destructive'>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditNameEmail
        open={editOpen}
        setOpen={setEditOpen}
        applicationId={data.applicationId}
        candidate_id={data.candidate_id}
        email={data.email}
        name={data.name}
        phone={data.phone}
      />
    </>
  )
}


interface StatusProps {
  status: statusType;
  setCurrentStatus: React.Dispatch<React.SetStateAction<statusType>>;
}

export function Status({ status, setCurrentStatus }: StatusProps) {

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      applied: {
        label: 'Applied',
        className: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800'
      },
      in_review: {
        label: 'In Review',
        className: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
      },
      shortlisted: {
        label: 'Shortlisted',
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
      },
      interview_scheduled: {
        label: 'Interview',
        className: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-50 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800'
      },
      rejected: {
        label: 'Rejected',
        className: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-50 dark:bg-red-950 dark:text-red-300 dark:border-red-800'
      },
      hired: {
        label: 'Hired',
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.applied;
    return (
      <Badge variant="outline" className={cn('font-medium', config.className)}>
        {config.label}
      </Badge>
    );
  };

  async function handleStatusChange(newStatus: statusType) {
    // Implement status change functionality
    setCurrentStatus(newStatus);
    console.log("Status changed to:", newStatus);
  }

  const statusValues = [
    { value: 'applied', label: 'Applied' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'in_review', label: 'In Review' },
    { value: 'shortlisted', label: 'Shortlisted' },
    { value: 'hired', label: 'Hired' },
  ]

  return (
    <DropdownMenu >
      <DropdownMenuTrigger asChild>
        {getStatusBadge(status)}
      </DropdownMenuTrigger>
      <DropdownMenuContent >
        {
          statusValues.map((statusOption) => (
            <DropdownMenuItem key={statusOption.value} onClick={handleStatusChange.bind(null, statusOption.value as statusType)}>
              {statusOption.label}
            </DropdownMenuItem>
          ))
        }
      </DropdownMenuContent>
    </DropdownMenu>
  )
}


interface ApplicationRowProps {
  application: Application;
  onViewDetails: (application: Application) => void;
}

const avatarColors = [
  'bg-blue-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-green-500',
  'bg-yellow-500',
  'bg-red-500',
  'bg-indigo-500',
  'bg-teal-500',
];


type InterviewStage = {
  stage: number;
  status: "Passed" | "In Progress" | "Failed";
}

function InterviewProgressBar() {
  const data: InterviewStage[] = [
    { stage: 1, status: "Passed" },
    { stage: 2, status: "In Progress" },
    { stage: 3, status: "Failed" },
  ];

  if (!data || data.length === 0) return null;

  const getStyles = (status: string) => {
    switch (status) {
      case "Passed":
        return {
          bg: "bg-green-100",
          text: "text-green-600",
          iconColor: "#16a34a",
        };
      case "Failed":
        return {
          bg: "bg-red-100",
          text: "text-red-600",
          iconColor: "#dc2626",
        };
      default:
        return {
          bg: "bg-primary",
          text: "text-white",
          iconColor: "#ca8a04",
        };
    }
  };

  return (
    <div className="flex gap-6">
      {data.map((item) => {
        const styles = getStyles(item.status);

        return (
          <div key={item.stage} className="flex flex-col items-center">
            <div
              className={`w-8 h-8   rounded-full flex items-center justify-center ${styles.bg}`}
            >
              {item.stage === 1 ? (
                <Mic
                  color={styles.iconColor}
                  className="h-4 w-4"
                />
              ) : (
                <span className={`font-semibold ${styles.text}`}>
                  {item.stage}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}



const ApplicationRow: React.FC<ApplicationRowProps> = ({ application, onViewDetails }) => {
  const { candidate, scores, status, id } = application;
  const [currentStatus, setCurrentStatus] = React.useState<statusType>(status);
  const latestScore = scores.find(s => s.is_latest);
  const matchPercentage = latestScore?.overall_score || 0;
  const fullName = candidate?.full_name;
  const email = candidate?.email;



  const getInitials = (name: string | null) => {
    if (!name) return "NA";
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (name: string | null) => {

    if (!name) return 'bg-gray-500';
    const charCode = name.charCodeAt(0);
    return avatarColors[charCode % avatarColors.length];
  };

  return (
    <TableRow
      className="cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={() => onViewDetails(application)}
    >
      <TableCell>
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm',
            getAvatarColor(fullName)
          )}>
            {getInitials(fullName)}
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-foreground">
              {fullName ? fullName : 'NA'}
            </span>
            <span className="text-sm text-muted-foreground">
              {email ? email : 'No email provided'}
            </span>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <InterviewProgressBar />
      </TableCell>

      <TableCell>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden max-w-30">
            <div
              className={cn(
                'h-full transition-all rounded-full',
                matchPercentage >= 85 ? 'bg-green-500' :
                  matchPercentage >= 70 ? 'bg-blue-500' :
                    matchPercentage >= 50 ? 'bg-amber-500' : 'bg-red-400'
              )}
              style={{ width: `${matchPercentage}%` }}
            />
          </div>
          <span className={cn(
            'text-sm font-semibold tabular-nums min-w-12',
            matchPercentage >= 85 ? 'text-green-600 dark:text-green-400' :
              matchPercentage >= 70 ? 'text-blue-600 dark:text-blue-400' :
                matchPercentage >= 50 ? 'text-amber-600 dark:text-amber-400' :
                  'text-red-600 dark:text-red-400'
          )}>
            {matchPercentage.toFixed(0)}%
          </span>
        </div>
      </TableCell>

      <TableCell>
        <Status status={currentStatus} setCurrentStatus={setCurrentStatus} />
      </TableCell>

      <TableCell className="text-right ">
        <ViewAnalysis groundingData={latestScore?.grounding_data} aiAnalysis={application.ai_analysis} resume={application.resume} />
        <MenuItems applicationId={id} name={candidate?.full_name} email={candidate?.email} phone={candidate?.phone} candidate_id={candidate?.id} />
      </TableCell>

    </TableRow>
  );
};

export default ApplicationRow;