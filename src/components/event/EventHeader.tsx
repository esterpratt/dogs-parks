import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { MoveLeft, TreeDeciduous } from 'lucide-react';
import { useDateUtils } from '../../hooks/useDateUtils';
import { Header } from '../Header';
import { HeaderImage } from '../HeaderImage';
// import styles from './EventHeader.module.scss';

interface EventHeaderProps {
  parkName: string;
  parkImage: string;
  startAt: string;
  userId?: string;
}

const EventHeader: React.FC<EventHeaderProps> = (props: EventHeaderProps) => {
  const { startAt, userId, parkName, parkImage } = props;

  const { t } = useTranslation();
  const { formatFutureCalendar } = useDateUtils();
  const startTime = formatFutureCalendar(startAt);

  return (
    <Header
      prevLinksCmp={
        <Link to={`/profile/${userId}/events`}>
          <MoveLeft size={16} />
          <span>{t('event.breadcrumb.events')}</span>
        </Link>
      }
      imgCmp={
        <HeaderImage size={132} imgSrc={parkImage} NoImgIcon={TreeDeciduous} />
      }
      bottomCmp={
        <div>
          <span>
            {t('event.header.location')}: {parkName}
          </span>
          <span>
            {t('event.header.when')}: {startTime}
          </span>
        </div>
      }
    />
  );
};

export { EventHeader };
