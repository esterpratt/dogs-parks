import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { MoveLeft, TreeDeciduous } from 'lucide-react';
import { Header } from '../Header';
import { HeaderImage } from '../HeaderImage';
// import styles from './EventHeader.module.scss';

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
      imgCmp={
        <HeaderImage size={132} imgSrc={parkImage} NoImgIcon={TreeDeciduous} />
      }
      bottomCmp={
        <div>
          <span>
            {title ? title : t('event.location') + ': '}
            {parkName}
          </span>
        </div>
      }
    />
  );
};

export { EventHeader };
