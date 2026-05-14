'use client';

import Link from 'next/link';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AppImage } from '@/components/ui/app-image';
import { loginAction } from '../actions/login-action';
import { applyServerErrors } from '../lib/apply-server-errors';
import { loginSchema, type LoginInput } from '../schemas/auth-schemas';

// RHF-native flow:
//   1. zodResolver runs the same Zod schema client-side (UX) — invalid input
//      never reaches the server.
//   2. handleSubmit gives us typed data; we await the server action with it.
//   3. On non-ok, applyServerErrors writes field + form-level errors into
//      RHF synchronously. No useEffect / state sync needed.
//   4. RHF tracks isSubmitting natively — no useActionState pending state.
//   5. On success the action calls `redirect('/')` — control never returns
//      to the client, so we don't need a success branch here.
//
// We deliberately use the typed-input action call (not <form action={…}>)
// because RHF needs synchronous error wiring. Progressive enhancement isn't
// a goal for auth pages (they require JS for client-side Zod feedback).

// Declarative field config — each entry yields one label + input + error
// block via the map below. Keeps the visible JSX flat: add/remove a field
// by editing this array, not by copy-pasting markup.
const fields = [
  { name: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
  {
    name: 'password',
    label: 'Password',
    type: 'password',
    autoComplete: 'current-password',
  },
] as const satisfies ReadonlyArray<{
  name: keyof LoginInput;
  label: string;
  type: 'text' | 'email' | 'password';
  autoComplete: string;
}>;

export function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty, isValid },
    setError,
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    // `onTouched` keeps the form quiet while the user is still typing, then
    // switches to live validation after the first blur. Combined with
    // `isValid` below, the submit button enables as soon as the form is
    // both dirty and passes Zod — no need to round-trip to the server to
    // discover client-side errors.
    mode: 'onTouched',
  });

  const onSubmit: SubmitHandler<LoginInput> = async (data) => {
    const result = await loginAction(data);
    if (result.ok) return; // unreachable — action redirected
    applyServerErrors(result, setError);
  };

  const serverError = errors.root?.serverError?.message;

  return (
    <div className="_social_login_content">
      <div className="_social_login_left_logo _mar_b28">
        <AppImage
          src="/assets/images/logo.svg"
          alt=""
          width={148}
          height={40}
          className="_left_logo"
        />
      </div>
      <p className="_social_login_content_para _mar_b8">Welcome back</p>
      <h4 className="_social_login_content_title _titl4 _mar_b50">
        Login to your account
      </h4>
      <button type="button" className="_social_login_content_btn _mar_b40">
        <AppImage
          src="/assets/images/google.svg"
          alt=""
          width={20}
          height={20}
          className="_google_img"
        />
        <span>Or sign-in with google</span>
      </button>
      <div className="_social_login_content_bottom_txt _mar_b40">
        <span>Or</span>
      </div>

      <form className="_social_login_form" onSubmit={handleSubmit(onSubmit)} noValidate>
        {serverError && (
          <div role="alert" className="form-server-error">
            {serverError}
          </div>
        )}

        <div className="row">
          {fields.map((field) => {
            const error = errors[field.name]?.message;
            const errorId = error ? `${field.name}-error` : undefined;
            return (
              <div
                key={field.name}
                className="col-xl-12 col-lg-12 col-md-12 col-sm-12"
              >
                <div className="_social_login_form_input _mar_b14">
                  <label className="_social_login_label _mar_b8" htmlFor={field.name}>
                    {field.label}
                  </label>
                  <input
                    id={field.name}
                    type={field.type}
                    autoComplete={field.autoComplete}
                    className="form-control _social_login_input"
                    aria-invalid={!!error}
                    aria-describedby={errorId}
                    {...register(field.name)}
                  />
                  {error && (
                    <p id={errorId} role="alert" className="form-field-error">
                      {error}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="row">
          <div className="col-lg-6 col-xl-6 col-md-6 col-sm-12">
            <div className="form-check _social_login_form_check">
              <input
                className="form-check-input _social_login_form_check_input"
                type="checkbox"
                id="rememberMe"
                defaultChecked
              />
              <label
                className="form-check-label _social_login_form_check_label"
                htmlFor="rememberMe"
              >
                Remember me
              </label>
            </div>
          </div>
          <div className="col-lg-6 col-xl-6 col-md-6 col-sm-12">
            <div className="_social_login_form_left">
              <p className="_social_login_form_left_para">Forgot password?</p>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-lg-12 col-md-12 col-xl-12 col-sm-12">
            <div className="_social_login_form_btn _mar_t40 _mar_b60">
              <button
                type="submit"
                className="_social_login_form_btn_link _btn1"
                disabled={isSubmitting || !isDirty || !isValid}
              >
                {isSubmitting ? 'Signing in…' : 'Login now'}
              </button>
            </div>
          </div>
        </div>
      </form>

      <div className="row">
        <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
          <div className="_social_login_bottom_txt">
            <p className="_social_login_bottom_txt_para">
              Don&apos;t have an account?{' '}
              <Link href="/register">Create New Account</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
