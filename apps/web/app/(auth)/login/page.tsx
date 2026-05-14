import type { Metadata } from 'next';
import { AppImage } from '@/components/ui/app-image';
import { LoginForm } from '@/features/auth';

export const metadata: Metadata = {
  title: 'Sign in',
};

// Shape backgrounds live in (auth)/layout.tsx. This page just renders the
// col-8 illustration + col-4 form.

export default function LoginPage() {
  return (
    <section className="_social_login_wrapper _layout_main_wrapper">
      <div className="_social_login_wrap">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-xl-8 col-lg-8 col-md-12 col-sm-12">
              <div className="_social_login_left">
                <div className="_social_login_left_image">
                  <AppImage
                    src="/assets/images/login.png"
                    alt=""
                    width={700}
                    height={500}
                    className="_left_img"
                    priority
                  />
                </div>
              </div>
            </div>
            <div className="col-xl-4 col-lg-4 col-md-12 col-sm-12">
              <LoginForm />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
