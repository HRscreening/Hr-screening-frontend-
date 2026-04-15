import { useState, useEffect } from 'react'
import { useParams, } from 'react-router-dom'
import { useJob } from '@/hooks/job_hooks/useJob';
import RoundSlotsStatus from '@/components/jobs/jobPage/buttons/roundSlotStatus';
import SlotsComponent from '@/components/jobs/jobPage/roundSlots';

const ViewSlots = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const [currentRoundConfigId, setRoundConfigId] = useState<string>("")
  const [currentRoundNumber, setCurrentRoundNumber] = useState<number | null>(null)

  const { data: jobData, isLoading: jobLoading, isError } = useJob(jobId || "");

  useEffect(() => {
    if (jobData?.round_slots && jobData.round_slots.length > 0) {
      const currentRound = jobData.round_slots.find((round: any) => round.is_current_round) || jobData.round_slots[0];
      if (currentRound) {
        setRoundConfigId(currentRound.round_config_id)
        setCurrentRoundNumber(currentRound.round_number)
      }
    }
  }, [jobData])

  if (!jobId) return null;

  if (jobLoading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isError || !jobData) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
        Error loading data. Try Again after sometime
      </div>
    );
  }

  const handleSetRoundConfig = (roundConfigId: string) => {
    setRoundConfigId(roundConfigId);
    const round = jobData.round_slots?.find((r: any) => r.round_config_id === roundConfigId);
    if (round) {
      setCurrentRoundNumber(round.round_number);
    }
  };

  return (
    <div className="space-y-6">
      <div className='flex flex-row justify-between items-center bg-white p-4 rounded-lg border border-border shadow-sm'>
        <div className="space-y-1">
          <h1 className='text-2xl font-bold tracking-tight'>Panelist Availability Slots</h1>
          <p className='text-sm text-muted-foreground'>
            Track and request availability slots from panelists {currentRoundNumber && `for Round ${currentRoundNumber}`}.
          </p>
        </div>
        <RoundSlotsStatus 
          roundSlots={jobData.round_slots} 
          setCurrentRoundConfigId={handleSetRoundConfig} 
          jobId={jobId}
        />
      </div>
      
      {currentRoundConfigId ? (
        <SlotsComponent round_config_id={currentRoundConfigId} />
      ) : (
        <div className="text-center py-20 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground">No round selected or available.</p>
        </div>
      )}
    </div>
  )
}

export default ViewSlots
