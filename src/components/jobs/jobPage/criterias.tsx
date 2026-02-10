import React, { useState } from "react";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from "sonner"
import {
  Form,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, ChevronRight, Target, Scale, X } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { snakeCaseToTitle, titleToSnakeCase } from '@/utils/snakeCaseToTitle';
import type { Criterion } from "@/types/types";
import type { Criteria } from "@/types/jobTypes";


// Form schema for threshold
const thresholdSchema = z.object({
  threshold_score: z.number().min(0).max(100),
});

interface CriteriaManagerProps {
  criterias: Criteria;
  onUpdate: (updatedJD : any) => void;
  onNext?: () => void;
}

// Individual Criterion Component
interface CriterionItemProps {
  name: string;
  criterion: Criterion;
  onUpdate: (criterion: Criterion) => void;
  onDelete: () => void;
  criterionType: 'mandatory' | 'screening';
}

const CriterionItem: React.FC<CriterionItemProps> = ({
  name,
  criterion,
  onUpdate,
  onDelete,
  criterionType,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [newSubCriterionName, setNewSubCriterionName] = useState('');

  const hasSubCriteria = criterion.sub_criteria && Object.keys(criterion.sub_criteria).length > 0;
  const hasValue = criterion.value !== undefined && criterion.value !== null;

  const totalWeight = hasSubCriteria
    ? criterion.sub_criteria && Object.values(criterion.sub_criteria).reduce((sum, sub) => sum + sub.weight, 0)
    : 0;

  const isWeightValid = !hasSubCriteria || totalWeight && Math.abs(totalWeight - 100) < 0.01;

  const handleWeightChange = (newWeight: number[]) => {
    onUpdate({ ...criterion, weight: newWeight[0] });
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onUpdate({ ...criterion, value: value });
  };

  const addValueField = () => {
    onUpdate({ ...criterion, value: "" });
  };

  const removeValueField = () => {
    const { value, ...rest } = criterion;
    onUpdate(rest as Criterion);
  };

  const addSubCriterion = () => {
    if (!newSubCriterionName.trim()) {
      toast.error("First enter sub-criterion name");
      return;
    }

    const subCriteria = criterion.sub_criteria || {};
    const newSubCriteria = {
      [titleToSnakeCase(newSubCriterionName)]: {
        weight: 0,
        sub_criteria: null, // No further nesting allowed
      },
      ...subCriteria,
    };

    onUpdate({ ...criterion, sub_criteria: newSubCriteria });
    setNewSubCriterionName('');
  };

  const updateSubCriterion = (subName: string, updatedSub: Criterion) => {
    if (!criterion.sub_criteria) return;

    const newSubCriteria = {
      ...criterion.sub_criteria,
      [subName]: updatedSub,
    };

    onUpdate({ ...criterion, sub_criteria: newSubCriteria });
  };

  const deleteSubCriterion = (subName: string) => {
    if (!criterion.sub_criteria) return;

    const newSubCriteria = { ...criterion.sub_criteria };
    delete newSubCriteria[subName];

    onUpdate({
      ...criterion,
      sub_criteria: Object.keys(newSubCriteria).length > 0 ? newSubCriteria : null,
    });
  };

  return (
    <>
      <div className="bg-card rounded-lg border border-border hover:border-primary/40 hover:shadow-sm transition-all">
        <div className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <h4 className="font-semibold text-base flex items-center gap-2">
                {snakeCaseToTitle(name)}
                {criterionType === 'mandatory' && (
                  <span className="text-destructive">*</span>
                )}
              </h4>
              {!isWeightValid && hasSubCriteria && (
                <p className="text-xs text-destructive mt-1">
                  Sub-criteria weights must sum to 100% (currently: {totalWeight?.toFixed(1)}%)
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              {hasSubCriteria && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight
                    className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                  />
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Weight Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-muted-foreground" />
                Weight
              </label>
              <span className="text-sm font-semibold text-primary">
                {criterion.weight.toFixed(1)}%
              </span>
            </div>
            <Slider
              value={[criterion.weight]}
              onValueChange={handleWeightChange}
              min={0}
              max={100}
              step={0.1}
              className="cursor-pointer"
            />
            <p className="text-xs text-muted-foreground">
              Importance of this criterion in evaluation
            </p>
          </div>

          {/* Value Input - Separate Section */}
          {hasValue && (
            <div className="mt-4 pt-4 border-t space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-muted-foreground" />
                  Target Value
                </label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={removeValueField}
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Remove target value</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                type="text"
                value={criterion.value ?? ''}
                onChange={handleValueChange}
                placeholder="Enter target value"
                className="h-9"
              />
              <p className="text-xs text-muted-foreground">
                Expected value for this criterion
              </p>
            </div>
          )}

          {/* Add Value Button - Only show if no value exists */}
          {!hasValue && (
            <div className="mt-4 pt-4 border-t">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addValueField}
                      className="gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Target Value
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Add a target value for this criterion</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}

          {/* Add Sub-Criterion */}
          <div className="mt-4 pt-4 border-t">
            <div className="flex gap-2">
              <Input
                placeholder="Add sub-criterion (e.g., Python proficiency)"
                value={snakeCaseToTitle(newSubCriterionName)}
                onChange={(e) => setNewSubCriterionName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSubCriterion())}
                className="flex-1 h-9"
              />
              <Button
                type="button"
                onClick={addSubCriterion}
                size="sm"
                variant="outline"
                className="gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Add Sub
              </Button>
            </div>
          </div>

          {/* Sub-Criteria */}
          {hasSubCriteria && isExpanded && (
            <div className="mt-4 pt-4 border-t space-y-3">
              <p className="text-sm font-medium text-muted-foreground mb-3">Sub-criteria</p>
              {Object.entries(criterion.sub_criteria!).map(([subName, subCriterion]) => (
                <SubCriterionItem
                  key={subName}
                  name={subName}
                  criterion={subCriterion}
                  onUpdate={(updated) => updateSubCriterion(subName, updated)}
                  onDelete={() => deleteSubCriterion(subName)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete criterion?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{snakeCaseToTitle(name)}"? This will also remove all sub-criteria.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

// Sub-Criterion Component (simplified, no nesting)
interface SubCriterionItemProps {
  name: string;
  criterion: Criterion;
  onUpdate: (criterion: Criterion) => void;
  onDelete: () => void;
}

const SubCriterionItem: React.FC<SubCriterionItemProps> = ({
  name,
  criterion,
  onUpdate,
  onDelete,
}) => {
  const hasValue = criterion.value !== undefined && criterion.value !== null;

  const handleWeightChange = (newWeight: number[]) => {
    onUpdate({ ...criterion, weight: newWeight[0] });
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onUpdate({ ...criterion, value: value });
  };

  const addValueField = () => {
    onUpdate({ ...criterion, value: "" });
  };

  const removeValueField = () => {
    const { value, ...rest } = criterion;
    onUpdate(rest as Criterion);
  };

  return (
    <div className="bg-muted/30 rounded-md p-4 border border-border/50">
      <div className="flex items-start justify-between gap-4 mb-3">
        <h5 className="font-medium text-sm">{snakeCaseToTitle(name)}</h5>
        <div className="flex items-center gap-1">
          {!hasValue && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={addValueField}
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-primary"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Add target value</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Weight Slider */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium flex items-center gap-1.5">
            <Scale className="w-3 h-3 text-muted-foreground" />
            Weight
          </label>
          <span className="text-xs font-semibold text-primary">
            {criterion.weight.toFixed(1)}%
          </span>
        </div>
        <Slider
          value={[criterion.weight]}
          onValueChange={handleWeightChange}
          min={0}
          max={100}
          step={0.1}
          className="cursor-pointer"
        />
      </div>

      {/* Value Input */}
      {hasValue && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium flex items-center gap-1.5">
              <Target className="w-3 h-3 text-muted-foreground" />
              Target Value
            </label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={removeValueField}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Remove target value</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Input
            type="text"
            value={criterion.value ?? ''}
            onChange={handleValueChange}
            placeholder="Enter target value"
            className="h-8 text-xs"
          />
        </div>
      )}
    </div>
  );
};

// Main Criteria Manager Component
function CriteriaManager (
  { criterias, onUpdate }: CriteriaManagerProps,
) {
  const [newMandatoryName, setNewMandatoryName] = useState('');
  const [newScreeningName, setNewScreeningName] = useState('');

  const form = useForm<z.infer<typeof thresholdSchema>>({
    resolver: zodResolver(thresholdSchema),
    defaultValues: {
      threshold_score: criterias.threshold_score,
    },
  });

  // Calculate total weights with null safety
  const mandatoryTotal = criterias.criteria?.mandatory_criteria
    ? Object.values(criterias.criteria.mandatory_criteria).reduce((sum, c) => sum + c.weight, 0)
    : 0;

  const screeningTotal = criterias.criteria?.screening_criteria
    ? Object.values(criterias.criteria.screening_criteria).reduce((sum, c) => sum + c.weight, 0)
    : 0;

  const isMandatoryValid = Math.abs(mandatoryTotal - 100) < 0.01;
  const isScreeningValid = Math.abs(screeningTotal - 100) < 0.01;

  // Add new criterion
  const addCriterion = (type: 'mandatory' | 'screening', name: string) => {
    if (!name.trim()) {
      toast.error("First enter criterion name");
      return;
    }

    const criteriaKey = type === 'mandatory' ? 'mandatory_criteria' : 'screening_criteria';
    const existingCriteria = criterias.criteria?.[criteriaKey] || {};

    if (existingCriteria[name]) {
      toast.error(`${name} already exists in ${type} criteria`);
      return;
    }

    const updatedCriteria = {
      [titleToSnakeCase(name)]: {
        weight: 0,
        sub_criteria: null,
      },
      ...existingCriteria
    };

    onUpdate({
      ...criterias,
      criteria: {
        ...criterias.criteria,
        [criteriaKey]: updatedCriteria,
      },
    });

    if (type === 'mandatory') {
      setNewMandatoryName('');
    } else {
      setNewScreeningName('');
    }

    toast.success(`Added ${name} to ${type} criteria`);
  };

  // Update criterion
  const updateCriterion = (
    type: 'mandatory' | 'screening',
    name: string,
    updated: Criterion
  ) => {
    const criteriaKey = type === 'mandatory' ? 'mandatory_criteria' : 'screening_criteria';

    onUpdate({
      ...criterias,
      criteria: {
        ...criterias.criteria,
        [criteriaKey]: {
          ...(criterias.criteria?.[criteriaKey] || {}),
          [name]: updated,
        },
      },
    });
  };

  // Delete criterion
  const deleteCriterion = (type: 'mandatory' | 'screening', name: string) => {
    const criteriaKey = type === 'mandatory' ? 'mandatory_criteria' : 'screening_criteria';
    const newCriteria = { ...(criterias.criteria?.[criteriaKey] || {}) };
    delete newCriteria[name];

    onUpdate({
      ...criterias,
      criteria: {
        ...criterias.criteria,
        [criteriaKey]: newCriteria,
      },
    });

    toast.success("Deleted Successfully");
  };

  const handleThresholdChange = (value: number[]) => {
    onUpdate({
      ...criterias,
      threshold_score: value[0],
    });
  };

  // const handleSubmit = () => {
    
  // };


  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <Form {...form} >
        <form className="space-y-6">
          {/* Threshold Score Card */}
          <Card className="border-2 border-primary/20 bg-linear-to-br from-primary/5 to-transparent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Threshold Score
              </CardTitle>
              <CardDescription>
                Minimum score required for candidates to pass the screening
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Passing Score</span>
                  <span className="text-3xl font-bold text-primary">
                    {criterias.threshold_score}%
                  </span>
                </div>
                <Slider
                  value={[criterias.threshold_score]}
                  onValueChange={handleThresholdChange}
                  min={0}
                  max={100}
                  step={1}
                  className="cursor-pointer"
                />
                <p className="text-sm text-muted-foreground">
                  Candidates scoring below this threshold will be automatically rejected
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Mandatory Criteria */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Mandatory Criteria
                    <span className="text-destructive text-xl">*</span>
                  </CardTitle>
                  <CardDescription>
                    Essential requirements that candidates must meet
                  </CardDescription>
                </div>
                <div className="text-right">
                  <div
                    className={`text-2xl font-bold ${isMandatoryValid ? 'text-green-600' : 'text-destructive'
                      }`}
                  >
                    {mandatoryTotal.toFixed(1)}%
                  </div>
                  <div className="text-xs text-muted-foreground">Total Weight</div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add New Mandatory Criterion */}
              <div className="flex gap-2 pb-2">
                <Input
                  placeholder="Add criterion (e.g., Bachelor's Degree, 5+ years experience)"
                  value={newMandatoryName}
                  onChange={(e) => setNewMandatoryName(e.target.value)}
                  onKeyUp={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCriterion('mandatory', newMandatoryName);
                    }
                  }}
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={() => addCriterion('mandatory', newMandatoryName)}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Criterion
                </Button>
              </div>

              {/* Mandatory Criteria List */}
              {Object.keys(criterias.criteria?.mandatory_criteria || {}).length > 0 && (
                <Separator />
              )}

              <div className="space-y-4">
                {Object.entries(criterias.criteria?.mandatory_criteria || {}).map(([name, criterion]) => (
                  <CriterionItem
                    key={name}
                    name={name}
                    criterion={criterion}
                    onUpdate={(updated) => updateCriterion('mandatory', name, updated)}
                    onDelete={() => deleteCriterion('mandatory', name)}
                    criterionType="mandatory"
                  />
                ))}

                {Object.keys(criterias.criteria?.mandatory_criteria || {}).length === 0 && (
                  <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg">
                    <p className="text-sm font-medium">No mandatory criteria defined yet</p>
                    <p className="text-xs mt-1">Add criteria that candidates must satisfy</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Screening Criteria */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Screening Criteria
                    <Badge variant="secondary" className="text-xs">Optional</Badge>
                  </CardTitle>
                  <CardDescription>
                    Additional factors for ranking and scoring candidates
                  </CardDescription>
                </div>
                <div className="text-right">
                  <div
                    className={`text-2xl font-bold ${isScreeningValid ? 'text-green-600' : 'text-destructive'
                      }`}
                  >
                    {screeningTotal.toFixed(1)}%
                  </div>
                  <div className="text-xs text-muted-foreground">Total Weight</div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add New Screening Criterion */}
              <div className="flex gap-2 pb-2">
                <Input
                  placeholder="Add criterion (e.g., Leadership skills, Communication ability)"
                  value={newScreeningName}
                  onChange={(e) => setNewScreeningName(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCriterion('screening', newScreeningName);
                    }
                  }}
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={() => addCriterion('screening', newScreeningName)}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Criterion
                </Button>
              </div>

              {/* Screening Criteria List */}
              {Object.keys(criterias.criteria?.screening_criteria || {}).length > 0 && (
                <Separator />
              )}

              <div className="space-y-4">
                {Object.entries(criterias.criteria?.screening_criteria || {}).map(([name, criterion]) => (
                  <CriterionItem
                    key={name}
                    name={name}
                    criterion={criterion}
                    onUpdate={(updated) => updateCriterion('screening', name, updated)}
                    onDelete={() => deleteCriterion('screening', name)}
                    criterionType="screening"
                  />
                ))}

                {Object.keys(criterias.criteria?.screening_criteria || {}).length === 0 && (
                  <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg">
                    <p className="text-sm font-medium">No screening criteria defined yet</p>
                    <p className="text-xs mt-1">Add criteria for evaluating candidates</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

        </form>
      </Form>
    </div>
  );
};

export default CriteriaManager;