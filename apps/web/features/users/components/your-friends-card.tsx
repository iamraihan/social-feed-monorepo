import Link from 'next/link';
import { Avatar } from '@/components/ui/avatar';
import { mockFriends } from '../data/mock';

// _feed_right_inner_area_card — search + friend rows. Each row shows the
// online dot (green circle) or the "5 minute ago" last-seen text.

export function YourFriendsCard() {
  return (
    <div className="_layout_right_sidebar_inner">
      <div className="_feed_right_inner_area_card _padd_t24 _padd_b6 _padd_r24 _padd_l24 _b_radious6 _feed_inner_area">
        <div className="_feed_top_fixed">
          <div className="_feed_right_inner_area_card_content _mar_b24">
            <h4 className="_feed_right_inner_area_card_content_title _title5">Your Friends</h4>
            <span className="_feed_right_inner_area_card_content_txt">
              <Link className="_feed_right_inner_area_card_content_txt_link" href="#0">
                See All
              </Link>
            </span>
          </div>
          <form className="_feed_right_inner_area_card_form">
            <svg
              className="_feed_right_inner_area_card_form_svg"
              xmlns="http://www.w3.org/2000/svg"
              width="17"
              height="17"
              fill="none"
              viewBox="0 0 17 17"
            >
              <circle cx="7" cy="7" r="6" stroke="#666"></circle>
              <path stroke="#666" strokeLinecap="round" d="M16 16l-3-3"></path>
            </svg>
            <input
              className="form-control me-2 _feed_right_inner_area_card_form_inpt"
              type="search"
              placeholder="input search text"
              aria-label="Search"
            />
          </form>
        </div>

        <div className="_feed_bottom_fixed">
          {mockFriends.map((friend) => (
            <div
              key={friend.id}
              className={
                friend.online
                  ? '_feed_right_inner_area_card_ppl'
                  : '_feed_right_inner_area_card_ppl _feed_right_inner_area_card_ppl_inactive'
              }
            >
              <div className="_feed_right_inner_area_card_ppl_box">
                <div className="_feed_right_inner_area_card_ppl_image">
                  <Link href="#0">
                    <Avatar
                      src={friend.avatarKey}
                      alt={`${friend.firstName} ${friend.lastName}`}
                      name={`${friend.firstName} ${friend.lastName}`}
                      size={48}
                      className="_box_ppl_img"
                    />
                  </Link>
                </div>
                <div className="_feed_right_inner_area_card_ppl_txt">
                  <Link href="#0">
                    <h4 className="_feed_right_inner_area_card_ppl_title">
                      {friend.firstName} {friend.lastName}
                    </h4>
                  </Link>
                  <p className="_feed_right_inner_area_card_ppl_para">{friend.headline}</p>
                </div>
              </div>
              <div className="_feed_right_inner_area_card_ppl_side">
                {friend.online ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 14 14">
                    <rect
                      width="12"
                      height="12"
                      x="1"
                      y="1"
                      fill="#0ACF83"
                      stroke="#fff"
                      strokeWidth="2"
                      rx="6"
                    />
                  </svg>
                ) : (
                  <span>{friend.lastSeen}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
