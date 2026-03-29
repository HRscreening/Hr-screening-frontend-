
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";


type NoRoundConfigDialogProps = {
    open: boolean;
    setOpen: (open: boolean) => void;
    roundNumber: number;
}

const NoRoundConfigDialog = ({
    open,setOpen,roundNumber
}:NoRoundConfigDialogProps) => {
 
    const navigate = useNavigate();
    const handleSetRoundConfig = () => {
        setOpen(false);
        navigate("settings/rounds");
    }
  return (
    <Dialog open={open} onOpenChange={setOpen}>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            No Round Configuration
          </DialogTitle>
          <DialogDescription>
            You have not set up any round configuration for round {roundNumber}. Please set up the round configuration to proceed.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>

          <Button
            onClick={handleSetRoundConfig}
          >
            Set Round Configuration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NoRoundConfigDialog;
