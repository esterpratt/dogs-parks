import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { MoveLeft, MapPin } from 'lucide-react';
import { Header } from '../Header';
import { HeaderImage } from '../HeaderImage';
import { EventImageOverlay } from './EventImageOverlay';
import styles from './EventHeader.module.scss';

interface EventHeaderProps {
  parkName: string;
  parkImage: string;
  title?: string | null;
  userId?: string;
}

const EventHeader: React.FC<EventHeaderProps> = (props: EventHeaderProps) => {
  const { userId, parkName, parkImage, title } = props;

  const { t } = useTranslation();

  return (
    <Header
      prevLinksCmp={
        <Link to={`/profile/${userId}/events`}>
          <MoveLeft size={16} />
          <span>{t('event.breadcrumb.events')}</span>
        </Link>
      }
      size="medium"
      imgCmp={
        <div className={styles.imageContainer}>
          <HeaderImage size={124} imgSrc={parkImage} />
          <EventImageOverlay size={40} />
        </div>
      }
      bottomCmp={
        <div className={styles.titleContainer}>
          <span className={styles.titleText}>
            {title ? title : `${t('event.location')}: `}
          </span>
          <div className={styles.parkName}>
            <MapPin className={styles.locationIcon} size={14} />
            <span>{parkName}</span>
          </div>
        </div>
      }
    />
  );
};

export { EventHeader };
