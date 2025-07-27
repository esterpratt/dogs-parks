import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { Dog } from '../../types/dog';
import {
  deleteDogImage,
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
import { MAX_IMAGES } from '../../utils/consts';
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

  const { data: dogImages, isLoading } = useQuery({
    queryKey: ['dogImages', dog.id],
    queryFn: async () => fetchAllDogImages(dog.id),
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
    mutationFn: (imgPath: string) => deleteDogImage(imgPath),
    onSuccess: async () => {
      queryClient.invalidateQueries({
        queryKey: ['dogImages', dog.id],
      });
    },
  });

  const { mutate: setPrimaryImage } = useMutation({
    mutationFn: (imgPath: string) => setDogPrimaryImage(imgPath, dog.id),
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
        title="Gallery"
        actions={
          isSignedInUser && (dogImages ?? []).length < MAX_IMAGES ? (
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
          <DogGallery
            isLoading={isPending}
            images={dogImages ?? []}
            dog={dog}
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
