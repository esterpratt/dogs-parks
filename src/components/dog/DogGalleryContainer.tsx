import { useState, lazy, Suspense } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { Dog } from '../../types/dog';
import {
  deleteDogImage,
  fetchAllDogImages,
  uploadDogImage,
} from '../../services/dogs';
import { DogGallery } from './DogGallery';
import { queryClient } from '../../services/react-query';
import { Section } from '../section/Section';
import { Button } from '../Button';
import styles from './DogGalleryContainer.module.scss';

const CameraModal = lazy(() => import('../camera/CameraModal'));

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

  const { mutate } = useMutation({
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
        titleCmp={
          <div className={styles.title}>
            <span>Gallery</span>
            {isSignedInUser && (dogImages ?? []).length < 8 && (
              <Button className={styles.button} onClick={onClickAddPhoto}>
                <Plus color={styles.white} size={24} />
              </Button>
            )}
          </div>
        }
        contentCmp={
          <DogGallery
            images={dogImages ?? []}
            dog={dog}
            isSignedInUser={isSignedInUser}
            openCameraModal={openCameraModal}
            removeImage={isSignedInUser ? removeImage : null}
          />
        }
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

export { DogGalleryContainer };
