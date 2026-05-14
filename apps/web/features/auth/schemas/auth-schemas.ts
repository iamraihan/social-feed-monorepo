import { z } from 'zod';

// Mirrors social-feed-api's LoginDto / CreateUserDto. Frontend validation is
// for UX only — the server re-validates with class-validator. Keeping the
// rules in sync prevents the user from hitting "valid here, invalid there"
// frustration.

export const loginSchema = z.object({
  email: z.email('Email must be a valid email address').max(254),
  // Login has no complexity rule — backend only enforces it on register.
  password: z.string().min(1, 'Password is required').max(72),
});

export type LoginInput = z.infer<typeof loginSchema>;

const passwordRules = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must not exceed 72 characters')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter')
  .regex(/[a-z]/, 'Password must contain a lowercase letter')
  .regex(/[0-9]/, 'Password must contain a digit')
  .regex(/[^A-Za-z0-9]/, 'Password must contain a symbol');

// Two schemas, one base:
//   baseRegisterSchema       — raw fields (with confirmPassword)
//   registerSchema           — base + cross-field refine; this is what the
//                              form validates against
//   backendRegisterSchema    — base minus confirmPassword; this is what the
//                              action sends to the backend. Deriving from
//                              the same base keeps the field-level rules in
//                              one place.
const baseRegisterSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, 'First name is required')
    .max(80, 'First name must not exceed 80 characters'),
  lastName: z
    .string()
    .trim()
    .min(1, 'Last name is required')
    .max(80, 'Last name must not exceed 80 characters'),
  email: z.email('Email must be a valid email address').max(254),
  password: passwordRules,
  confirmPassword: z.string(),
});

export const registerSchema = baseRegisterSchema.refine(
  (data) => data.password === data.confirmPassword,
  { message: 'Passwords do not match', path: ['confirmPassword'] },
);

export const backendRegisterSchema = baseRegisterSchema.omit({
  confirmPassword: true,
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type BackendRegisterPayload = z.infer<typeof backendRegisterSchema>;

// Runtime shape of the `session_user` cookie. Used by getSession() to refuse
// tampered or corrupted cookies (the cookie is intentionally non-httpOnly so
// it can be read from the client — that means we *cannot* trust its contents
// without re-validating on every read).

export const sessionUserSchema = z.object({
  id: z.string().min(1),
  firstName: z.string(),
  lastName: z.string(),
  email: z.email(),
  avatarKey: z.string().nullable(),
  status: z.enum(['ACTIVE', 'BLOCKED', 'DELETED']),
  createdAt: z.string(),
  updatedAt: z.string(),
});
