import { useContext, useState, lazy, Suspense } from 'react';
import { Outlet, useNavigate, useParams } from 'react-router';
import { LuTrees } from 'react-icons/lu';
import { IoShareSocialSharp } from 'react-icons/io5';
import classnames from 'classnames';
import { useMutation, useQuery } from '@tanstack/react-query';
import { IconContext } from 'react-icons';
import { PiCameraFill } from 'react-icons/pi';
import { ReviewsPreview } from '../components/park/ReviewsPreview';
import { UserContext } from '../context/UserContext';
import { FavoriteButton } from '../components/park/FavoriteButton';
import styles from './Park.module.scss';
import { ParkTabs } from '../components/park/ParkTabs';
import {
  fetchPark,
  fetchParkPrimaryImage,
  uploadParkPrimaryImage,
} from '../services/parks';
import { queryClient } from '../services/react-query';
import { Loader } from '../components/Loading';
import { ParkCheckIn } from '../components/park/ParkCheckIn';
import { ParkIcon } from '../components/park/ParkIcon';
import { Button } from '../components/Button';

const CameraModal = lazy(() => import('../components/camera/CameraModal'));
const ThankYouModal = lazy(() => import('../components/ThankYouModal'));

const Park: React.FC = () => {
  const { id: parkId } = useParams();
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const [isAddImageModalOpen, setIsAddImageModalOpen] = useState(false);
  const [isThankYouModalOpen, setIsThankYouModalOpen] = useState(false);

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

  const onClickShareButton = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(location.href);
      setIsThankYouModalOpen(true);
    }
  };

  const onClickMapLink = () => {
    navigate('/', { state: { location: park!.location } });
  };

  if (isLoading || isLoadingImage) {
    return <Loader />;
  }

  if (!park) {
    return null;
  }

  return (
    <>
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
              <IconContext.Provider value={{ className: styles.editPhotoIcon }}>
                <PiCameraFill onClick={() => setIsAddImageModalOpen(true)} />
              </IconContext.Provider>
            )}
          </div>
          <div className={styles.userEngagementRight}>
            <ParkIcon
              iconCmp={<IoShareSocialSharp onClick={onClickShareButton} />}
              iconClassName={styles.shareIcon}
              textCmp={<span>Share</span>}
            />
            {user && (
              <>
                <FavoriteButton parkId={parkId!} userId={user.id} />
                <ParkCheckIn
                  parkId={parkId!}
                  userId={user.id}
                  userName={user.name}
                />
              </>
            )}
          </div>
        </div>
      </div>
      <div className={styles.contentContainer}>
        <div className={styles.basicDetails}>
          <span className={styles.name}>{park.name}</span>
          <div>
            <span className={styles.address}>
              {park.address}, {park.city}
            </span>
            <Button className={styles.mapLink} onClick={onClickMapLink}>
              See in Map
            </Button>
          </div>
          <ReviewsPreview />
        </div>
        <ParkTabs parkId={parkId!} className={styles.tabs} />
        <div className={styles.outletContainer}>
          <Outlet context={park} />
        </div>
      </div>
      <Suspense fallback={null}>
        <CameraModal
          open={isAddImageModalOpen}
          setOpen={setIsAddImageModalOpen}
          onUploadImg={onUploadImg}
        />
      </Suspense>
      <Suspense fallback={null}>
        <ThankYouModal
          open={isThankYouModalOpen}
          onClose={() => setIsThankYouModalOpen(false)}
          title="Park Copied to Clipboard"
        />
      </Suspense>
    </>
  );
};

export { Park };
