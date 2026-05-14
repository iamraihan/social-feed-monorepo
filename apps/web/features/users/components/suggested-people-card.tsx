import Link from 'next/link';
import { Avatar } from '@/components/ui/avatar';
import { mockSuggestedPeople } from '../data/mock';

// _left_inner_area_suggest — three suggested people with Connect buttons.

export function SuggestedPeopleCard() {
  return (
    <div className="_layout_left_sidebar_inner">
      <div className="_left_inner_area_suggest _padd_t24 _padd_b6 _padd_r24 _padd_l24 _b_radious6 _feed_inner_area">
        <div className="_left_inner_area_suggest_content _mar_b24">
          <h4 className="_left_inner_area_suggest_content_title _title5">Suggested People</h4>
          <span className="_left_inner_area_suggest_content_txt">
            <Link className="_left_inner_area_suggest_content_txt_link" href="#0">
              See All
            </Link>
          </span>
        </div>

        {mockSuggestedPeople.map((person) => (
          <div key={person.id} className="_left_inner_area_suggest_info">
            <div className="_left_inner_area_suggest_info_box">
              <div className="_left_inner_area_suggest_info_image">
                <Link href="#0">
                  <Avatar
                    src={person.avatarKey}
                    alt={`${person.firstName} ${person.lastName}`}
                    name={`${person.firstName} ${person.lastName}`}
                    size={48}
                    className="_info_img"
                  />
                </Link>
              </div>
              <div className="_left_inner_area_suggest_info_txt">
                <Link href="#0">
                  <h4 className="_left_inner_area_suggest_info_title">
                    {person.firstName} {person.lastName}
                  </h4>
                </Link>
                <p className="_left_inner_area_suggest_info_para">{person.headline}</p>
              </div>
            </div>
            <div className="_left_inner_area_suggest_info_link">
              <Link href="#0" className="_info_link">
                Connect
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
