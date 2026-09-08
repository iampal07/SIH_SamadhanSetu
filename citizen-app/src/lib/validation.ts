import { z } from "zod";

// Shared between the report form (client-side validation for fast feedback)
// and the POST /api/problems route (source of truth). Keep both in sync by
// importing from here rather than duplicating rules.
export const problemInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, "Title must be at least 5 characters.")
    .max(200, "Title must be under 200 characters."),
  description: z
    .string()
    .trim()
    .min(20, "Please describe the problem in at least 20 characters.")
    .max(5000, "Description must be under 5000 characters."),
  category: z.string().trim().max(100).optional().or(z.literal("")),
  district: z.string().trim().min(1, "District is required."),
  villageLocality: z.string().trim().min(1, "Village/Locality is required."),
  peopleAffected: z
    .union([z.number(), z.nan()])
    .optional()
    .refine((v) => v === undefined || Number.isNaN(v) || (Number.isInteger(v) && v > 0), {
      message: "People affected must be a positive whole number.",
    }),
  latitude: z
    .union([z.number(), z.nan()])
    .optional()
    .refine((v) => v === undefined || Number.isNaN(v) || (v >= -90 && v <= 90), {
      message: "Invalid latitude.",
    }),
  longitude: z
    .union([z.number(), z.nan()])
    .optional()
    .refine((v) => v === undefined || Number.isNaN(v) || (v >= -180 && v <= 180), {
      message: "Invalid longitude.",
    }),
});

export type ProblemInput = z.infer<typeof problemInputSchema>;

export const CATEGORIES = [
  "Water & Sanitation",
  "Health",
  "Education",
  "Roads & Infrastructure",
  "Electricity",
  "Agriculture",
  "Environment",
  "Other",
] as const;
