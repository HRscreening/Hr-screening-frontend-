import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { statusType } from '@/types/applicationTypes';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { ChevronRight, ChevronLeft, XCircle } from 'lucide-react';
import { useMaxRound } from '@/store/jobPageStore';
import EditNameEmail from '@/components/jobs/jobPage/buttons/editNameEmail';
import NoRoundConfigDialog from '../dialogs/NoRoundConfigDialog';
import { useChangeApplicationStatus } from '@/hooks/job_hooks/applications/useChangeApplicationStatus';

type CandidateDetails = {
  name: string | null;
  email: string | null;
  phone: string | null;
  candidate_id: string | null;
}

interface StatusProps {
  status: statusType;
  jobId: string;
  application_id: string;
  setCurrentStatus: React.Dispatch<React.SetStateAction<statusType>>;
  currentRound?: number;
  candidateDetails: CandidateDetails;
}

// pipeline: applied -> shortlisted  -> round_1..N -> offer_extended -> hired
// drop_off is system-only — never a user action
function buildPipeline(finalRound: number): statusType[] {
  const rounds = Array.from({ length: finalRound }, (_, i) => `round_${i + 1}` as statusType);
  return ['applied', 'shortlisted',  ...rounds, 'offer_extended', 'hired'] as statusType[];
}

function getNext(status: statusType, finalRound: number): statusType | null {
  const pipeline = buildPipeline(finalRound);
  const idx = pipeline.indexOf(status);
  if (idx === -1 || idx === pipeline.length - 1) return null;
  return pipeline[idx + 1];
}

function getPrev(status: statusType, finalRound: number): statusType | null {
  const pipeline = buildPipeline(finalRound);
  const idx = pipeline.indexOf(status);
  if (idx <= 0) return null;
  return pipeline[idx - 1];
}

function isRoundStatus(s: statusType) {
  return /^round_[0-9]+$/.test(String(s));
}

function roundKey(n: number): statusType {
  return `round_${n}` as statusType;
}

const CONFIRM_REQUIRED: statusType[] = ['offer_extended', 'hired', 'rejected'];

const statusConfig: Record<string, { label: string; className: string }> = {
  applied:        { label: 'Applied',        className: 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800' },
  shortlisted:    { label: 'Shortlisted',    className: 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800' },
  round:          { label: 'Round',          className: 'bg-violet-50 text-violet-600 border-violet-200 hover:bg-violet-100 dark:bg-violet-950 dark:text-violet-300 dark:border-violet-800' },
  offer_extended: { label: 'Offer Extended', className: 'bg-sky-50 text-sky-600 border-sky-200 hover:bg-sky-100 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800' },
  hired:          { label: 'Hired',          className: 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800' },
  rejected:       { label: 'Rejected',       className: 'bg-red-50 text-red-600 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800' },
  drop_off:       { label: 'Drop Off',       className: 'bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700' },
};

function getLabel(status: statusType, currentRound?: number): string {
  if (isRoundStatus(status)) return `Round ${currentRound || String(status).split('_')[1]}`;
  return statusConfig[status as keyof typeof statusConfig]?.label ?? 'Applied';
}

function getClassName(status: statusType): string {
  if (isRoundStatus(status)) return statusConfig['round'].className;
  return statusConfig[status as keyof typeof statusConfig]?.className ?? statusConfig.applied.className;
}

export function Status({
  status,
  setCurrentStatus,
  jobId,
  application_id,
  currentRound,
  candidateDetails
}: StatusProps) {
  const finalRound = useMaxRound() || 3;
  const [open, setOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<statusType | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [noConfig, setNoConfig] = useState(false);
  const [autoStatusAfterEdit, setAutoStatusAfterEdit] = useState<statusType | null>(null);
  const { name, email, phone, candidate_id } = candidateDetails;

  const { mutate: changeStatus } = useChangeApplicationStatus();

  // drop_off is system-only — show badge only, no popover
  const isSystemStatus = status === 'drop_off';
  const isTerminal = status === 'hired' || status === 'rejected' || isSystemStatus;

  const effectiveStatus: statusType = (currentRound && currentRound > 0)
    ? roundKey(currentRound)
    : status;

  // Show round badge only mid-rounds; once at final round defer to actual status
  const displayStatus: statusType = (currentRound && currentRound > 0 && currentRound < finalRound)
    ? roundKey(currentRound)
    : effectiveStatus;

  const nextStatus = getNext(effectiveStatus, finalRound);
  const prevStatus = getPrev(effectiveStatus, finalRound);
  const canGoBack = prevStatus !== null && !isRoundStatus(prevStatus);

  function commitStatusChange(newStatus: statusType) {
    setPendingStatus(null);
    setOpen(false);

    changeStatus(
      { jobId:jobId,applicationId: application_id, newStatus },
      {
        onSuccess: (data) => {
          if (isRoundStatus(newStatus) && data.new_round) {
            setCurrentStatus(roundKey(data.new_round));
            toast.success(data.message || 'Applicant moved to next round');
          } else {
            setCurrentStatus(newStatus);
            toast.success(data.message || 'Status updated');
          }
        },
        onError: (err: any) => {
          const axiosErr = err as { response?: { status?: number; data?: { message?: string } } };
          if (axiosErr?.response?.status === 424) {
            toast.error(axiosErr?.response?.data?.message || 'This candidate has no email');
            setEditOpen(true);
          } else if (axiosErr?.response?.status === 425) {
            setNoConfig(true);
          } else {
            toast.error(err?.message || 'Failed to update status.');
          }
        },
      }
    );
  }

  function requestStatusChange(newStatus: statusType) {
     if(!email || !name || name.toLowerCase() === 'na' || email.toLowerCase() === 'na'){
      toast.error('Candidate must have a name and email to update status. Please update candidate details first.');
      setAutoStatusAfterEdit(newStatus);
      setEditOpen(true);
      return;
    }
    if (CONFIRM_REQUIRED.includes(newStatus) || isRoundStatus(newStatus)) {
      setOpen(false);
      setPendingStatus(newStatus);
    } else {
      commitStatusChange(newStatus);
    }
  }

  if(editOpen ){
    return <EditNameEmail 
      applicationId={application_id} 
      open={editOpen} 
      setOpen={(v) => {
        setEditOpen(v);
        if(!v) setAutoStatusAfterEdit(null);
      }} 
      candidate_id={candidate_id} 
      email={email} 
      name={name} 
      phone={phone} 
      onSuccess={() => {
        if(autoStatusAfterEdit) {
          // Add a tiny delay to allow React Query cache to settle if needed, 
          // though since we use props for validation we rely on parent refresh.
          // For now, let's just trigger the confirm or direct change.
          const statusToApply = autoStatusAfterEdit;
          setAutoStatusAfterEdit(null);
          
          if (CONFIRM_REQUIRED.includes(statusToApply) || isRoundStatus(statusToApply)) {
            setPendingStatus(statusToApply);
          } else {
            commitStatusChange(statusToApply);
          }
        }
      }}
    />
  }

  if(noConfig){
    return <NoRoundConfigDialog open={noConfig} setOpen={setNoConfig} roundNumber={currentRound || 1} />
  }

  const confirmMeta = pendingStatus ? {
    title: pendingStatus === 'rejected' ? 'Reject this applicant?' : `Move to ${getLabel(pendingStatus)}?`,
    description: pendingStatus === 'rejected'
      ? 'This applicant will be marked as rejected. This action cannot be undone.'
      : `You are about to mark this applicant as "${getLabel(pendingStatus)}". This action cannot be undone.`,
    actionLabel: pendingStatus === 'rejected' ? 'Yes, Reject' : 'Yes, Confirm',
    actionClass: pendingStatus === 'rejected'
      ? 'bg-red-600 hover:bg-red-700 text-white'
      : 'bg-emerald-600 hover:bg-emerald-700 text-white',
  } : null;

  return (
    <>
      <AlertDialog open={!!pendingStatus} onOpenChange={(v) => { if (!v) setPendingStatus(null); }}>
        <AlertDialogContent className="max-w-sm rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmMeta?.title}</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground">
              {confirmMeta?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={cn('rounded-lg', confirmMeta?.actionClass)}
              onClick={() => pendingStatus && commitStatusChange(pendingStatus)}
            >
              {confirmMeta?.actionLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isTerminal ? (
        <Badge variant="outline" className={cn('font-medium text-xs px-2.5 py-0.5 rounded-full', getClassName(status))}>
          {getLabel(status)}
        </Badge>
      ) : (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Badge
              variant="outline"
              className={cn('font-medium text-xs px-2.5 py-0.5 rounded-full cursor-pointer select-none', getClassName(displayStatus))}
            >
              {getLabel(displayStatus, currentRound)}
            </Badge>
          </PopoverTrigger>

          <PopoverContent side="bottom" align="start" sideOffset={6} className="w-48 p-0 overflow-hidden rounded-xl border border-border/60 shadow-lg">
            <div className="px-3 pt-2.5 pb-1.5 border-b border-border/50">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">Move applicant</p>
            </div>
            <div className="p-1.5 flex flex-col gap-0.5">
              {nextStatus && (
                <button
                  onClick={() => requestStatusChange(nextStatus)}
                  className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm font-medium text-left hover:bg-accent transition-colors group"
                >
                  <span>{getLabel(nextStatus)}</span>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                </button>
              )}
              {canGoBack && (
                <button
                  onClick={() => requestStatusChange(prevStatus!)}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium text-left text-muted-foreground hover:bg-accent hover:text-foreground transition-colors group"
                >
                  <ChevronLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
                  <span>{getLabel(prevStatus!)}</span>
                </button>
              )}
              <div className="my-0.5 border-t border-border/40" />
              <button
                onClick={() => requestStatusChange('rejected' as statusType)}
                className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm font-medium text-left text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
              >
                <XCircle className="h-3.5 w-3.5 shrink-0" />
                <span>Reject</span>
              </button>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </>
  );
}