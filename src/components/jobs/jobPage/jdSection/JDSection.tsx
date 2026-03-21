import { useState, useEffect, useCallback } from 'react';
import axios from '@/axiosConfig';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Plus,
  Sparkles,
  FileText,
  CheckCircle2,
  Trash2,
  Copy,
  Link2,
  LinkIcon,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Eye,
  History,
} from 'lucide-react';
import { useJobId } from '@/store/jobPageStore';
import AIJDWizard from './AIJDWizard';
import FormConfigPanel from './FormConfigPanel';

// ── Types ─────────────────────────────────────────────────────────────────────

interface JDVersion {
  id: string;
  version_number: number;
  title: string;
  content: string;
  status: 'draft' | 'active' | 'archived';
  generation_method: 'manual' | 'ai_generated';
  created_at: string;
}

interface PublicLinkData {
  public_apply_enabled: boolean;
  public_slug: string | null;
  public_url: string | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<string, string> = {
  draft: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  archived: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

// ── JD Section ────────────────────────────────────────────────────────────────

interface Props {
  onLinkChange?: (link: PublicLinkData) => void;
}

export default function JDSection({ onLinkChange }: Props) {
  const jobId = useJobId();

  const [versions, setVersions] = useState<JDVersion[]>([]);
  const [linkData, setLinkData] = useState<PublicLinkData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // UI state
  const [aiWizardOpen, setAiWizardOpen] = useState(false);
  const [createManualOpen, setCreateManualOpen] = useState(false);
  const [viewJd, setViewJd] = useState<JDVersion | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<JDVersion | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [activeSection, setActiveSection] = useState<'jd' | 'form'>('jd');

  // Manual create form
  const [manualTitle, setManualTitle] = useState('');
  const [manualContent, setManualContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // ── Data fetching ───────────────────────────────────────────────────────────

  const fetchVersions = useCallback(async () => {
    if (!jobId) return;
    try {
      const res = await axios.get(`/jobs/${jobId}/jd-versions`);
      setVersions(res.data.versions ?? []);
    } catch {
      toast.error('Failed to load JD versions');
    }
  }, [jobId]);

  const fetchPublicLink = useCallback(async () => {
    if (!jobId) return;
    try {
      const res = await axios.get(`/jobs/${jobId}/public-link`);
      setLinkData(res.data);
      onLinkChange?.(res.data);
    } catch {
      const empty = { public_apply_enabled: false, public_slug: null, public_url: null };
      setLinkData(empty);
      onLinkChange?.(empty);
    }
  }, [jobId, onLinkChange]);

  useEffect(() => {
    if (!jobId) return;
    setIsLoading(true);
    Promise.all([fetchVersions(), fetchPublicLink()]).finally(() => setIsLoading(false));
  }, [jobId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-generate link ──────────────────────────────────────────────────────

  const tryAutoGenerateLink = useCallback(async () => {
    if (linkData?.public_apply_enabled) return;
    try {
      const res = await axios.post(`/jobs/${jobId}/public-link`, {});
      setLinkData(res.data);
      onLinkChange?.(res.data);
      toast.success('Public apply link is ready — copy it from the bar above.');
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? 'Failed to generate link';
      toast.error(msg);
    }
  }, [jobId, linkData, onLinkChange]);

  // ── JD actions ─────────────────────────────────────────────────────────────

  const handleCreateManual = async () => {
    if (!manualTitle.trim() || !manualContent.trim()) {
      toast.error('Title and content are required');
      return;
    }
    setIsSaving(true);
    try {
      const res = await axios.post(`/jobs/${jobId}/jd-versions`, {
        title: manualTitle.trim(),
        content: manualContent.trim(),
      });
      const jdId = res.data?.id;
      // Auto-activate if there's no active JD yet
      if (jdId && !activeJD) {
        await axios.post(`/jobs/${jobId}/jd-versions/${jdId}/activate`);
      }
      toast.success('JD saved');
      setCreateManualOpen(false);
      setManualTitle('');
      setManualContent('');
      await fetchVersions();
      await tryAutoGenerateLink();
    } catch {
      toast.error('Failed to create JD');
    } finally {
      setIsSaving(false);
    }
  };

  const handleActivate = async (jd: JDVersion) => {
    try {
      await axios.post(`/jobs/${jobId}/jd-versions/${jd.id}/activate`);
      toast.success(`JD v${jd.version_number} is now active`);
      await fetchVersions();
      await tryAutoGenerateLink();
    } catch {
      toast.error('Failed to activate JD');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await axios.delete(`/jobs/${jobId}/jd-versions/${deleteTarget.id}`);
      toast.success('JD version deleted');
      setDeleteTarget(null);
      fetchVersions();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Failed to delete JD');
    }
  };

  // ── Public link actions ─────────────────────────────────────────────────────

  const handleGenerateLink = async () => {
    try {
      const res = await axios.post(`/jobs/${jobId}/public-link`, {});
      toast.success('Public apply link generated');
      setLinkData(res.data);
      onLinkChange?.(res.data);
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Failed to generate link');
    }
  };

  const handleDisableLink = async () => {
    try {
      await axios.delete(`/jobs/${jobId}/public-link`);
      toast.success('Public apply link disabled');
      const empty = { public_apply_enabled: false, public_slug: null, public_url: null };
      setLinkData(empty);
      onLinkChange?.(empty);
    } catch {
      toast.error('Failed to disable link');
    }
  };

  const handleCopyLink = () => {
    if (linkData?.public_url) {
      navigator.clipboard.writeText(linkData.public_url);
      toast.success('Link copied');
    }
  };

  // ── Derived ────────────────────────────────────────────────────────────────

  const activeJD = versions.find((v) => v.status === 'active');
  const otherVersions = versions.filter((v) => v.status !== 'active');

  // ── Render ─────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
        Loading…
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-2">

      {/* Sub-tabs */}
      <div className="flex flex-row gap-5 items-center border-b border-border pb-0">
        {[
          { label: 'Job Description', value: 'jd' as const },
          { label: 'Application Form', value: 'form' as const },
        ].map((tab) => (
          <span
            key={tab.value}
            onClick={() => setActiveSection(tab.value)}
            className={`cursor-pointer inline-flex items-center px-1 pb-2 border-b-2 text-sm font-medium transition-colors ${
              activeSection === tab.value
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {tab.label}
          </span>
        ))}
      </div>

      {/* ── JD Tab ───────────────────────────────────────────────────────── */}
      {activeSection === 'jd' && (
        <div className="space-y-5">

          {/* Active JD card */}
          {activeJD ? (
            <Card className="border-green-500/40 bg-green-50/20 dark:bg-green-900/5">
              <CardContent className="pt-4 pb-4 px-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{activeJD.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Active JD
                        {activeJD.generation_method === 'ai_generated' && (
                          <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 text-xs">AI</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 text-xs shrink-0" onClick={() => setViewJd(activeJD)}>
                    <Eye className="w-3.5 h-3.5 mr-1" /> View
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center gap-3 border border-dashed rounded-lg">
              <FileText className="w-8 h-8 text-muted-foreground" />
              <p className="text-muted-foreground text-sm">No active job description.</p>
              <p className="text-xs text-muted-foreground">Write one manually or generate with AI.</p>
            </div>
          )}

          {/* Actions row */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setCreateManualOpen(true)}>
              <Plus className="w-4 h-4 mr-1" /> Write manually
            </Button>
            <Button size="sm" onClick={() => setAiWizardOpen(true)}>
              <Sparkles className="w-4 h-4 mr-1" /> Generate with AI
            </Button>
          </div>

          {/* Version history (collapsed by default) */}
          {otherVersions.length > 0 && (
            <div>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <History className="w-3.5 h-3.5" />
                {showHistory ? 'Hide' : 'Show'} version history ({otherVersions.length})
                {showHistory ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>

              {showHistory && (
                <div className="mt-2 space-y-2">
                  {otherVersions.map((jd) => (
                    <Card key={jd.id} className="opacity-80">
                      <CardContent className="py-3 px-4">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xs font-mono text-muted-foreground">v{jd.version_number}</span>
                            <span className="text-sm truncate">{jd.title}</span>
                            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${STATUS_BADGE[jd.status]}`}>
                              {jd.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {jd.status === 'draft' && (
                              <Button variant="outline" size="sm" className="h-6 text-xs" onClick={() => handleActivate(jd)}>
                                Make active
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setViewJd(jd)}>
                              View
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-xs text-destructive hover:text-destructive"
                              onClick={() => setDeleteTarget(jd)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Public apply link */}
          <Separator />
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Link2 className="w-4 h-4 text-primary" />
              <h3 className="font-medium text-sm">Public Apply Link</h3>
            </div>

            {linkData?.public_apply_enabled ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 bg-muted/50 rounded px-3 py-2 min-w-0 flex-1">
                    <LinkIcon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate text-xs font-mono">{linkData.public_url}</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleCopyLink}>
                    <Copy className="w-3.5 h-3.5 mr-1" /> Copy
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => window.open(linkData.public_url!, '_blank')}>
                    <ExternalLink className="w-3.5 h-3.5 mr-1" /> Open
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive border-destructive/40 hover:bg-destructive/5"
                    onClick={handleDisableLink}
                  >
                    Disable
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Share this URL on LinkedIn, Naukri, or anywhere. Candidates click it to apply.
                </p>
              </div>
            ) : !activeJD ? (
              <p className="text-xs text-muted-foreground">
                Add and activate a JD first, then activate the Application Form — the link will appear automatically.
              </p>
            ) : (
              <div className="flex items-center gap-3">
                <p className="text-xs text-muted-foreground">
                  Activate the <strong>Application Form</strong> (tab above) to get the link, or generate it now if the form is already active.
                </p>
                <Button size="sm" variant="outline" onClick={handleGenerateLink}>
                  Generate link
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Form Config Tab ───────────────────────────────────────────────── */}
      {activeSection === 'form' && (
        <div className="space-y-4">
          <FormConfigPanel onActivated={tryAutoGenerateLink} />

          {/* Public apply link — also visible in form tab */}
          <Separator />
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Link2 className="w-4 h-4 text-primary" />
              <h3 className="font-medium text-sm">Public Apply Link</h3>
            </div>
            {linkData?.public_apply_enabled ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 bg-muted/50 rounded px-3 py-2 min-w-0 flex-1">
                    <LinkIcon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate text-xs font-mono">{linkData.public_url}</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleCopyLink}>
                    <Copy className="w-3.5 h-3.5 mr-1" /> Copy
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => window.open(linkData.public_url!, '_blank')}>
                    <ExternalLink className="w-3.5 h-3.5 mr-1" /> Open
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Share this link with candidates to collect applications.
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <p className="text-xs text-muted-foreground">
                  No active public link. Generate one or activate the form first.
                </p>
                <Button size="sm" variant="outline" onClick={handleGenerateLink}>
                  Generate link
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── AI Wizard ───────────────────────────────────────────────────── */}
      <AIJDWizard
        open={aiWizardOpen}
        onClose={() => setAiWizardOpen(false)}
        onSaved={async () => {
          setAiWizardOpen(false);
          await fetchVersions();
          await tryAutoGenerateLink();
        }}
      />

      {/* ── Create Manual Dialog ────────────────────────────────────────── */}
      <Dialog open={createManualOpen} onOpenChange={setCreateManualOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Write Job Description</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="jd-title">Title</Label>
              <Input
                id="jd-title"
                placeholder="e.g. Senior Backend Engineer"
                value={manualTitle}
                onChange={(e) => setManualTitle(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="jd-content">Content (Markdown supported)</Label>
              <Textarea
                id="jd-content"
                placeholder="Write the full job description here…"
                className="min-h-64 font-mono text-sm"
                value={manualContent}
                onChange={(e) => setManualContent(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateManualOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateManual} disabled={isSaving}>
              {isSaving ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── View JD Dialog ──────────────────────────────────────────────── */}
      <Dialog open={!!viewJd} onOpenChange={() => setViewJd(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>{viewJd?.title}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[viewJd?.status ?? 'draft']}`}>
                {viewJd?.status}
              </span>
            </DialogTitle>
          </DialogHeader>
          <div className="text-sm whitespace-pre-wrap font-mono bg-muted/30 rounded p-4 text-muted-foreground">
            {viewJd?.content}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm ──────────────────────────────────────────────── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete JD v{deleteTarget?.version_number}?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone. Active JDs cannot be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
