import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '@/axiosConfig';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ChevronDown,
  Eye,
  Download,
  Plus,
  Edit,
  Check,
} from 'lucide-react';
import Criterias from '../criterias';
import type { JobOverviewResponse, RubricVersionData } from '@/types/jobTypes';

interface RubricManagerProps {
  jobId: string;
  jobData: JobOverviewResponse | null;
  versionData: RubricVersionData | null;
  onVersionChange: (version: string, rubricId: string) => Promise<void>;
}

const RubricManager: React.FC<RubricManagerProps> = ({
  jobId,
  jobData,
  versionData,
  onVersionChange,
}) => {
  const navigate = useNavigate();
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const currentVersion = jobData?.criteria?.version ?? 1;

  const handleDownloadRubricJson = async () => {
    try {
      setIsDownloading(true);
      const res = await axios.get(`/jobs/${jobId}/rubric/export`, {
        responseType: 'blob',
      });
      const disposition = res.headers['content-disposition'];
      const filename =
        disposition?.match(/filename="?([^";\n]+)"?/)?.[1] ||
        `rubric-v${currentVersion}.json`;
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Rubric downloaded');
    } catch (e: unknown) {
      toast.error('Failed to download rubric');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSwitchVersion = async (version: string, rubricId: string) => {
    try {
      await onVersionChange(version, rubricId);
    } catch (e) {
      toast.error(`Failed to switch to ${version}`);
    }
  };

  return (
    <>
      {/* Rubric Manager Button */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="bg-white gap-2"
          >
            <span className="font-semibold">Rubric v{currentVersion}</span>
            <ChevronDown className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-48">
          {/* View Rubric */}
          <DropdownMenuItem onClick={() => setIsViewOpen(true)} className="gap-2 cursor-pointer">
            <Eye className="w-4 h-4" />
            <span>View Rubric</span>
          </DropdownMenuItem>

          {/* Download JSON */}
          <DropdownMenuItem
            onClick={handleDownloadRubricJson}
            disabled={isDownloading}
            className="gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{isDownloading ? 'Downloading...' : 'Download JSON'}</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Edit Rubric */}
          <DropdownMenuItem
            onClick={() => navigate(`/jobs/${jobId}/rubric/edit`)}
            className="gap-2 cursor-pointer"
          >
            <Edit className="w-4 h-4" />
            <span>Edit Rubric</span>
          </DropdownMenuItem>

          {/* New Version */}
          <DropdownMenuItem
            onClick={() => navigate(`/jobs/${jobId}/rubric/new`)}
            className="gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Version</span>
          </DropdownMenuItem>

          {/* Version Switcher (if multiple versions) */}
          {versionData && versionData.versions.length > 1 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="gap-2 cursor-pointer">
                  <span>Switch Version</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-40">
                  {versionData.versions.map((v) => (
                    <DropdownMenuItem
                      key={v.rubric_id}
                      onClick={() => handleSwitchVersion(v.rubric_version, v.rubric_id)}
                      className="gap-2 cursor-pointer flex justify-between"
                    >
                      <span>{v.rubric_version}</span>
                      {v.is_active && <Check className="w-4 h-4 text-green-600" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* View Rubric Dialog */}
      {jobData?.criteria && (
        <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Rubric v{jobData.criteria.version}</DialogTitle>
              <DialogDescription>
                Threshold: {jobData.criteria.threshold_score}%
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-2 justify-end pb-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadRubricJson}
                disabled={isDownloading}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                {isDownloading ? 'Downloading...' : 'Download JSON'}
              </Button>
            </div>
            <Criterias criterias={jobData.criteria} sectionsOnly />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default RubricManager;
