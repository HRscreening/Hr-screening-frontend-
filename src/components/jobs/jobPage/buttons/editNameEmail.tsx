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
  applicationId: _applicationId,
  name,
  email,
  phone,
  candidate_id: _candidate_id,
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
    //   await axios.put(`/applications/${applicationId}`, {
    //     name: nameInput,
    //     email: emailInput,
    //     phone: phoneInput,
    //     candidate_id,
    //   });

    setTimeout(() => {
      // Simulate successful update
      setLoading(false);
      setOpen(false);
    }
    , 1000);

      setOpen(false);
    } catch (err) {
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
