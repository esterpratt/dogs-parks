import { useContext, useState } from 'react';
import {
  MapPin,
  MoveLeft,
  MoveRight,
  ShareIcon,
  TreeDeciduous,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Share } from '@capacitor/share';
import { useNotification } from '../../context/NotificationContext';
import { UserContext } from '../../context/UserContext';
import {
  fetchParkPrimaryImage,
  uploadParkPrimaryImage,
} from '../../services/parks';
import { queryClient } from '../../services/react-query';
import { isMobile } from '../../utils/platform';
import { Park } from '../../types/park';
import { useUploadImage } from '../../hooks/api/useUploadImage';
import { useFetchFriends } from '../../hooks/api/useFetchFriends';
import { Header } from '../Header';
import { HeaderImage } from '../HeaderImage';
import { PrevLinks } from '../PrevLinks';
import { CameraModal } from '../camera/CameraModal';
import { EnlargeImageModal } from '../EnlargeImageModal';
import { ReviewsPreview } from './ReviewsPreview';
import { FavoriteButton } from './FavoriteButton';
import { ParkCheckIn } from './ParkCheckIn';
import { ParkInvite } from './ParkInvite';
import { ParkIcon } from './ParkIcon';
import styles from './ParkHeader.module.scss';

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
  const { friends } = useFetchFriends({ userId: user?.id });

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
        imgsClassName={styles.imageWithButtons}
        prevLinksCmp={
          <PrevLinks
            links={[
              {
                to: '/parks',
                icon: <MoveLeft size={16} />,
                text: t('parks.breadcrumb.all'),
              },
              {
                to: '/',
                icon: <MoveRight size={16} />,
                text: t('parks.preview.seeOnMap'),
                state: { location: park!.location },
              },
            ]}
          />
        }
        imgCmp={
          <>
            <HeaderImage
              size={136}
              imgSrc={primaryImage}
              NoImgIcon={TreeDeciduous}
              onClickImg={onClickImage}
              onClickEditPhoto={
                !!user && !primaryImage
                  ? () => setIsAddImageModalOpen(true)
                  : null
              }
              className={styles.imgContainer}
            />
            {user ? (
              <div className={styles.buttonGrid}>
                <FavoriteButton parkId={park.id} userId={user.id} />
                <ParkCheckIn
                  parkId={park.id}
                  userId={user?.id ?? null}
                  userName={user?.name}
                />
                {!!friends?.length && (
                  <ParkInvite userId={user.id} parkId={park.id} />
                )}
                <ParkIcon
                  iconColor={styles.blue}
                  IconCmp={ShareIcon}
                  onClick={onClickShareButton}
                />
              </div>
            ) : (
              <div className={styles.shareOnly}>
                <ParkIcon
                  iconColor={styles.blue}
                  IconCmp={ShareIcon}
                  onClick={onClickShareButton}
                />
              </div>
            )}
          </>
        }
        bottomCmp={
          <div className={styles.basicDetails}>
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
              <ReviewsPreview className={styles.reviews} />
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
