import { AppImage } from '@/components/ui/app-image';

// The three decorative shape blocks (light + dark SVG pairs) that float
// behind both auth pages. Extracted once so login.html / registration.html's
// duplicated markup doesn't live in two place. Pure server component —
// just SVG positioning.

export function AuthShapeBackgrounds() {
  return (
    <>
      <div className="_shape_one">
        <AppImage
          src="/assets/images/shape1.svg"
          alt=""
          width={120}
          height={120}
          className="_shape_img"
        />
        <AppImage
          src="/assets/images/dark_shape.svg"
          alt=""
          width={120}
          height={120}
          className="_dark_shape"
        />
      </div>
      <div className="_shape_two">
        <AppImage
          src="/assets/images/shape2.svg"
          alt=""
          width={120}
          height={120}
          className="_shape_img"
        />
        <AppImage
          src="/assets/images/dark_shape1.svg"
          alt=""
          width={120}
          height={120}
          className="_dark_shape _dark_shape_opacity"
        />
      </div>
      <div className="_shape_three">
        <AppImage
          src="/assets/images/shape3.svg"
          alt=""
          width={120}
          height={120}
          className="_shape_img"
        />
        <AppImage
          src="/assets/images/dark_shape2.svg"
          alt=""
          width={120}
          height={120}
          className="_dark_shape _dark_shape_opacity"
        />
      </div>
    </>
  );
}
