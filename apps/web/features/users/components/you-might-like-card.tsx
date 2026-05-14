import Link from 'next/link';
import { Avatar } from '@/components/ui/avatar';
import { mockYouMightLike } from '../data/mock';

// _right_inner_area_info — recommended person with Ignore / Follow buttons.

export function YouMightLikeCard() {
  return (
    <div className="_layout_right_sidebar_inner">
      <div className="_right_inner_area_info _padd_t24 _padd_b24 _padd_r24 _padd_l24 _b_radious6 _feed_inner_area">
        <div className="_right_inner_area_info_content _mar_b24">
          <h4 className="_right_inner_area_info_content_title _title5">You Might Like</h4>
          <span className="_right_inner_area_info_content_txt">
            <Link className="_right_inner_area_info_content_txt_link" href="#0">
              See All
            </Link>
          </span>
        </div>
        <hr className="_underline" />
        {mockYouMightLike.map((person) => (
          <div key={person.id} className="_right_inner_area_info_ppl">
            <div className="_right_inner_area_info_box">
              <div className="_right_inner_area_info_box_image">
                <Link href="#0">
                  <Avatar
                    src={person.avatarKey}
                    alt={`${person.firstName} ${person.lastName}`}
                    name={`${person.firstName} ${person.lastName}`}
                    size={48}
                    className="_ppl_img"
                  />
                </Link>
              </div>
              <div className="_right_inner_area_info_box_txt">
                <Link href="#0">
                  <h4 className="_right_inner_area_info_box_title">
                    {person.firstName} {person.lastName}
                  </h4>
                </Link>
                <p className="_right_inner_area_info_box_para">{person.headline}</p>
              </div>
            </div>
            <div className="_right_info_btn_grp">
              <button type="button" className="_right_info_btn_link">
                Ignore
              </button>
              <button type="button" className="_right_info_btn_link _right_info_btn_link_active">
                Follow
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
