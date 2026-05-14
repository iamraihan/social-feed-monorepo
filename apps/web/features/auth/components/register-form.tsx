'use client';

import Link from 'next/link';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AppImage } from '@/components/ui/app-image';
import { registerAction } from '../actions/register-action';
import { applyServerErrors } from '../lib/apply-server-errors';
import { registerSchema, type RegisterInput } from '../schemas/auth-schemas';

// Same RHF-native flow as LoginForm. firstName / lastName are added on top
// of the static design — the backend requires them.

const HALF = 'col-xl-6 col-lg-6 col-md-6 col-sm-12';
const FULL = 'col-xl-12 col-lg-12 col-md-12 col-sm-12';

// Declarative field config. Each entry yields one input block via the map
// below — `colClass` controls the grid width since name/lastName sit on
// one row and the rest are full-width.
const fields = [
  {
    name: 'firstName',
    label: 'First name',
    type: 'text',
    autoComplete: 'given-name',
    colClass: HALF,
  },
  {
    name: 'lastName',
    label: 'Last name',
    type: 'text',
    autoComplete: 'family-name',
    colClass: HALF,
  },
  {
    name: 'email',
    label: 'Email',
    type: 'email',
    autoComplete: 'email',
    colClass: FULL,
  },
  {
    name: 'password',
    label: 'Password',
    type: 'password',
    autoComplete: 'new-password',
    colClass: FULL,
  },
  {
    name: 'confirmPassword',
    label: 'Repeat Password',
    type: 'password',
    autoComplete: 'new-password',
    colClass: FULL,
  },
] as const satisfies ReadonlyArray<{
  name: keyof RegisterInput;
  label: string;
  type: 'text' | 'email' | 'password';
  autoComplete: string;
  colClass: string;
}>;

export function RegisterForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty, isValid },
    setError,
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    // See LoginForm for rationale — `onTouched` + isDirty + isValid gives
    // the cleanest submit-gating UX without nagging the user as they type.
    mode: 'onTouched',
  });

  const onSubmit: SubmitHandler<RegisterInput> = async (data) => {
    const result = await registerAction(data);
    if (result.ok) return;
    applyServerErrors(result, setError);
  };

  const serverError = errors.root?.serverError?.message;

  return (
    <div className="_social_registration_content">
      <div className="_social_registration_right_logo _mar_b28">
        <AppImage
          src="/assets/images/logo.svg"
          alt=""
          width={148}
          height={40}
          className="_right_logo"
        />
      </div>
      <p className="_social_registration_content_para _mar_b8">Get Started Now</p>
      <h4 className="_social_registration_content_title _titl4 _mar_b50">
        Registration
      </h4>
      <button type="button" className="_social_registration_content_btn _mar_b40">
        <AppImage
          src="/assets/images/google.svg"
          alt=""
          width={20}
          height={20}
          className="_google_img"
        />
        <span>Register with google</span>
      </button>
      <div className="_social_registration_content_bottom_txt _mar_b40">
        <span>Or</span>
      </div>

      <form
        className="_social_registration_form"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
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
              <div key={field.name} className={field.colClass}>
                <div className="_social_registration_form_input _mar_b14">
                  <label
                    className="_social_registration_label _mar_b8"
                    htmlFor={field.name}
                  >
                    {field.label}
                  </label>
                  <input
                    id={field.name}
                    type={field.type}
                    autoComplete={field.autoComplete}
                    className="form-control _social_registration_input"
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
          <div className="col-lg-12 col-xl-12 col-md-12 col-sm-12">
            <div className="form-check _social_registration_form_check">
              <input
                className="form-check-input _social_registration_form_check_input"
                type="checkbox"
                id="agreeTerms"
                defaultChecked
              />
              <label
                className="form-check-label _social_registration_form_check_label"
                htmlFor="agreeTerms"
              >
                I agree to terms &amp; conditions
              </label>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-lg-12 col-md-12 col-xl-12 col-sm-12">
            <div className="_social_registration_form_btn _mar_t40 _mar_b60">
              <button
                type="submit"
                className="_social_registration_form_btn_link _btn1"
                disabled={isSubmitting || !isDirty || !isValid}
              >
                {isSubmitting ? 'Creating account…' : 'Create account'}
              </button>
            </div>
          </div>
        </div>
      </form>

      <div className="row">
        <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
          <div className="_social_registration_bottom_txt">
            <p className="_social_registration_bottom_txt_para">
              Already have an account? <Link href="/login">Login</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
