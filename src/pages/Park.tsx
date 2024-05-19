import { useContext, useState } from 'react';
import { Outlet, useLoaderData, useParams } from 'react-router';
import { LuTrees } from 'react-icons/lu';
import { Park as ParkType } from '../types/park';
import { ParkCheckIn } from '../components/park/ParkCheckIn';
import { ReviewsPreview } from '../components/park/ReviewsPreview';
import { ParkVisitorsContextProvider } from '../context/ParkVisitorsContext';
import { UserContext } from '../context/UserContext';
import { FavoriteButton } from '../components/park/FavoriteButton';
import styles from './Park.module.scss';
import { ParkTabs } from '../components/park/ParkTabs';
import { ParkReviewsContextProvider } from '../context/ParkReviewsContext';
import { IconContext } from 'react-icons';
import { PiCameraFill } from 'react-icons/pi';
import { CameraModal } from '../components/camera/CameraModal';
import { uploadParkPrimaryImage } from '../services/parks';
import { ParksContext } from '../context/ParksContext';

interface ParkData {
  park: ParkType;
  image: string;
}

const Park: React.FC = () => {
  const { id: parkId } = useParams();
  const { image } = useLoaderData() as ParkData;
  const { parks } = useContext(ParksContext);
  const { user } = useContext(UserContext);
  const [primaryImage, setPrimaryImage] = useState(image);
  const [isAddImageModalOpen, setIsAddImageModalOpen] = useState(false);

  const park = parks.find((park) => park.id === parkId);

  const onUploadImg = async (img: string | File) => {
    setIsAddImageModalOpen(false);
    const uploadedImg = await uploadParkPrimaryImage(img, parkId!);
    if (uploadedImg) {
      setPrimaryImage(uploadedImg);
    }
  };

  if (!park) {
    return null;
  }

  return (
    <ParkVisitorsContextProvider parkId={parkId!}>
      <ParkReviewsContextProvider parkId={parkId!}>
        {primaryImage ? (
          <img src={primaryImage} className={styles.image} />
        ) : (
          <div className={styles.imageIcon}>
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
              <span className={styles.name}>{park!.name}</span>
              <span className={styles.address}>{park!.address}</span>
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
          <ParkTabs />
          <div className={styles.outletContainer}>
            <Outlet context={park} />
          </div>
        </div>
        <CameraModal
          open={isAddImageModalOpen}
          setOpen={setIsAddImageModalOpen}
          onUploadImg={onUploadImg}
        />
      </ParkReviewsContextProvider>
    </ParkVisitorsContextProvider>
  );
};

export { Park };
