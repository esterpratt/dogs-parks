import { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { fetchAllParkImages, uploadParkImage } from '../../services/parks';
import { queryClient } from '../../services/react-query';
import { UserContext } from '../../context/UserContext';
import { Section } from '../section/Section';
import { Button } from '../Button';
import { Carousel } from '../Carousel';
import { CameraModal } from '../camera/CameraModal';
import styles from './ParkGalleryContainer.module.scss';
import { MAX_IMAGES } from '../../utils/consts';
import { useUploadImage } from '../../hooks/api/useUploadImage';
import { useTranslation } from 'react-i18next';

interface ParkGalleryContainerProps {
  parkId: string;
}

const ParkGalleryContainer: React.FC<ParkGalleryContainerProps> = ({
  parkId,
}) => {
  const { t } = useTranslation();
  const [isAddImageModalOpen, setIsAddImageModalOpen] = useState(false);
  const { userId } = useContext(UserContext);

  const { data: parkImages, isLoading } = useQuery({
    queryKey: ['parkImages', parkId],
    queryFn: () => fetchAllParkImages(parkId),
  });

  const { mutate, isPending } = useUploadImage({
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
        title={t('components.gallery.title')}
        actions={
          userId && (parkImages || []).length < MAX_IMAGES ? (
            <Button
              variant="simple"
              color={styles.white}
              className={styles.button}
              onClick={onClickAddPhoto}
            >
              <Plus size={24} />
            </Button>
          ) : undefined
        }
        contentCmp={
          !!parkImages?.length || !!userId ? (
            <div className={styles.galleryContainer}>
              <Carousel
                isLoading={isPending}
                images={parkImages || []}
                addImage={
                  userId && (parkImages || []).length < MAX_IMAGES
                    ? () => setIsAddImageModalOpen(true)
                    : null
                }
              />
            </div>
          ) : (
            <div className={styles.noData}>
              <span>
                {t('components.carousel.noPhotosYet') ||
                  'No photos for this park yet.'}{' '}
              </span>
              <div>
                <Button variant="simple" className={styles.link}>
                  <Link to="/login?mode=login">
                    {t('components.carousel.login')}
                  </Link>
                </Button>
                <span>
                  {' '}
                  {t('components.carousel.toAddDataSuffix') || 'to add data.'}
                </span>
              </div>
            </div>
          )
        }
      />
      {!!userId && (
        <CameraModal
          open={isAddImageModalOpen}
          setOpen={setIsAddImageModalOpen}
          onUploadImg={onUploadImg}
        />
      )}
    </>
  );
};

export { ParkGalleryContainer };
