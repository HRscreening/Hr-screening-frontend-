import type {  ApplicationStatus } from '@/types/jobTypes';


export const mapStatusToLabel = (status: ApplicationStatus): string => {
    switch (status) {
        case 'applied':
            return 'Applied';
        case 'in_review':
            return 'In Review';
        case 'shortlisted':
            return 'Shortlisted';
        case 'rejected':
            return 'Rejected';
        case 'hired':
            return 'Hired';
        default:
            return 'Unknown';
    }
};