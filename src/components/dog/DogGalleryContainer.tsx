import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { Dog } from '../../types/dog';
import {
  deleteDogImage,
  DOG_IMAGE_QUERY_REFRESH_MS,
  fetchAllDogImages,
  uploadDogImage,
  setDogPrimaryImage,
} from '../../services/dogs';
import { DogGallery } from './DogGallery';
import { queryClient } from '../../services/react-query';
import { Section } from '../section/Section';
import { Button } from '../Button';
import styles from './DogGalleryContainer.module.scss';
import { CameraModal } from '../camera/CameraModal';
import { MAX_DOG_IMAGES } from '../../utils/consts';
import { useUploadImage } from '../../hooks/api/useUploadImage';

interface DogGalleryContainerProps {
  dog: Dog;
  isSignedInUser: boolean;
}

const DogGalleryContainer: React.FC<DogGalleryContainerProps> = ({
  dog,
  isSignedInUser,
}) => {
  const [isAddImageModalOpen, setIsAddImageModalOpen] = useState(false);
  const { t } = useTranslation();

  const { data: dogImages, isLoading } = useQuery({
    queryKey: ['dogImages', dog.id],
    queryFn: async () => fetchAllDogImages(dog.id),
    refetchInterval: DOG_IMAGE_QUERY_REFRESH_MS,
    staleTime: DOG_IMAGE_QUERY_REFRESH_MS,
  });

  const { mutate, isPending } = useUploadImage({
    mutationFn: (img: string | File) => uploadDogImage(img, dog.id),
    onSuccess: async () => {
      queryClient.invalidateQueries({
        queryKey: ['dogImages', dog.id],
      });
    },
  });

  const { mutate: removeImage } = useMutation({
    mutationFn: (imageId: string) => deleteDogImage(imageId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['dogImage', dog.id] }),
        queryClient.invalidateQueries({ queryKey: ['dogImages', dog.id] }),
      ]);
    },
  });

  const { mutate: setPrimaryImage } = useMutation({
    mutationFn: (imageId: string) => setDogPrimaryImage(imageId),
    onSuccess: async () => {
      queryClient.invalidateQueries({
        queryKey: ['dogImage', dog.id],
      });
      queryClient.invalidateQueries({
        queryKey: ['dogImages', dog.id],
      });
    },
  });

  const onUploadImg = async (img: string | File) => {
    setIsAddImageModalOpen(false);
    mutate(img);
  };

  const openCameraModal = () => {
    setIsAddImageModalOpen(true);
  };

  // The named header control stays reachable when the carousel's add slide
  // scrolls out of view, including for keyboard and screen-reader users.
  const onClickAddPhoto = () => {
    openCameraModal();
  };

  if ((!isSignedInUser && !dogImages?.length) || isLoading) {
    return null;
  }

  return (
    <>
      <Section
        contentClassName={styles.contentContainer}
        title={t('components.gallery.title')}
        actions={
          isSignedInUser && (dogImages ?? []).length < MAX_DOG_IMAGES ? (
            <Button
              aria-label={t('components.carousel.addPhoto')}
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
          <DogGallery
            isLoading={isPending}
            images={dogImages ?? []}
            isSignedInUser={isSignedInUser}
            openCameraModal={openCameraModal}
            removeImage={isSignedInUser ? removeImage : null}
            setPrimaryImage={isSignedInUser ? setPrimaryImage : null}
          />
        }
      />
      <CameraModal
        open={isAddImageModalOpen}
        setOpen={setIsAddImageModalOpen}
        onUploadImg={onUploadImg}
      />
    </>
  );
};

export { DogGalleryContainer };
