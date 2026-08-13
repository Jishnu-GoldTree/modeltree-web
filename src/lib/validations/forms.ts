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

/**
 * Login only checks that the field is non-empty, deliberately. Length or
 * complexity rules here would leak the password policy to anyone with the
 * login form, and would lock out accounts created before a policy change.
 * The signup schema is where the real rules belong.
 */
export const loginSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
  remember: z.boolean(),
})

export type LoginValues = z.infer<typeof loginSchema>

/**
 * Single source of truth for the password policy: the signup schema validates
 * against these, and the form renders the same list as a live checklist. Keep
 * them here so the two can't drift.
 */
export const PASSWORD_RULES = [
  {
    label: "At least 8 characters",
    message: "Use at least 8 characters",
    test: (value: string) => value.length >= 8,
  },
  {
    label: "One letter",
    message: "Include at least one letter",
    test: (value: string) => /[A-Za-z]/.test(value),
  },
  {
    label: "One number",
    message: "Include at least one number",
    test: (value: string) => /[0-9]/.test(value),
  },
] as const

export const ACCOUNT_TYPES = ["buyer", "designer"] as const

export const signupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Enter your name")
    .max(60, "Keep your name under 60 characters"),
  email: z.email("Enter a valid email address"),
  // Reports one failure at a time — listing every unmet rule at once reads as
  // a wall of red when someone has simply not finished typing.
  password: z.string().superRefine((value, ctx) => {
    const failed = PASSWORD_RULES.find((rule) => !rule.test(value))
    if (failed) ctx.addIssue({ code: "custom", message: failed.message })
  }),
  accountType: z.enum(ACCOUNT_TYPES),
  terms: z.boolean().refine((value) => value, "Accept the terms to continue"),
})

export type SignupValues = z.infer<typeof signupSchema>

/**
 * Profile edits.
 *
 * `handle` is a public URL segment (/designers/<handle>), so it is constrained
 * to a lowercase slug — the column is citext-unique, and letting mixed case or
 * spaces through would produce URLs that only work sometimes.
 */
export const profileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Enter your name")
    .max(60, "Keep your name under 60 characters"),
  handle: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Handles need at least 3 characters")
    .max(30, "Keep your handle under 30 characters")
    .regex(
      /^[a-z0-9][a-z0-9._-]*$/,
      "Use letters, numbers, dots, dashes and underscores; start with a letter or number",
    ),
  accountType: z.enum(ACCOUNT_TYPES),
  bio: z.string().trim().max(500, "Keep your bio under 500 characters").optional(),
  location: z.string().trim().max(80, "Keep the location under 80 characters").optional(),
});

export type ProfileValues = z.infer<typeof profileSchema>;
