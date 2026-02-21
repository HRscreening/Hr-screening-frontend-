import { useState } from 'react';
import { EllipsisVertical } from "lucide-react"
import EditNameEmail from "@/components/jobs/jobPage/buttons/editNameEmail"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Edit,
    Share,
    Info,
    Trash,
    Star,
    FlagTriangleRight

} from "lucide-react"
import { Button } from '@/components/ui/button';
import axios from '@/axiosConfig';
import { toast } from 'sonner';
import { DeleteDialog, FlagReasonDialog } from './helpersDialog';



type MenuItemsProps = {
    applicationId: string;
    name: string | null;
    email: string | null;
    is_starred: boolean;
    is_flagged: boolean;
    candidate_id: string | null;
    phone: string | null;
    flag_reason?: string | null;
}
export default function MenuItems({ ...data }: MenuItemsProps) {

    const [editOpen, setEditOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
    const [isFlagDialogOpen, setIsFlagDialogOpen] = useState<boolean>(false);
    const flagReason = data.flag_reason || "";


    async function handleShare() {
        // Implement share functionality
        console.log("Share action triggered");
    }

    async function handleFlag(reason?: string) {
        try {

            if (reason === flagReason) {
                return;
            }

            if (data.is_flagged) {
                const res = await axios.patch(`/application/unflag/${data.applicationId}`);
                if (res.status === 200) {
                    toast.success("Application unflagged successfully");
                }
                else {
                    throw new Error("Failed to unflag application");
                }
            } else {


                if (!reason || reason.trim() === "") {
                    toast.error("Flag reason cannot be empty.");
                    return;
                }
                if (reason.length > 250) {
                    toast.error("Flag reason cannot exceed 250 characters.");
                    return;
                }
                if (reason.length < 10) {
                    toast.error("Flag reason should be at least 10 characters long.");
                    return;
                }

                const res = await axios.patch(`/application/flag/${data.applicationId}`, { "flag_reason": reason });

                if (res.status === 200) {
                    toast.success("Application flagged successfully");
                }
                else {
                    throw new Error("Failed to flag application");
                }
            }
        } catch (err) {
            console.log(err);
            toast.error("An error occurred while updating the flag status.");
        }
    }

    async function handleStar() {
        try {
            if (data.is_starred) {
                const res = await axios.patch(`/application/unstar/${data.applicationId}`);
                if (res.status === 200) {
                    toast.success("Application unstarred successfully");
                }
                else {
                    throw new Error("Failed to unstar application");
                }
            } else {


                const res = await axios.patch(`/application/star/${data.applicationId}`);
                if (res.status === 200) {
                    toast.success("Application starred successfully");
                }
                else {
                    throw new Error("Failed to star application");
                }

            }
        } catch (err) {
            console.log(err);
            toast.error("An error occurred while updating the star status.");
        }
    }

    async function handleDelete() {
        try {
            const res = await axios.delete(`/application/delete/${data.applicationId}`);

            if (res.status === 200) {
                toast.success("Application deleted successfully");
                return;
            }

        } catch (error) {
            console.error("Error deleting application:", error);
            toast.error("Failed to delete application. Please try again.");
        }


    }

    return (
        <>
            <DropdownMenu >
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-5 w-5 p-1 rounded-full">
                        <EllipsisVertical className="h-4 w-4 text-muted-foreground" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent >
                    <DropdownMenuItem
                        onSelect={(e) => {
                            e.preventDefault();
                            setEditOpen(true);
                        }}
                    >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleShare}>
                        <Share />
                        Share
                    </DropdownMenuItem>
                    {
                        data.is_starred ? (
                            <DropdownMenuItem onClick={handleStar}>
                                <Star color='yellow' fill='yellow' />
                                Unstar
                            </DropdownMenuItem>
                        ) : (
                            <DropdownMenuItem onClick={handleStar}>
                                <Star />
                                Star
                            </DropdownMenuItem>
                        )
                    }
                    {
                        data.is_flagged ? (
                            <DropdownMenuItem onClick={() => setIsFlagDialogOpen(true)}>
                                <FlagTriangleRight color='orange' fill='orange' />
                                Unflag
                            </DropdownMenuItem>
                        ) : (
                            <DropdownMenuItem onClick={() => setIsFlagDialogOpen(true)}>
                                <FlagTriangleRight />
                                Flag
                            </DropdownMenuItem>
                        )


                    }
                    <DropdownMenuItem >
                        <Info />
                        Info
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setDeleteDialogOpen(true)}>
                        <Trash color='red' />
                        <span className='text-destructive'>Delete</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <EditNameEmail
                open={editOpen}
                setOpen={setEditOpen}
                applicationId={data.applicationId}
                candidate_id={data.candidate_id}
                email={data.email}
                name={data.name}
                phone={data.phone}
            />

            <DeleteDialog
                isOpen={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                onConfirm={handleDelete}
            />

            <FlagReasonDialog
                isOpen={isFlagDialogOpen}
                onClose={() => setIsFlagDialogOpen(false)}
                flagReason={flagReason}
                isFlagged={data.is_flagged}
                onConfirm={(reason) => {
                    handleFlag(reason);
                }
                }
            />
        </>
    )
}

