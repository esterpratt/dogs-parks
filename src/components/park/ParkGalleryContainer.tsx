import { useState, lazy, Suspense, useContext } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { fetchAllParkImages, uploadParkImage } from '../../services/parks';
import { queryClient } from '../../services/react-query';
import { UserContext } from '../../context/UserContext';
import { Section } from '../section/Section';
import { Button } from '../Button';
import { Carousel } from '../Carousel';
import styles from './ParkGalleryContainer.module.scss';

const CameraModal = lazy(() => import('../camera/CameraModal'));

interface ParkGalleryContainerProps {
  parkId: string;
}

const ParkGalleryContainer: React.FC<ParkGalleryContainerProps> = ({
  parkId,
}) => {
  const [isAddImageModalOpen, setIsAddImageModalOpen] = useState(false);
  const { userId } = useContext(UserContext);

  const { data: parkImages, isLoading } = useQuery({
    queryKey: ['parkImages', parkId],
    queryFn: () => fetchAllParkImages(parkId),
  });

  const { mutate } = useMutation({
    mutationFn: (img: string | File) => uploadParkImage(img, parkId),
    onSuccess: async () => {
      queryClient.invalidateQueries({
        queryKey: ['parkImages', parkId],
      });
    },
  });

  const onUploadImg = async (img: string | File) => {
    setIsAddImageModalOpen(false);
    mutate(img);
  };

  const onClickAddPhoto = () => {
    setIsAddImageModalOpen(true);
  };

  if (isLoading) {
    return null;
  }

  return (
    <>
      <Section
        contentClassName={styles.contentContainer}
        titleCmp={
          <div className={styles.title}>
            <span>Gallery</span>
            {!!userId && (
              <Button
                variant="simple"
                color={styles.white}
                className={styles.button}
                onClick={onClickAddPhoto}
              >
                <Plus size={24} />
              </Button>
            )}
          </div>
        }
        contentCmp={
          !!parkImages?.length || !!userId ? (
            <div className={styles.galleryContainer}>
              <Carousel
                images={parkImages || []}
                addImage={userId ? () => setIsAddImageModalOpen(true) : null}
              />
            </div>
          ) : (
            <div className={styles.noData}>
              <span>No photos for this park yet. </span>
              <div>
                <Button variant="simple" className={styles.link}>
                  <Link to="/login?mode=login">Log In</Link>
                </Button>
                <span> to add data.</span>
              </div>
            </div>
          )
        }
      />
      {!!userId && (
        <Suspense fallback={null}>
          <CameraModal
            open={isAddImageModalOpen}
            setOpen={setIsAddImageModalOpen}
            onUploadImg={onUploadImg}
          />
        </Suspense>
      )}
    </>
  );
};

export { ParkGalleryContainer };
