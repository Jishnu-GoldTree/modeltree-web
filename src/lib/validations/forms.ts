import { z } from "zod"

export const searchSchema = z.object({
  q: z
    .string()
    .trim()
    .min(2, "Enter at least 2 characters")
    .max(80, "Keep your search under 80 characters"),
})

export type SearchValues = z.infer<typeof searchSchema>

export const newsletterSchema = z.object({
  email: z.email("Enter a valid email address"),
})

export type NewsletterValues = z.infer<typeof newsletterSchema>
