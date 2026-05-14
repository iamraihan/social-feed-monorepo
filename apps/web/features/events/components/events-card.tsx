import { AppImage } from '@/components/ui/app-image';
import Link from 'next/link';
import { mockEvents } from '../data/mock';

// _left_inner_area_event — list of upcoming events with date badge.

export function EventsCard() {
  return (
    <div className="_layout_left_sidebar_inner">
      <div className="_left_inner_area_event _padd_t24 _padd_b6 _padd_r24 _padd_l24 _b_radious6 _feed_inner_area">
        <div className="_left_inner_event_content">
          <h4 className="_left_inner_event_title _title5">Events</h4>
          <Link href="#0" className="_left_inner_event_link">
            See all
          </Link>
        </div>
        {mockEvents.map((event) => (
          <Link key={event.id} className="_left_inner_event_card_link" href="#0">
            <div className="_left_inner_event_card">
              <div className="_left_inner_event_card_iamge">
                <AppImage
                  src={event.imageKey}
                  alt={event.title}
                  width={260}
                  height={150}
                  className="_card_img"
                  unoptimized
                />
              </div>
              <div className="_left_inner_event_card_content">
                <div className="_left_inner_card_date">
                  <p className="_left_inner_card_date_para">{event.day}</p>
                  <p className="_left_inner_card_date_para1">{event.month}</p>
                </div>
                <div className="_left_inner_card_txt">
                  <h4 className="_left_inner_event_card_title">{event.title}</h4>
                </div>
              </div>
              <hr className="_underline" />
              <div className="_left_inner_event_bottom">
                <p className="_left_iner_event_bottom">{event.goingCount} People Going</p>
                <span className="_left_iner_event_bottom_link">Going</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
