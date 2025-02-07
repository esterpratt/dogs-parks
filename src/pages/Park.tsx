import { useContext, useState, lazy, Suspense, useRef } from 'react';
import { Outlet, useNavigate, useParams } from 'react-router';
import { LuTrees } from 'react-icons/lu';
import { IoShareSocialSharp } from 'react-icons/io5';
import classnames from 'classnames';
import { useMutation, useQuery } from '@tanstack/react-query';
import { IconContext } from 'react-icons';
import { PiCameraFill } from 'react-icons/pi';
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
import styles from './Park.module.scss';
import { ThankYouModal } from '../components/ThankYouModal';

const CameraModal = lazy(() => import('../components/camera/CameraModal'));

const Park: React.FC = () => {
  const { id: parkId } = useParams();
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const [isAddImageModalOpen, setIsAddImageModalOpen] = useState(false);
  const [isThankYouModalOpen, setIsThankYouModalOpen] = useState(false);
  const thankYouModalTitle = useRef('Park Copied to Clipboard');

  const { data: park, isLoading } = useQuery({
    queryKey: ['parks', parkId],
    queryFn: () => fetchPark(parkId!),
  });

  const { data: primaryImage, isLoading: isLoadingImage } = useQuery({
    queryKey: ['parkImage', parkId],
    queryFn: async () => {
      const images = await fetchParkPrimaryImage(parkId!);
      return images?.length ? images[0] : null;
    },
  });

  const showLoader = useDelayedLoading({
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

  if (showLoader) {
    return <Loader />;
  }

  if (!park) {
    return null;
  }

  return (
    <>
      <div className={styles.upperDetailsContainer}>
        <div className={styles.imageContainer}>
          {primaryImage ? (
            <img src={primaryImage} className={styles.image} />
          ) : (
            <div className={classnames(styles.image, styles.imageIcon)}>
              <IconContext.Provider value={{ className: styles.parkIcon }}>
                <LuTrees />
              </IconContext.Provider>
            </div>
          )}
          <div className={styles.userEngagementRow}>
            <div className={styles.userEngagementLeft}>
              {user && !primaryImage && (
                <IconContext.Provider
                  value={{ className: styles.editPhotoIcon }}
                >
                  <PiCameraFill onClick={() => setIsAddImageModalOpen(true)} />
                </IconContext.Provider>
              )}
            </div>
            <div className={styles.userEngagementRight}>
              {user && (
                <>
                  <FavoriteButton parkId={parkId!} userId={user.id} />
                </>
              )}
              <ParkIcon
                iconCmp={<IoShareSocialSharp onClick={onClickShareButton} />}
                iconClassName={styles.shareIcon}
                textCmp={<span>Share</span>}
              />
              <ParkCheckIn
                parkId={parkId!}
                userId={user?.id ?? null}
                userName={user?.name}
              />
            </div>
          </div>
        </div>
        <div className={styles.basicDetails}>
          <span className={styles.name}>{park.name}</span>
          <div>
            <span className={styles.address}>
              {park.address}, {park.city}
            </span>
            <Button className={styles.mapLink} onClick={onClickMapLink}>
              See in map
            </Button>
          </div>
          <ReviewsPreview />
        </div>
      </div>
      <div className={styles.contentContainer}>
        <ParkTabs parkId={parkId!} className={styles.tabs} />
        <Suspense fallback={<Loader />}>
          <div className={styles.outletContainer}>
            <Outlet context={park} />
          </div>
        </Suspense>
      </div>
      <Suspense fallback={null}>
        <CameraModal
          open={isAddImageModalOpen}
          setOpen={setIsAddImageModalOpen}
          onUploadImg={onUploadImg}
        />
      </Suspense>
      <ThankYouModal
        open={isThankYouModalOpen}
        onClose={() => setIsThankYouModalOpen(false)}
        title={thankYouModalTitle.current}
      />
    </>
  );
};

export { Park };
