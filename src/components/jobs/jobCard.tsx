import { MapPin, Users, Calendar, ArrowRight, Briefcase, Trash2 } from 'lucide-react';
import { type JobCardType } from '@/types/types';
import { formatDistanceToNow } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from 'react';

interface JobCardCompactProps {
  job: JobCardType;
  onClick?: () => void;
  onDelete?: (jobId: string) => Promise<void>;
}

const STATUS_CONFIG = {
  draft: {
    label: 'Draft',
    color: 'bg-primary/10 text-primary border-primary/20',
    dot: 'bg-primary'
  },
  open: {
    label: 'Open',
    color: 'bg-success/10 text-success border-success/20',
    dot: 'bg-success'
  },
  paused: {
    label: 'Paused',
    color: 'bg-warning/10 text-warning border-warning/20',
    dot: 'bg-warning'
  },
  closed: {
    label: 'Closed',
    color: 'bg-muted text-muted-foreground border-border',
    dot: 'bg-muted-foreground'
  },
  archived: {
    label: 'Archived',
    color: 'bg-destructive/10 text-destructive border-destructive/20',
    dot: 'bg-destructive'
  }
} as const;

export default function JobCardCompact({ job, onClick, onDelete }: JobCardCompactProps) {
  const statusKey = (job.status ?? '').toLowerCase();
  const statusConfig =
    // @ts-expect-error - runtime-safe fallback for unexpected statuses
    STATUS_CONFIG[statusKey] ?? STATUS_CONFIG.open;
  
  const formattedDate = formatDistanceToNow(new Date(job.created_at), { 
    addSuffix: true 
  });

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(job.id);
      setIsDeleteOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div 
        className="group relative bg-card border border-border rounded-lg overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer w-full max-w-sm"
        onClick={onClick}
      >
        {/* Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-primary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
        
        <div className="p-5">
          {/* Icon & Status Row */}
          <div className="flex items-start justify-between mb-3">
            <div className="bg-primary/10 p-2.5 rounded-lg">
              <Briefcase className="w-5 h-5 text-primary" />
            </div>
            
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusConfig.color}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`}></div>
                {statusConfig.label}
              </div>
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDeleteOpen(true);
                  }}
                  className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive hover:text-destructive transition-colors"
                  title="Delete job"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Title */}
          <h3 className="text-base font-semibold text-foreground mb-3 group-hover:text-primary transition-colors line-clamp-2 min-h-12">
            {job.title}
          </h3>

          {/* Info Grid */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{job.location || "—"}</span>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Users className="w-3.5 h-3.5 shrink-0" />
              <span>{job.head_count} {job.head_count === 1 ? 'position' : 'positions'}</span>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              <span>{formattedDate}</span>
            </div>
          </div>

          {/* View Button */}
          <button 
            className="w-full bg-primary/5 text-primary py-2 rounded-lg text-xs font-medium group-hover:bg-primary group-hover:text-primary-foreground transition-all flex items-center justify-center gap-1.5"
            onClick={(e) => {
              e.stopPropagation();
              onClick?.();
            }}
          >
            View Details
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Job</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-semibold text-foreground">"{job.title}"</span>? This action cannot be undone. All associated data including rubrics, applications, scores, and resumes will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteClick}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}