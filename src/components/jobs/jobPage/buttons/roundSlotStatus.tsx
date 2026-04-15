import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip, TooltipContent,
  TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import { ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { RoundSlots } from '@/types/jobTypes';

type Props = { 
  roundSlots: RoundSlots[] | null
  jobId: string;
  setCurrentRoundConfigId: (roundConfigId: string) => void;
};

const RoundSlotsStatus = ({ roundSlots,jobId,setCurrentRoundConfigId }: Props) => {

  const hasMissingSlots = roundSlots?.some((r) => !r.slots_available) ?? false;

  const handleRoundClick = (roundConfigId: string) => {
    setCurrentRoundConfigId(roundConfigId);
  };

  return (
    <TooltipProvider delayDuration={200}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-1.5 bg-white border border-gray-200 hover:border-blue-400 rounded-md px-2.5 py-1.5 text-sm font-medium text-gray-700 transition-all hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1">

            {/* Red dot on trigger if any round lacks slots */}
            {hasMissingSlots && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Some rounds have no slots configured — action needed</p>
                </TooltipContent>
              </Tooltip>
            )}

            <span>Round Slots</span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuLabel className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Round Configuration
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          <div className="max-h-60 overflow-y-auto py-1">
            {roundSlots && roundSlots.length > 0 ? (
              roundSlots.map((round) => (
                <DropdownMenuItem
                  key={round.round_config_id}
                  className="flex items-center justify-between gap-2 cursor-pointer px-3 py-2"
                  onClick={() => handleRoundClick(round.round_config_id)}
                >
                    <span className="text-sm text-gray-800">
                      Round {round.round_number}
                    </span> 
                  {round.slots_available ? (
                    <span className="flex items-center gap-1 text-xs text-green-600 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      Slots available
                    </span>
                  ) : (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="flex items-center gap-1 text-xs text-red-500 shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                          No slots
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="left">
                        <p>No slots configured for this round — click to fix</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </DropdownMenuItem>
              ))
            ) : (
              <DropdownMenuItem className="flex flex-col items-start gap-1 px-3 py-2 text-sm text-gray-500">
                <span>No round configurations found.</span>
                <Link
                  to={`/jobs/${jobId}/settings/rounds`}
                  className="text-blue-500 underline text-xs">

                <span
                  // className="text-blue-500 underline cursor-pointer text-xs"
                  // onClick={() => navigate(`/jobs/${jobId}/settings/rounds`)}
                  >
                  Configure rounds in Settings →
                </span>
                  </Link>
              </DropdownMenuItem>
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </TooltipProvider>
  );
};

export default RoundSlotsStatus;