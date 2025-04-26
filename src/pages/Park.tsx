import { useContext, useState, lazy, Suspense, useRef } from 'react';
import { Link, Outlet, useNavigate, useParams } from 'react-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  TreeDeciduous,
  MoveLeft,
  MapPin,
  Share as ShareIcon,
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
import { Button } from '../components/Button';
import { useDelayedLoading } from '../hooks/useDelayedLoading';
import { isMobile } from '../utils/platform';
import { ThankYouModal } from '../components/ThankYouModal';
import { EnlargeImageModal } from '../components/EnlargeImageModal';
import { Header } from '../components/Header';
import { HeaderImage } from '../components/HeaderImage';
import styles from './Park.module.scss';

const CameraModal = lazy(() => import('../components/camera/CameraModal'));

const Park: React.FC = () => {
  const { id: parkId } = useParams();
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const [isAddImageModalOpen, setIsAddImageModalOpen] = useState(false);
  const [isThankYouModalOpen, setIsThankYouModalOpen] = useState(false);
  const [imageToEnlarge, setImageToEnlarge] = useState<string>('');
  const [isEnlargedImageModalOpen, setIsEnlargeImageModalOpen] =
    useState(false);
  const thankYouModalTitle = useRef('Park Copied to Clipboard');

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
      thankYouModalTitle.current = 'Thanks for sharing!';
      setIsThankYouModalOpen(true);
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(location.href);
      thankYouModalTitle.current = 'Park Copied to Clipboard';
      setIsThankYouModalOpen(true);
    }
  };

  const onClickMapLink = () => {
    navigate('/', { state: { location: park!.location } });
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
        size="large"
        containerClassName={styles.header}
        imgsClassName={styles.imgContainer}
        prevLinksCmp={
          <Link to="/parks">
            <MoveLeft size={16} />
            <span>All parks</span>
          </Link>
        }
        imgCmp={
          <HeaderImage
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
            <div className={styles.name}>{park.name}</div>
            <div className={styles.addressContainer}>
              <MapPin size={12} />
              <span className={styles.address}>
                {park.address}, {park.city}
              </span>
              <Button
                className={styles.button}
                onClick={onClickMapLink}
                variant="simple"
              >
                See in map
              </Button>
            </div>
            <ReviewsPreview />
          </div>
        }
      >
        <div className={styles.userEngagementRow}>
          <ParkIcon
            iconColor={styles.blue}
            IconCmp={ShareIcon}
            onClick={onClickShareButton}
            textCmp={<span>Share</span>}
          />
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
        </div>
      </Header>
      <div className={styles.contentContainer}>
        <ParkTabs parkId={parkId!} />
        <div className={styles.outletContainer}>
          <Outlet context={park} />
        </div>
      </div>
      <ThankYouModal
        open={isThankYouModalOpen}
        onClose={() => setIsThankYouModalOpen(false)}
        title={thankYouModalTitle.current}
      />
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
