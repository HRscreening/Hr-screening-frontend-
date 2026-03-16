import { useState } from 'react';
import axios from '@/axiosConfig';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Sparkles, X, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import { useJobId } from '@/store/jobPageStore';

// ── Types ─────────────────────────────────────────────────────────────────────

interface WizardAnswers {
  role_title: string;
  department: string;
  openings: string;
  experience_level: string;
  experience_years_min: string;
  experience_years_max: string;
  employment_type: string;
  work_mode: string;
  location: string;
  salary_range: string;
  responsibilities: string;
  skills_required: string[];
  skills_nice_to_have: string[];
  education: string;
  certifications: string;
  company_description: string;
  role_highlights: string;
  benefits: string;
  special_requirements: string;
}

const DEFAULT_ANSWERS: WizardAnswers = {
  role_title: '',
  department: '',
  openings: '',
  experience_level: '',
  experience_years_min: '',
  experience_years_max: '',
  employment_type: '',
  work_mode: '',
  location: '',
  salary_range: '',
  responsibilities: '',
  skills_required: [],
  skills_nice_to_have: [],
  education: '',
  certifications: '',
  company_description: '',
  role_highlights: '',
  benefits: '',
  special_requirements: '',
};

// ── Skill tag input ───────────────────────────────────────────────────────────

function SkillTagInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const [input, setInput] = useState('');

  const addSkill = () => {
    const trimmed = input.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInput('');
  };

  const removeSkill = (s: string) => onChange(value.filter((v) => v !== s));

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addSkill();
            }
          }}
          placeholder="Type and press Enter"
          className="flex-1"
        />
        <Button type="button" variant="outline" size="sm" onClick={addSkill}>
          Add
        </Button>
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-1">
          {value.map((s) => (
            <Badge key={s} variant="secondary" className="text-xs gap-1">
              {s}
              <X
                className="w-3 h-3 cursor-pointer hover:text-destructive"
                onClick={() => removeSkill(s)}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Wizard steps ─────────────────────────────────────────────────────────────

const STEPS = [
  { label: 'Role basics' },
  { label: 'Skills & experience' },
  { label: 'Company & perks' },
];

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export default function AIJDWizard({ open, onClose, onSaved }: Props) {
  const jobId = useJobId();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<WizardAnswers>(DEFAULT_ANSWERS);
  const [isGenerating, setIsGenerating] = useState(false);

  const set = (field: keyof WizardAnswers, value: any) =>
    setAnswers((prev) => ({ ...prev, [field]: value }));

  const handleClose = () => {
    setStep(0);
    setAnswers(DEFAULT_ANSWERS);
    onClose();
  };

  const handleGenerate = async () => {
    if (!answers.role_title.trim()) {
      toast.error('Role title is required');
      return;
    }
    if (!answers.responsibilities.trim()) {
      toast.error('Key responsibilities are required');
      return;
    }

    setIsGenerating(true);
    try {
      const payload = {
        role_title: answers.role_title.trim(),
        department: answers.department || null,
        openings: answers.openings ? parseInt(answers.openings) : null,
        experience_level: answers.experience_level || 'mid',
        experience_years_min: answers.experience_years_min
          ? parseInt(answers.experience_years_min)
          : null,
        experience_years_max: answers.experience_years_max
          ? parseInt(answers.experience_years_max)
          : null,
        employment_type: answers.employment_type || null,
        work_mode: answers.work_mode || null,
        location: answers.location || null,
        salary_range: answers.salary_range || null,
        responsibilities: answers.responsibilities.trim(),
        skills_required: answers.skills_required.length ? answers.skills_required : null,
        skills_nice_to_have: answers.skills_nice_to_have.length
          ? answers.skills_nice_to_have
          : null,
        education: answers.education || null,
        certifications: answers.certifications || null,
        company_description: answers.company_description || null,
        role_highlights: answers.role_highlights || null,
        benefits: answers.benefits || null,
        special_requirements: answers.special_requirements || null,
      };

      await axios.post(`/jd-builder/generate-and-save`, payload, {
        params: { job_id: jobId },
      });

      toast.success('JD generated and saved as draft');
      handleClose();
      onSaved();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Failed to generate JD. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-500" />
            Generate JD with AI
          </DialogTitle>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 my-2">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-1">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  i === step
                    ? 'bg-primary text-primary-foreground'
                    : i < step
                    ? 'bg-green-500 text-white'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {i < step ? '✓' : i + 1}
              </div>
              <span
                className={`text-xs ${
                  i === step ? 'text-foreground font-medium' : 'text-muted-foreground'
                }`}
              >
                {s.label}
              </span>
              {i < STEPS.length - 1 && (
                <ChevronRight className="w-3 h-3 text-muted-foreground mx-1" />
              )}
            </div>
          ))}
        </div>

        {/* ── Step 0: Role basics ────────────────────────────────────────── */}
        {step === 0 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="role_title">
                Role title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="role_title"
                placeholder="e.g. Senior Backend Engineer"
                value={answers.role_title}
                onChange={(e) => set('role_title', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Department</Label>
                <Input
                  placeholder="e.g. Engineering"
                  value={answers.department}
                  onChange={(e) => set('department', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Openings</Label>
                <Input
                  type="number"
                  placeholder="1"
                  value={answers.openings}
                  onChange={(e) => set('openings', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Experience level</Label>
              <Select
                value={answers.experience_level}
                onValueChange={(v) => set('experience_level', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  {['entry', 'mid', 'senior', 'lead', 'executive'].map((v) => (
                    <SelectItem key={v} value={v}>
                      {v.charAt(0).toUpperCase() + v.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Min years exp.</Label>
                <Input
                  type="number"
                  placeholder="2"
                  value={answers.experience_years_min}
                  onChange={(e) => set('experience_years_min', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Max years exp.</Label>
                <Input
                  type="number"
                  placeholder="5"
                  value={answers.experience_years_max}
                  onChange={(e) => set('experience_years_max', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Employment type</Label>
                <Select
                  value={answers.employment_type}
                  onValueChange={(v) => set('employment_type', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      { label: 'Full-time', value: 'full_time' },
                      { label: 'Part-time', value: 'part_time' },
                      { label: 'Contract', value: 'contract' },
                      { label: 'Internship', value: 'internship' },
                      { label: 'Freelance', value: 'freelance' },
                    ].map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Work mode</Label>
                <Select
                  value={answers.work_mode}
                  onValueChange={(v) => set('work_mode', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select mode" />
                  </SelectTrigger>
                  <SelectContent>
                    {['remote', 'hybrid', 'onsite'].map((v) => (
                      <SelectItem key={v} value={v}>
                        {v.charAt(0).toUpperCase() + v.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Location</Label>
                <Input
                  placeholder="e.g. Bangalore, India"
                  value={answers.location}
                  onChange={(e) => set('location', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Salary range</Label>
                <Input
                  placeholder="e.g. ₹18–25 LPA"
                  value={answers.salary_range}
                  onChange={(e) => set('salary_range', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Step 1: Skills & responsibilities ─────────────────────────── */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>
                Key responsibilities <span className="text-destructive">*</span>
              </Label>
              <Textarea
                placeholder="List the main duties and responsibilities. Be specific about day-to-day work."
                className="min-h-28"
                value={answers.responsibilities}
                onChange={(e) => set('responsibilities', e.target.value)}
              />
            </div>

            <SkillTagInput
              label="Required skills"
              value={answers.skills_required}
              onChange={(v) => set('skills_required', v)}
            />

            <SkillTagInput
              label="Nice-to-have skills"
              value={answers.skills_nice_to_have}
              onChange={(v) => set('skills_nice_to_have', v)}
            />

            <div className="space-y-1.5">
              <Label>Education / degree</Label>
              <Input
                placeholder="e.g. B.Tech or equivalent"
                value={answers.education}
                onChange={(e) => set('education', e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Certifications</Label>
              <Input
                placeholder="e.g. AWS Certified Solutions Architect"
                value={answers.certifications}
                onChange={(e) => set('certifications', e.target.value)}
              />
            </div>
          </div>
        )}

        {/* ── Step 2: Company & perks ────────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>About the company / team</Label>
              <Textarea
                placeholder="Brief description of your company, culture, or the team the candidate will join."
                className="min-h-24"
                value={answers.company_description}
                onChange={(e) => set('company_description', e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>What makes this role exciting</Label>
              <Textarea
                placeholder="Unique challenges, growth opportunities, interesting tech, etc."
                className="min-h-20"
                value={answers.role_highlights}
                onChange={(e) => set('role_highlights', e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Benefits & perks</Label>
              <Textarea
                placeholder="Health insurance, flexible hours, ESOPs, learning budget, etc."
                className="min-h-20"
                value={answers.benefits}
                onChange={(e) => set('benefits', e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Special requirements</Label>
              <Input
                placeholder="e.g. Must be willing to travel 20%"
                value={answers.special_requirements}
                onChange={(e) => set('special_requirements', e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => (step === 0 ? handleClose() : setStep(step - 1))}
            disabled={isGenerating}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            {step === 0 ? 'Cancel' : 'Back'}
          </Button>

          {step < STEPS.length - 1 ? (
            <Button size="sm" onClick={() => setStep(step + 1)}>
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button size="sm" onClick={handleGenerate} disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-1" />
                  Generate JD
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
