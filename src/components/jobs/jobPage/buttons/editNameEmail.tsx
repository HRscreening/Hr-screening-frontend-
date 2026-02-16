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
import axios from "@/axiosConfig";
import type { CandidateCreate, CandidateUpdate } from "@/types/candidateHandlerSchema";
import { CandidateCreateSchema, CandidateUpdateSchema } from "@/types/candidateHandlerSchema";
import { ZodError } from "zod";
import { z } from "zod";
type EditNameEmailProps = {
  open: boolean;
  setOpen: (value: boolean) => void;
  applicationId: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  candidate_id: string | null;
};


const EditNameEmail = ({
  applicationId,
  name,
  email,
  phone,
  candidate_id,
  open,
  setOpen
}: EditNameEmailProps) => {
  const [nameInput, setNameInput] = useState(name || "");
  const [emailInput, setEmailInput] = useState(email || "");
  const [phoneInput, setPhoneInput] = useState(phone || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setOpen(false);
    setNameInput(name || "");
    setEmailInput(email || "");
    setPhoneInput(phone || "");
    setError(null);
  };

  async function handleSubmit() {
    setLoading(true);
    setError(null);

    try {
      if (!nameInput || !emailInput) {
        setError("Full name and email are required.");
        return;
      }

      if(nameInput.trim().toLocaleLowerCase() == "na")  {
        setError("Please enter a valid name.");
        return;
      }

      if (!candidate_id) {
        // CREATE

        const validated = CandidateCreateSchema.parse({
          full_name: nameInput,
          email: emailInput,
          phone: phoneInput || undefined,
        });

        await axios.post(
          `/application/attach-candidate/${applicationId}`,
          validated
        );

      } else {
        // UPDATE

        const validated = CandidateUpdateSchema.parse({
          full_name: nameInput || undefined,
          email: emailInput || undefined,
          phone: phoneInput || undefined,
        });

        await axios.patch(
          `/candidate/edit/${candidate_id}`,
          validated
        );
      }

      setOpen(false);

    } catch (err) {
      console.log(err);
      if (err instanceof ZodError) {
       setError("Invalid input")
       return;
      }
      setError("An error occurred while updating the information.");
    } finally {
      setLoading(false);
    }
  }


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* <DialogTrigger asChild>
        <Button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-hover-primary transition">
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </Button>
      </DialogTrigger> */}

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Edit Candidate Information
          </DialogTitle>
          <DialogDescription>
            Update the candidate’s name, email, and phone number.
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
            disabled={loading}
          >
            Cancel
          </Button>

          <Button
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditNameEmail;
