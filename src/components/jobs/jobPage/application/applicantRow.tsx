import React, { useState } from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { Application, statusType } from '@/types/applicationTypes';
import ViewAnalysis from "./viewAnalysisSheet"
import MenuItems from './applicationMenuButton';
import { Status } from '@/components/jobs/jobPage/buttons/statusButton';

interface ApplicationRowProps {
  application: Application;
  onViewDetails: (application: Application) => void;
  onApplicationDeleted?: () => void;
  jobId?: string;
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


/*

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

*/

const ApplicationRow: React.FC<ApplicationRowProps> = ({ application, onViewDetails }) => {
  const { candidate, scores, status, id } = application;
  const [currentStatus, setCurrentStatus] = React.useState<statusType>(status);
  const activeScore = scores?.[0] ?? null;
  const matchPercentage = activeScore?.overall_score ?? 0;
  const fullName = candidate?.full_name;
  const email = candidate?.email;
  const currentTitle = candidate?.current_title;
  const currentCompany = candidate?.current_company;
  const [openAnalysis, setOpenAnalysis] = useState<boolean>(false);


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
      className="hover:bg-muted/50 transition-colors"
      onClick={() => onViewDetails(application)}
    >
      <TableCell>
        <div className="flex items-center gap-3"
        >
          <div className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm',
            getAvatarColor(fullName)
          )}>
            {getInitials(fullName)}
          </div>
          <div className="flex flex-col">
            <span className={cn("font-medium", fullName ? "text-foreground" : "text-muted-foreground italic")}>
              {fullName ? fullName : 'Unknown'}
            </span>
            <span className="text-sm text-muted-foreground">
              {email ? email : 'No email found'}
            </span>
          </div>
        </div>
      </TableCell>

      <TableCell>
        {currentTitle || currentCompany ? (
          <div className="flex flex-col">
            {currentTitle && (
              <span className="text-sm text-foreground font-medium truncate max-w-40">
                {currentTitle}
              </span>
            )}
            {currentCompany && (
              <span className="text-xs text-muted-foreground truncate max-w-40">
                {currentCompany}
              </span>
            )}
          </div>
        ) : (
          <span className="text-sm text-muted-foreground italic opacity-50">—</span>
        )}
      </TableCell>

      <TableCell>
        <div className="cursor-pointer flex items-center gap-3"
          onClick={(e) => {
            e.stopPropagation();
            setOpenAnalysis(true);
          }}
        >
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
        <Status status={currentStatus} application_id={application.id} setCurrentStatus={setCurrentStatus} currentRound={application.current_round} />
      </TableCell>

      <TableCell className="text-right ">
        <ViewAnalysis overallScore={activeScore?.overall_score} breakdown={activeScore?.breakdown} groundingData={activeScore?.grounding_data} aiAnalysis={application.ai_analysis} resume={application.resume} openSheet={openAnalysis} setOpenSheet={setOpenAnalysis} />
        <MenuItems applicationId={id} name={candidate?.full_name} email={candidate?.email} phone={candidate?.phone} candidate_id={candidate?.id} is_flagged={application.is_flagged} is_starred={application.is_starred} flag_reason={application.flag_reason} />
      </TableCell>

    </TableRow>
  );
};

export default ApplicationRow;