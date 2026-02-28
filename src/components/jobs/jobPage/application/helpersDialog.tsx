import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

type DeleteDialogProps = {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
};

export function DeleteDialog({ isOpen, onClose, onConfirm }: DeleteDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Trash className="text-destructive" />
                        Confirm Deletion
                    </DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete this application? This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" className="cursor-pointer" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button variant="destructive" className="text-white cursor-pointer" onClick={() => { onConfirm(); onClose(); }}>
                        Delete
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}



interface FlagReasonDialogProps {
    isOpen: boolean;
    flagReason: string;
    isFlagged: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => void;
}
export function FlagReasonDialog({
  isOpen,
  isFlagged,
  onClose,
  onConfirm,
  flagReason,
}: FlagReasonDialogProps) {

    const [reason,setReason] = useState<string>(flagReason || "");

  const handleConfirm = () => {
    onConfirm(reason)
    onClose()
  }

  const handleUnflag = () => {
    onConfirm("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isFlagged ? "Edit Flag Reason" : "Flag Application"}
          </DialogTitle>
          <DialogDescription>
            {isFlagged
              ? "Update the reason for flagging or remove the flag."
              : "Please provide a reason for flagging this application."}
          </DialogDescription>
        </DialogHeader>

        <Input
          placeholder="Enter reason for flagging"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="mb-4"
        />

        <DialogFooter className="flex justify-between sm:justify-between">
          
          {isFlagged && (
            <Button
              variant="outline"
              className="cursor-pointer text-red-600 border-red-600 hover:bg-red-50"
              onClick={handleUnflag}
            >
              Unflag
            </Button>
          )}

          <div className="flex gap-2 ml-auto">
            <Button
              variant="outline"
              className="cursor-pointer"
              onClick={onClose}
            >
              Cancel
            </Button>

            <Button
              variant="destructive"
              className="text-white cursor-pointer"
              onClick={handleConfirm}
              autoFocus={false}
              disabled={!reason.trim() || (reason === flagReason)}
            >
              {isFlagged ? "Update Flag" : "Flag"}
            </Button>
          </div>

        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
