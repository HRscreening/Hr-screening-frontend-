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
import { DeleteDialog, FlagReasonDialog } from './helpersDialog';
import { useToggleStar } from '@/hooks/job_hooks/applications/useToggleStar';
import { useToggleFlag } from '@/hooks/job_hooks/applications/useToggleFlag';
import { useDeleteApplication } from '@/hooks/job_hooks/applications/useDeleteApplication';



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

    const { mutate: toggleStar } = useToggleStar();
    const { mutate: toggleFlag } = useToggleFlag();
    const { mutate: deleteApp } = useDeleteApplication();

    async function handleShare() {
        console.log("Share action triggered");
    }

    function handleFlag(reason?: string) {
        if (reason === flagReason) return;

        if (!data.is_flagged) {
            if (!reason || reason.trim() === "") return;
        }

        toggleFlag({ applicationId: data.applicationId, isFlagged: data.is_flagged, reason });
    }

    function handleStar() {
        toggleStar({ applicationId: data.applicationId, isStarred: data.is_starred });
    }

    function handleDelete() {
        deleteApp({ applicationId: data.applicationId });
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
                onConfirm={(reason) => handleFlag(reason)}
            />
        </>
    )
}
