import { MapPin, Users, Calendar, ArrowRight, Briefcase } from 'lucide-react';
import { type JobCardType } from '@/types/types';
import { formatDistanceToNow } from 'date-fns';

interface JobCardCompactProps {
  job: JobCardType;
  onClick?: () => void;
}

const STATUS_CONFIG = {
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

export default function JobCardCompact({ job, onClick }: JobCardCompactProps) {
  const statusConfig = STATUS_CONFIG[job.status];
  
  const formattedDate = formatDistanceToNow(new Date(job.created_at), { 
    addSuffix: true 
  });

  return (
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
          
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusConfig.color}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`}></div>
            {statusConfig.label}
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
            <span className="truncate">{job.location}</span>
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
  );
}