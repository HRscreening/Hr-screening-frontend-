import { z } from "zod";

export const CandidateCreateSchema = z.object({
  full_name: z.string().min(1, "Full name is required"),
  email: z.email("Invalid email address"),
  phone: z.string().optional().nullable(),
});

export const CandidateUpdateSchema = z
  .object({
    full_name: z.string().min(1).optional(),
    email: z.email().optional(),
    phone: z.string().optional(),
  })
  .refine(
    (data) => data.full_name || data.email || data.phone,
    {
      message: "At least one field must be provided",
    }
  );

export type CandidateCreate = z.infer<typeof CandidateCreateSchema>;
export type CandidateUpdate = z.infer<typeof CandidateUpdateSchema>;
