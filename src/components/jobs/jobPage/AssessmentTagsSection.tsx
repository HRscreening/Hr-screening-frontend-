import { useState } from 'react';
import { toast } from 'sonner';
import { Tag, X, Sparkles, Loader2, Plus } from 'lucide-react';

import axios from '@/axiosConfig';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
// ─── Constants ────────────────────────────────────────────────────────────────

const MIN_TAGS = 2;
const MAX_TAGS = 5;

// ─── AssessmentTagsSection ────────────────────────────────────────────────────

export default function AssessmentTagsSection({
  tags,
  onChange,
  roundTitle,
  jobId,
  disabled,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  roundTitle: string;
  jobId: string;
  disabled?: boolean;
}) {
  const [inputValue, setInputValue] = useState('');
  const [generating, setGenerating] = useState(false);

  // ── Add a single tag manually ─────────────────────────────────────────────

  const addTag = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    if (tags.length >= MAX_TAGS) {
      toast.error(`Maximum ${MAX_TAGS} tags allowed`);
      return;
    }

    if (tags.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
      toast.error('Tag already exists');
      return;
    }

    onChange([...tags, trimmed]);
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  // ── Remove a tag ──────────────────────────────────────────────────────────

  const removeTag = (index: number) => {
    onChange(tags.filter((_, i) => i !== index));
  };

  // ── Generate tags from API ────────────────────────────────────────────────

  const generateTags = async () => {
    if (!roundTitle.trim()) {
      toast.error('Please enter a round title first');
      return;
    }

    setGenerating(true);
    try {
      const res = await axios.get(
        `/assessment/generate-assessment-tags/${jobId}`,
        { params: { title: roundTitle } }
      );

      const generated: string[] = res.data?.tags ?? res.data ?? [];

      // Merge with existing (dedup, cap at MAX_TAGS)
      const existing = new Set(tags.map((t) => t.toLowerCase()));
      const merged = [...tags];

      for (const tag of generated) {
        if (merged.length >= MAX_TAGS) break;
        if (!existing.has(tag.toLowerCase())) {
          merged.push(tag);
          existing.add(tag.toLowerCase());
        }
      }

      onChange(merged);
      toast.success(`Generated ${merged.length - tags.length} new criterias`);
    } catch (err: any) {
      console.error('Failed to generate', err);
      const detail = err?.response?.data?.detail || err?.response?.data?.message;
      toast.error(detail ? String(detail) : 'Failed to generate');
    } finally {
      setGenerating(false);
    }
  };

  const handlePreviewClick = (criterias: string[]) => {

  if (!criterias || criterias.length === 0) {
    toast.error('Please add at least one criteria');
    return;
  }

  const key = `preview_${jobId}_${Date.now()}`;
  sessionStorage.setItem(key, JSON.stringify(criterias));
  window.open(
    `/jobs/${jobId}/assessment-form/preview?key=${key}`,
    "_blank"
  );
};

  // ── Render ────────────────────────────────────────────────────────────────

  const atMax = tags.length >= MAX_TAGS;

  return (
    <div className="space-y-2">
      {/* Label row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Tag className="h-3 w-3 text-primary/50" />
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
            Assessment Criterias
          </p>
          <span className="text-[10px] text-muted-foreground/60 font-normal normal-case ml-1">
            ({tags.length}/{MAX_TAGS}{tags.length < MIN_TAGS ? ` · min ${MIN_TAGS}` : ''})
          </span>
        </div>
        <span className="text-[10px] text-underline cursor-pointer text-blue-500 font-normal normal-case ml-1 "
        onClick={()=>handlePreviewClick(tags)}
        >Preview</span>
      </div>
        <p className="text-[10px] text-muted-foreground/60 font-normal normal-case ml-1">
          These criterias will be used to generate questions for the interview panel.
        </p>

      {/* Tag display area */}
      <div className="min-h-[2.5rem] flex flex-wrap gap-1.5 p-2.5 rounded-lg border border-border/40 bg-muted/10">
        {tags.length === 0 && (
          <span className="text-xs text-muted-foreground/50 italic py-1">
            No tags added yet — type below or click Generate
          </span>
        )}
        {tags.map((tag, idx) => (
          <Badge
            key={`${tag}-${idx}`}
            variant="secondary"
            className="gap-1 text-xs font-medium pl-2.5 pr-1.5 py-0.5 h-6 bg-primary/10 text-primary border-0 hover:bg-primary/15 transition-colors animate-in fade-in-0 zoom-in-95 duration-200"
          >
            {tag}
            {!disabled && (
              <button
                type="button"
                className="ml-0.5 rounded-full p-0.5 hover:bg-primary/20 transition-colors"
                onClick={() => removeTag(idx)}
              >
                <X className="h-2.5 w-2.5" />
              </button>
            )}
          </Badge>
        ))}
      </div>

      {/* Input row + Generate button */}
      {!disabled && (
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-1.5">
            <Input
              placeholder={atMax ? 'Max tags reached' : 'Type a tag and press Enter…'}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={atMax || generating}
              className="h-8 text-sm bg-transparent flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addTag}
              disabled={atMax || !inputValue.trim() || generating}
              className="h-8 text-[10px] gap-1 px-2.5 shrink-0"
            >
              <Plus className="h-3 w-3" />
              Add
            </Button>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={generateTags}
            disabled={generating}
            className="h-8 text-[10px] gap-1.5 px-3 shrink-0 border-dashed hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all"
          >
            {generating ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Sparkles className="h-3 w-3" />
            )}
            {generating ? 'Generating…' : 'Generate'}
          </Button>
        </div>
      )}

      {/* Validation hint */}
      {tags.length > 0 && tags.length < MIN_TAGS && (
        <p className="text-[10px] text-amber-500 flex items-center gap-1">
          Add at least {MIN_TAGS - tags.length} more tag{MIN_TAGS - tags.length > 1 ? 's' : ''} (minimum {MIN_TAGS})
        </p>
      )}
    </div>
  );
}
