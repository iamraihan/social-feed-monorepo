// Client-safe public API of the `auth` feature.
//
// Server-only helpers (getSession, requireSession, getAccessToken) are
// deliberately NOT re-exported here — they live in `./lib/session` behind
// `'server-only'` and must be imported via the deep path so the marker
// stays effective and they never bleed into a client bundle.
//
// Only symbols actually imported from outside the feature appear here.
// Internal consumers (login-form, register-form, logout-action, etc.)
// import each other via relative paths.

export { LoginForm } from './components/login-form';
export { RegisterForm } from './components/register-form';
export { logoutAction } from './actions/logout-action';
export type { SessionUser } from './types';
