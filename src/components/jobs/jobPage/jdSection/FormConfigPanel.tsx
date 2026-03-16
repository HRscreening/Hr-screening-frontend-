import { useState, useEffect } from 'react';
import axios from '@/axiosConfig';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CheckCircle2, Info, Save, Plus } from 'lucide-react';
import { useJobId } from '@/store/jobPageStore';

// ── Types ─────────────────────────────────────────────────────────────────────

interface FormQuestion {
  id: string;
  key: string;
  label: string;
  type: string;
  required: boolean;
  removable: boolean;
  enabled?: boolean;
  placeholder?: string;
}

interface FormConfig {
  id: string;
  status: string;
  version_number: number;
  questions: FormQuestion[];
}

const QUESTION_TYPES = [
  { value: 'text', label: 'Short text' },
  { value: 'textarea', label: 'Long text' },
  { value: 'number', label: 'Number' },
  { value: 'email', label: 'Email' },
  { value: 'url', label: 'URL / Link' },
];

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  onActivated?: () => void;
}

export default function FormConfigPanel({ onActivated }: Props) {
  const jobId = useJobId();
  const [config, setConfig] = useState<FormConfig | null>(null);
  const [questions, setQuestions] = useState<FormQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Add question dialog state
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newType, setNewType] = useState('text');
  const [newRequired, setNewRequired] = useState(false);

  // ── Fetch ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!jobId) return;
    const load = async () => {
      setIsLoading(true);
      try {
        const res = await axios.get(`/jobs/${jobId}/form-config`);
        setConfig(res.data);
        // Ensure all questions have enabled defaulting to true
        const qs: FormQuestion[] = (res.data.questions ?? []).map((q: FormQuestion) => ({
          ...q,
          enabled: q.enabled !== false,
        }));
        setQuestions(qs);
      } catch {
        toast.error('Failed to load form configuration');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [jobId]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const toggleEnabled = (id: string) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, enabled: !(q.enabled !== false) } : q))
    );
    setIsDirty(true);
  };

  const toggleRequired = (id: string) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, required: !q.required } : q))
    );
    setIsDirty(true);
  };

  const handleAddQuestion = () => {
    const trimmedLabel = newLabel.trim();
    if (!trimmedLabel) {
      toast.error('Question label is required');
      return;
    }
    const key = `custom_${Date.now()}`;
    const newQ: FormQuestion = {
      id: key,
      key,
      label: trimmedLabel,
      type: newType,
      required: newRequired,
      removable: true,
      enabled: true,
    };
    setQuestions((prev) => [...prev, newQ]);
    setIsDirty(true);
    setAddDialogOpen(false);
    setNewLabel('');
    setNewType('text');
    setNewRequired(false);
  };

  const handleSave = async () => {
    if (!config) return;
    setIsSaving(true);
    try {
      await axios.put(`/jobs/${jobId}/form-config/${config.id}`, { questions });
      toast.success('Form questions saved');
      setIsDirty(false);
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Failed to save questions');
    } finally {
      setIsSaving(false);
    }
  };

  const handleActivate = async () => {
    if (!config) return;
    setIsActivating(true);
    try {
      await axios.post(`/jobs/${jobId}/form-config/${config.id}/activate`);
      toast.success('Form config activated');
      const res = await axios.get(`/jobs/${jobId}/form-config`);
      setConfig(res.data);
      const qs: FormQuestion[] = (res.data.questions ?? []).map((q: FormQuestion) => ({
        ...q,
        enabled: q.enabled !== false,
      }));
      setQuestions(qs);
      onActivated?.();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Failed to activate form config');
    } finally {
      setIsActivating(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
        Loading form config…
      </div>
    );
  }

  if (!config) return null;

  const coreQuestions = questions.filter((q) => !q.removable);
  const optionalQuestions = questions.filter((q) => q.removable);
  const isActive = config.status === 'active';

  const statusColor = isActive
    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Form v{config.version_number}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor}`}>
            {config.status}
          </span>
        </div>
        <div className="flex gap-2">
          {isDirty && (
            <Button size="sm" variant="outline" onClick={handleSave} disabled={isSaving}>
              <Save className="w-3.5 h-3.5 mr-1" />
              {isSaving ? 'Saving…' : 'Save changes'}
            </Button>
          )}
          {!isActive && (
            <Button size="sm" onClick={handleActivate} disabled={isActivating || isDirty}>
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              {isActivating ? 'Activating…' : 'Activate'}
            </Button>
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground flex items-start gap-1.5">
        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        Toggle fields on/off to control what candidates see. Core fields are always shown.
        Mark fields as required to make them mandatory.
      </p>

      {/* Core questions */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Core fields (always visible)
        </p>
        {coreQuestions.map((q) => (
          <div
            key={q.id}
            className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-muted/40 border border-border/50"
          >
            <div>
              <p className="text-sm font-medium">{q.label}</p>
              <p className="text-xs text-muted-foreground capitalize">{q.type}</p>
            </div>
            <Badge variant="secondary" className="text-xs">Always on</Badge>
          </div>
        ))}
      </div>

      <Separator />

      {/* Optional questions */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Optional fields
        </p>
        {optionalQuestions.length === 0 ? (
          <p className="text-xs text-muted-foreground">No optional fields yet. Add your own below.</p>
        ) : (
          optionalQuestions.map((q) => {
            const isEnabled = q.enabled !== false;
            return (
              <div
                key={q.id}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg border transition-colors ${
                  isEnabled
                    ? 'border-border/50 hover:bg-muted/20'
                    : 'border-border/30 bg-muted/10 opacity-60'
                }`}
              >
                <div>
                  <p className="text-sm font-medium">{q.label}</p>
                  <p className="text-xs text-muted-foreground capitalize">{q.type}</p>
                </div>
                <div className="flex items-center gap-4">
                  {isEnabled && (
                    <div className="flex items-center gap-1.5">
                      <Label htmlFor={`req-${q.id}`} className="text-xs text-muted-foreground">
                        Required
                      </Label>
                      <Switch
                        id={`req-${q.id}`}
                        checked={q.required}
                        onCheckedChange={() => toggleRequired(q.id)}
                        disabled={isActive}
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <Label htmlFor={`en-${q.id}`} className="text-xs text-muted-foreground">
                      {isEnabled ? 'On' : 'Off'}
                    </Label>
                    <Switch
                      id={`en-${q.id}`}
                      checked={isEnabled}
                      onCheckedChange={() => toggleEnabled(q.id)}
                      disabled={isActive}
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add custom question */}
      {!isActive && (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => setAddDialogOpen(true)}
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          Add your own question
        </Button>
      )}

      {isActive && (
        <p className="text-xs text-muted-foreground">
          This form config is active. To make changes, save a new version.
        </p>
      )}

      {/* Add question dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add a custom question</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="new-label">Question label</Label>
              <Input
                id="new-label"
                placeholder="e.g. Years of experience"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Answer type</Label>
              <Select value={newType} onValueChange={setNewType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {QUESTION_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="new-required"
                checked={newRequired}
                onCheckedChange={setNewRequired}
              />
              <Label htmlFor="new-required" className="text-sm">
                Make this field required
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddQuestion}>Add question</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
