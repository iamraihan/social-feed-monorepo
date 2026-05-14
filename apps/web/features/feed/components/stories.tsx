import { AppImage } from '@/components/ui/app-image';
import { mockCurrentUser } from '@/features/users/data/mock';
import { mockStories } from '../data/mock';

// _feed_inner_ppl_card — "Your Story" tile (with + button overlay) followed
// by friend story tiles with a mini avatar and name caption.

export function Stories() {
  return (
    <div className="_feed_inner_ppl_card _mar_b16">
      <div className="_feed_inner_story_arrow">
        <button type="button" className="_feed_inner_story_arrow_btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="9" height="8" fill="none" viewBox="0 0 9 8">
            <path
              fill="#fff"
              d="M8 4l.366-.341.318.341-.318.341L8 4zm-7 .5a.5.5 0 010-1v1zM5.566.659l2.8 3-.732.682-2.8-3L5.566.66zm2.8 3.682l-2.8 3-.732-.682 2.8-3 .732.682zM8 4.5H1v-1h7v1z"
            />
          </svg>
        </button>
      </div>
      <div className="row">
        <div className="col-xl-3 col-lg-3 col-md-4 col-sm-4 col">
          <div className="_feed_inner_profile_story _b_radious6">
            <div className="_feed_inner_profile_story_image">
              <AppImage
                src={mockCurrentUser.avatarKey ?? '/assets/images/card_ppl1.png'}
                alt="Your story"
                width={170}
                height={220}
                className="_profile_story_img"
                unoptimized
              />
              <div className="_feed_inner_story_txt">
                <div className="_feed_inner_story_btn">
                  <button type="button" className="_feed_inner_story_btn_link">
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="none" viewBox="0 0 10 10">
                      <path stroke="#fff" strokeLinecap="round" d="M.5 4.884h9M4.884 9.5v-9" />
                    </svg>
                  </button>
                </div>
                <p className="_feed_inner_story_para">Your Story</p>
              </div>
            </div>
          </div>
        </div>

        {mockStories.map((story, i) => (
          <div
            key={story.id}
            className={
              i >= 2
                ? 'col-xl-3 col-lg-3 col-md-4 col-sm-4 _custom_mobile_none'
                : 'col-xl-3 col-lg-3 col-md-4 col-sm-4 col'
            }
          >
            <div className="_feed_inner_public_story _b_radious6">
              <div className="_feed_inner_public_story_image">
                <AppImage
                  src={story.imageKey}
                  alt={story.name}
                  width={170}
                  height={220}
                  className="_public_story_img"
                  unoptimized
                />
                <div className="_feed_inner_pulic_story_txt">
                  <p className="_feed_inner_pulic_story_para">{story.name}</p>
                </div>
                <div className="_feed_inner_public_mini">
                  <AppImage
                    src={story.miniImageKey}
                    alt=""
                    width={32}
                    height={32}
                    className="_public_mini_img"
                    unoptimized
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
