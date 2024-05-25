import { useContext, useState } from 'react';
import { Outlet, useParams } from 'react-router';
import { LuTrees } from 'react-icons/lu';
import classnames from 'classnames';
import { useMutation, useQuery } from '@tanstack/react-query';
import { queryClient } from '../services/react-query';
import { ParkCheckIn } from '../components/park/ParkCheckIn';
import { ReviewsPreview } from '../components/park/ReviewsPreview';
import { UserContext } from '../context/UserContext';
import { FavoriteButton } from '../components/park/FavoriteButton';
import styles from './Park.module.scss';
import { ParkTabs } from '../components/park/ParkTabs';
import { IconContext } from 'react-icons';
import { PiCameraFill } from 'react-icons/pi';
import { CameraModal } from '../components/camera/CameraModal';
import {
  fetchPark,
  fetchParkPrimaryImage,
  uploadParkPrimaryImage,
} from '../services/parks';
import { Loading } from '../components/Loading';

const Park: React.FC = () => {
  const { id: parkId } = useParams();
  const { user } = useContext(UserContext);

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

  const [isAddImageModalOpen, setIsAddImageModalOpen] = useState(false);

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

  if (isLoading || isLoadingImage) {
    return <Loading />;
  }

  if (!park) {
    return null;
  }

  return (
    <>
      {primaryImage ? (
        <img src={primaryImage} className={styles.image} />
      ) : (
        <div className={classnames(styles.image, styles.imageIcon)}>
          <IconContext.Provider value={{ className: styles.parkIcon }}>
            <LuTrees />
          </IconContext.Provider>
          {user && (
            <IconContext.Provider value={{ className: styles.editPhotoIcon }}>
              <PiCameraFill onClick={() => setIsAddImageModalOpen(true)} />
            </IconContext.Provider>
          )}
        </div>
      )}
      <div className={styles.contentContainer}>
        <div className={styles.basicDetails}>
          <div>
            <span className={styles.name}>{park.name}</span>
            <span className={styles.address}>{park.address}</span>
            <ReviewsPreview />
          </div>
          {user && (
            <div className={styles.userEngagement}>
              <div>
                <FavoriteButton parkId={parkId!} userId={user.id} />
                <ParkCheckIn
                  parkId={parkId!}
                  userId={user.id}
                  userName={user.name}
                />
              </div>
            </div>
          )}
        </div>
        <ParkTabs parkId={parkId!} />
        <div className={styles.outletContainer}>
          <Outlet context={park} />
        </div>
      </div>
      <CameraModal
        open={isAddImageModalOpen}
        setOpen={setIsAddImageModalOpen}
        onUploadImg={onUploadImg}
      />
    </>
  );
};

export { Park };
