import { Link } from 'react-router-dom';
import { useContext, useState } from 'react';
import {
  MapPin,
  MoveLeft,
  MoveRight,
  ShareIcon,
  TreeDeciduous,
} from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
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
import { LOADING } from '../../utils/consts';

interface ParkHeaderProps {
  park: Park;
}

const ParkHeader = (props: ParkHeaderProps) => {
  const { park } = props;
  const { user } = useContext(UserContext);
  const [isAddImageModalOpen, setIsAddImageModalOpen] = useState(false);
  const [imageToEnlarge, setImageToEnlarge] = useState<string>('');
  const [isEnlargedImageModalOpen, setIsEnlargeImageModalOpen] =
    useState(false);
  const { notify } = useNotification();

  const { data: primaryImage, isLoading } = useQuery({
    queryKey: ['parkImage', park.id],
    queryFn: async () => fetchParkPrimaryImage(park.id),
  });

  const { mutate } = useMutation({
    mutationFn: (img: string | File) => uploadParkPrimaryImage(img, park.id),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['dogImage', park.id] });
      const prevImage = queryClient.getQueryData(['parkImage', park.id]);
      queryClient.setQueryData(['parkImage', park.id], LOADING);

      return { prevImage };
    },
    onError: (_error, _data, context) => {
      queryClient.setQueryData(['parkImage', park.id], context?.prevImage);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['parkImage', park.id] });
    },
  });

  const onUploadImg = async (img: string | File) => {
    setIsAddImageModalOpen(false);
    mutate(img);
  };

  const onClickShareButton = async () => {
    if (isMobile) {
      await Share.share({
        title: 'Check this park out!',
        text: 'Hey, check out this park:',
        url: location.href,
        dialogTitle: 'Share this park with friends',
      });
      notify('Thanks for sharing!');
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(location.href);
      notify('Park Copied to Clipboard');
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
              <span>All parks</span>
            </Link>
            <Link to="/" state={{ location: park!.location }}>
              <span>See in map</span>
              <MoveRight size={16} />
            </Link>
          </>
        }
        imgCmp={
          <HeaderImage
            size={132}
            isLoading={isLoading}
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
            <div className={styles.top}>{park.name}</div>
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
                </>
              )}
              {!user && <ReviewsPreview className={styles.reviews} />}
              <ParkIcon
                iconColor={styles.blue}
                IconCmp={ShareIcon}
                onClick={onClickShareButton}
                textCmp={<span>Share</span>}
                className={classnames(styles.share, {
                  [styles.alignRight]: !user,
                })}
              />
            </div>
          </div>
        }
      ></Header>
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
