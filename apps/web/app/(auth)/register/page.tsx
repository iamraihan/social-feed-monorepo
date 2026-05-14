import type { Metadata } from 'next';
import { AppImage } from '@/components/ui/app-image';
import { RegisterForm } from '@/features/auth';

export const metadata: Metadata = {
  title: 'Create an account',
};

export default function RegisterPage() {
  return (
    <section className="_social_registration_wrapper _layout_main_wrapper">
      <div className="_social_registration_wrap">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-xl-8 col-lg-8 col-md-12 col-sm-12">
              <div className="_social_registration_right">
                <div className="_social_registration_right_image">
                  <AppImage
                    src="/assets/images/registration.png"
                    alt=""
                    width={700}
                    height={500}
                    priority
                  />
                </div>
                <div className="_social_registration_right_image_dark">
                  <AppImage
                    src="/assets/images/registration1.png"
                    alt=""
                    width={700}
                    height={500}
                  />
                </div>
              </div>
            </div>
            <div className="col-xl-4 col-lg-4 col-md-12 col-sm-12">
              <RegisterForm />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
