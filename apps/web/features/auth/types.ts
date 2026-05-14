// Mirrors social-feed-api UserDto and AuthTokensDto exactly. createdAt /
// updatedAt come back as ISO strings over JSON (not Date) — typed as string
// here so callers don't accidentally call .toISOString() on a string.

type UserStatus = 'ACTIVE' | 'BLOCKED' | 'DELETED';

export interface SessionUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarKey: string | null;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  expiresIn: number;
  user: SessionUser;
}

export interface RefreshResponse {
  accessToken: string;
  expiresIn: number;
}

// Generic shape returned by every form-driven server action. Discriminated
// by `ok` so the form can branch cleanly. `fieldErrors` keys are the same
// strings the form uses with RHF's setError, which gives end-to-end type
// safety from Zod schema → action → form.

export type ActionResult<TField extends string = string> =
  | { ok: true }
  | {
      ok: false;
      fieldErrors?: Partial<Record<TField, string[] | undefined>>;
      formError?: string;
    };
