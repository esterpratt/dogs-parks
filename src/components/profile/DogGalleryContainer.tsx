import { useState, lazy, Suspense } from 'react';
import { FaPlus } from 'react-icons/fa';
import { Dog } from '../../types/dog';
import { fetchAllDogImages, uploadDogImage } from '../../services/dogs';
import { Accordion } from '../accordion/Accordion';
import { DogGallery } from './DogGallery';
import { useMutation, useQuery } from '@tanstack/react-query';
import { queryClient } from '../../services/react-query';
import { Loading } from '../Loading';

const CameraModal = lazy(() => import('../camera/CameraModal'));

interface DogGalleryContainerProps {
  dog: Dog;
  isSignedInUser: boolean;
  className?: string;
  contentClassName?: string;
}

const DogGalleryContainer: React.FC<DogGalleryContainerProps> = ({
  dog,
  isSignedInUser,
  className,
  contentClassName,
}) => {
  const [isAddImageModalOpen, setIsAddImageModalOpen] = useState(false);

  const { data: dogImages = [], isLoading } = useQuery({
    queryKey: ['dogImages', dog.id],
    queryFn: () => fetchAllDogImages(dog.id),
  });

  const { mutate } = useMutation({
    mutationFn: (img: string | File) => uploadDogImage(img, dog.id),
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

  if ((!isSignedInUser && !dogImages.length) || isLoading) {
    return null;
  }

  return (
    <>
      <Accordion className={className}>
        <Accordion.TitleWithIcon
          title="Gallery"
          showIcon={isSignedInUser}
          Icon={FaPlus}
          onClickIcon={onClickAddPhoto}
        />
        <Accordion.Content className={contentClassName}>
          <DogGallery
            images={dogImages}
            dog={dog}
            isSignedInUser={isSignedInUser}
            openCameraModal={openCameraModal}
          />
        </Accordion.Content>
      </Accordion>
      <Suspense fallback={<Loading />}>
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
