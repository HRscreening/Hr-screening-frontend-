import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Application } from '@/types/applicationTypes';
import ViewAnalysis from "./viewAnalysisSheet"


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

const ApplicationRow: React.FC<ApplicationRowProps> = ({ application, onViewDetails }) => {
  const { candidate, scores, status } = application;
  const latestScore = scores.find(s => s.is_latest);
  const matchPercentage = latestScore?.overall_score || 0;
  const fullName = candidate?.full_name;
  const email = candidate?.email;

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
      interview_scheduled: { 
        label: 'Interview', 
        className: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-50 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800' 
      },
      offer_extended: { 
        label: 'Offer Extended', 
        className: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-50 dark:bg-green-950 dark:text-green-300 dark:border-green-800' 
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
        {getStatusBadge(status)}
      </TableCell>

      <TableCell className="text-right">
        {/* <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-2"
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails(application);
          }}
        >
          <Eye className="h-4 w-4" />
          View
        </Button> */}
        <ViewAnalysis groundingData={latestScore?.grounding_data} aiAnalysis={application.ai_analysis} resume={application.resume}/>
      </TableCell>
    </TableRow>
  );
};

export default ApplicationRow;