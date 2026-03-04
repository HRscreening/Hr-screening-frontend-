import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { CalendarDays, AlertTriangle, Layers } from 'lucide-react';

import axios from '@/axiosConfig';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Loader from '@/components/loader';
import RoundConfigCard from '@/components/jobs/jobPage/roundConfigCard';
import type { RoundOverview } from '@/types/roundConfigTypes';

// ─── Main Page Component ──────────────────────────────────────────────────────

const JobSettings = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const [overviews, setOverviews] = useState<RoundOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverviews = useCallback(async () => {
    if (!jobId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`/interview/${jobId}/rounds/overview`);
      setOverviews(res.data);
    } catch (err) {
      console.error('Failed to fetch round overviews', err);
      setError('Failed to load interview rounds');
      toast.error('Failed to load interview rounds');
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchOverviews();
  }, [fetchOverviews]);

  const handleDeleted = (id: string) => {
    setOverviews((prev) => prev.filter((o) => o.round_config_id !== id));
  };

  if (loading) {
    return <Loader text="Loading interview rounds…" />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center mb-3">
          <AlertTriangle className="h-5 w-5 text-destructive" />
        </div>
        <p className="text-sm font-semibold">Something went wrong</p>
        <p className="text-xs text-muted-foreground mt-1">{error}</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={fetchOverviews}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-6 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 text-primary shrink-0">
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold leading-tight">Interview Pipeline</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Configure rounds for this job's hiring process
            </p>
          </div>
        </div>
        {overviews.length > 0 && (
          <Badge variant="secondary" className="text-[10px] font-medium px-2.5 py-1 gap-1.5">
            <CalendarDays className="h-3 w-3" />
            {overviews.length} round{overviews.length !== 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {/* Round cards */}
      {overviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 rounded-xl border-2 border-dashed border-border/40 bg-muted/5 text-center">
          <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
            <CalendarDays className="h-5 w-5 text-primary" />
          </div>
          <p className="text-sm font-semibold">No rounds configured</p>
          <p className="text-[11px] text-muted-foreground mt-1 max-w-[20rem] leading-relaxed">
            Interview rounds are set up during job creation. None have been configured yet.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {overviews
            .sort((a, b) => a.round_number - b.round_number)
            .map((overview) => (
              <RoundConfigCard
                key={overview.round_config_id}
                overview={overview}
                jobId={jobId!}
                onDeleted={handleDeleted}
                onUpdated={fetchOverviews}
              />
            ))}
        </div>
      )}
    </div>
  );
};

export default JobSettings;
