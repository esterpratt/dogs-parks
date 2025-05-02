import { useContext, useState, lazy, Suspense } from 'react';
import { Link, Outlet, useParams } from 'react-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  TreeDeciduous,
  MoveLeft,
  MapPin,
  Share as ShareIcon,
  MoveRight,
} from 'lucide-react';
import { Share } from '@capacitor/share';
import { ReviewsPreview } from '../components/park/ReviewsPreview';
import { UserContext } from '../context/UserContext';
import { FavoriteButton } from '../components/park/FavoriteButton';
import { ParkTabs } from '../components/park/ParkTabs';
import {
  fetchPark,
  fetchParkPrimaryImage,
  uploadParkPrimaryImage,
} from '../services/parks';
import { queryClient } from '../services/react-query';
import { Loader } from '../components/Loader';
import { ParkCheckIn } from '../components/park/ParkCheckIn';
import { ParkIcon } from '../components/park/ParkIcon';
import { useDelayedLoading } from '../hooks/useDelayedLoading';
import { isMobile } from '../utils/platform';
import { EnlargeImageModal } from '../components/EnlargeImageModal';
import { Header } from '../components/Header';
import { HeaderImage } from '../components/HeaderImage';
import styles from './Park.module.scss';
import { useNotification } from '../context/NotificationContext';

const CameraModal = lazy(() => import('../components/camera/CameraModal'));

const Park: React.FC = () => {
  const { id: parkId } = useParams();
  const { user } = useContext(UserContext);
  const [isAddImageModalOpen, setIsAddImageModalOpen] = useState(false);
  const [imageToEnlarge, setImageToEnlarge] = useState<string>('');
  const [isEnlargedImageModalOpen, setIsEnlargeImageModalOpen] =
    useState(false);
  const { notify } = useNotification();

  const { data: park, isLoading } = useQuery({
    queryKey: ['parks', parkId],
    queryFn: () => fetchPark(parkId!),
  });

  const { data: primaryImage, isLoading: isLoadingImage } = useQuery({
    queryKey: ['parkImage', parkId],
    queryFn: async () => {
      const image = await fetchParkPrimaryImage(parkId!);
      return image ? image : null;
    },
  });

  const { showLoader } = useDelayedLoading({
    isLoading: isLoading || isLoadingImage,
  });

  const { mutate } = useMutation({
    mutationFn: (img: string | File) => uploadParkPrimaryImage(img, parkId!),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['parkImage', parkId] });
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

  if (showLoader) {
    return <Loader />;
  }

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
          <div className={styles.basicDetails}>
            <div className={styles.top}>
              <div className={styles.name}>{park.name}</div>
              <ReviewsPreview className={styles.reviews} />
            </div>
            <div className={styles.addressContainer}>
              <MapPin size={14} />
              <div className={styles.address}>
                {park.address}, {park.city}
              </div>
            </div>
            <div className={styles.userEngagementRow}>
              {user && (
                <>
                  <FavoriteButton parkId={parkId!} userId={user.id} />
                  <ParkCheckIn
                    parkId={parkId!}
                    userId={user?.id ?? null}
                    userName={user?.name}
                  />
                </>
              )}
              <ParkIcon
                iconColor={styles.blue}
                IconCmp={ShareIcon}
                onClick={onClickShareButton}
                textCmp={<span>Share</span>}
              />
            </div>
          </div>
        }
      ></Header>
      <div className={styles.contentContainer}>
        <ParkTabs parkId={parkId!} />
        <div className={styles.outletContainer}>
          <Outlet context={park} />
        </div>
      </div>
      <EnlargeImageModal
        isOpen={isEnlargedImageModalOpen}
        onClose={() => setIsEnlargeImageModalOpen(false)}
        imgSrc={imageToEnlarge}
        setImgSrc={setImageToEnlarge}
      />
      <Suspense fallback={null}>
        <CameraModal
          open={isAddImageModalOpen}
          setOpen={setIsAddImageModalOpen}
          onUploadImg={onUploadImg}
        />
      </Suspense>
    </>
  );
};

export { Park };
