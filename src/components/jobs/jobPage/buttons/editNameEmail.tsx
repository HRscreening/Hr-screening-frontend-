import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CandidateCreateSchema, CandidateUpdateSchema } from "@/types/candidateHandlerSchema";
import { ZodError } from "zod";
import { useUpdateCandidate } from "@/hooks/job_hooks/applications/useUpdateCandidate";
import { toast } from "sonner";


type EditNameEmailProps = {
  open: boolean;
  setOpen: (value: boolean) => void;
  applicationId: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  candidate_id: string | null;
  onSuccess? : () => void
};


const EditNameEmail = ({
  applicationId,
  name,
  email,
  phone,
  candidate_id,
  open,
  setOpen,
  onSuccess
}: EditNameEmailProps) => {
  const [nameInput, setNameInput] = useState(name || "");
  const [emailInput, setEmailInput] = useState(email || "");
  const [phoneInput, setPhoneInput] = useState(phone || "");
  const [error, setError] = useState<string | null>(null);

  const { mutate: updateCandidate, isPending } = useUpdateCandidate();

  const handleClose = () => {
    setOpen(false);
    setNameInput(name || "");
    setEmailInput(email || "");
    setPhoneInput(phone || "");
    setError(null);
  };

  function handleSubmit() {
    setError(null);

    try {
      if (!nameInput || !emailInput) {
        setError("Full name and email are required.");
        return;
      }

      if (nameInput.trim().toLocaleLowerCase() === "na") {
        setError("Please enter a valid name.");
        return;
      }

      if (!candidate_id) {
        CandidateCreateSchema.parse({ full_name: nameInput, email: emailInput, phone: phoneInput || undefined });
      } else {
        CandidateUpdateSchema.parse({ full_name: nameInput, email: emailInput, phone: phoneInput || undefined });
      }
    } catch (err) {
      if (err instanceof ZodError) {
        setError("Invalid input");
        return;
      }
    }

    updateCandidate(
      {
        applicationId,
        candidateId: candidate_id,
        full_name: nameInput,
        email: emailInput,
        phone: phoneInput || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Candidate information updated");
          setOpen(false);
          onSuccess?.();
        },
        onError: () => {
          setError("An error occurred while updating the information.");
        },
      }
    );
  }


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Edit Candidate Information
          </DialogTitle>
          <DialogDescription>
            Update the candidate's name, email, and phone number.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Enter candidate's name"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="Enter candidate's email"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              placeholder="Enter candidate's phone number"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isPending}
          >
            Cancel
          </Button>

          <Button
            onClick={handleSubmit}
            disabled={isPending}
          >
            {isPending ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditNameEmail;
