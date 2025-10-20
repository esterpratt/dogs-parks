import { Link } from 'react-router-dom';
import { useContext, useState } from 'react';
import {
  MapPin,
  MoveLeft,
  MoveRight,
  ShareIcon,
  TreeDeciduous,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import classnames from 'classnames';
import { Header } from '../Header';
import { HeaderImage } from '../HeaderImage';
import { ReviewsPreview } from './ReviewsPreview';
import { FavoriteButton } from './FavoriteButton';
import { ParkCheckIn } from './ParkCheckIn';
import { ParkIcon } from './ParkIcon';
import { CameraModal } from '../camera/CameraModal';
import { EnlargeImageModal } from '../EnlargeImageModal';
import { useNotification } from '../../context/NotificationContext';
import { UserContext } from '../../context/UserContext';
import {
  fetchParkPrimaryImage,
  uploadParkPrimaryImage,
} from '../../services/parks';
import { queryClient } from '../../services/react-query';
import { isMobile } from '../../utils/platform';
import { Share } from '@capacitor/share';
import { Park } from '../../types/park';
import styles from './ParkHeader.module.scss';
import { useUploadImage } from '../../hooks/api/useUploadImage';
import { useTranslation } from 'react-i18next';
import { ParkInvite } from './ParkInvite';

interface ParkHeaderProps {
  park: Park;
}

const ParkHeader = (props: ParkHeaderProps) => {
  const { park } = props;
  const { t } = useTranslation();
  const { user } = useContext(UserContext);
  const [isAddImageModalOpen, setIsAddImageModalOpen] = useState(false);
  const [imageToEnlarge, setImageToEnlarge] = useState<string>('');
  const [isEnlargedImageModalOpen, setIsEnlargeImageModalOpen] =
    useState(false);
  const { notify } = useNotification();

  const { data: primaryImage } = useQuery({
    queryKey: ['parkImage', park.id],
    queryFn: async () => fetchParkPrimaryImage(park.id),
  });

  const { mutate } = useUploadImage({
    mutationFn: (img: string | File) => uploadParkPrimaryImage(img, park.id),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['parkImage', park.id] });
    },
  });

  const onUploadImg = async (img: string | File) => {
    setIsAddImageModalOpen(false);
    mutate(img);
  };

  const onClickShareButton = async () => {
    if (isMobile()) {
      await Share.share({
        title: t('parks.share.title'),
        text: t('parks.share.text', { name: park.name }),
        url: `https://klavhub.com/share/parks/${park.id}`,
        dialogTitle: t('parks.share.dialogTitle'),
      });
      notify(t('toasts.share.thanks'));
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(location.href);
      notify(t('toasts.share.copied'));
    }
  };

  const onClickImage = (img: string) => {
    setImageToEnlarge(img);
    setIsEnlargeImageModalOpen(true);
  };

  if (!park) {
    return null;
  }

  return (
    <>
      <Header
        containerClassName={styles.header}
        imgsClassName={styles.imgContainer}
        prevLinksCmp={
          <>
            <Link to="/parks">
              <MoveLeft size={16} />
              <span>{t('parks.breadcrumb.all')}</span>
            </Link>
            <Link to="/" state={{ location: park!.location }}>
              <span>{t('parks.preview.seeOnMap')}</span>
              <MoveRight size={16} />
            </Link>
          </>
        }
        imgCmp={
          <HeaderImage
            size={132}
            imgSrc={primaryImage}
            NoImgIcon={TreeDeciduous}
            onClickImg={onClickImage}
            onClickEditPhoto={
              !!user && !primaryImage
                ? () => setIsAddImageModalOpen(true)
                : null
            }
          />
        }
        bottomCmp={
          <div
            className={classnames(styles.basicDetails, {
              [styles.user]: !!user,
            })}
          >
            <div className={styles.top} data-test="park-name">
              {park.name}
            </div>
            <div className={styles.bottom}>
              <div className={styles.address}>
                <MapPin color={styles.green} size={14} />
                <div className={styles.text}>
                  {park.address}, {park.city}
                </div>
              </div>
              {user && <ReviewsPreview className={styles.reviews} />}
            </div>
            <div
              className={classnames(styles.userEngagementRow, {
                [styles.user]: !!user,
              })}
            >
              {user && (
                <>
                  <FavoriteButton parkId={park.id} userId={user.id} />
                  <ParkCheckIn
                    parkId={park.id}
                    userId={user?.id ?? null}
                    userName={user?.name}
                  />
                  <ParkInvite userId={user.id} parkId={park.id} />
                </>
              )}
              {!user && <ReviewsPreview className={styles.reviews} />}
              <ParkIcon
                iconColor={styles.blue}
                IconCmp={ShareIcon}
                onClick={onClickShareButton}
                textCmp={<span>{t('common.actions.share')}</span>}
                className={classnames(styles.share, {
                  [styles.alignRight]: !user,
                })}
              />
            </div>
          </div>
        }
      />
      <EnlargeImageModal
        isOpen={isEnlargedImageModalOpen}
        onClose={() => setIsEnlargeImageModalOpen(false)}
        imgSrc={imageToEnlarge}
        setImgSrc={setImageToEnlarge}
      />
      <CameraModal
        open={isAddImageModalOpen}
        setOpen={setIsAddImageModalOpen}
        onUploadImg={onUploadImg}
      />
    </>
  );
};

export { ParkHeader };
