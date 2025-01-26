import { useState, lazy, Suspense } from 'react';
import { FaPlus } from 'react-icons/fa';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Dog } from '../../types/dog';
import { fetchAllDogImages, uploadDogImage } from '../../services/dogs';
import { AccordionContainer } from '../accordion/AccordionContainer';
import { DogGallery } from './DogGallery';
import { queryClient } from '../../services/react-query';
import { deleteImage } from '../../services/image';

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

  const { data: dogImages, isLoading } = useQuery({
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

  const { mutate: removeImage } = useMutation({
    mutationFn: (imgPath: string) => {
      return deleteImage(imgPath);
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ['dogImages', dog.id],
      });
    },
  });

  const onUploadImg = async (img: string | File) => {
    setIsAddImageModalOpen(false);
    console.log('onUploadImg');
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
      <AccordionContainer className={className}>
        <AccordionContainer.TitleWithIcon
          title="Gallery"
          showIcon={isSignedInUser}
          Icon={FaPlus}
          onClickIcon={onClickAddPhoto}
        />
        <AccordionContainer.Content className={contentClassName}>
          <DogGallery
            images={dogImages ?? []}
            dog={dog}
            isSignedInUser={isSignedInUser}
            openCameraModal={openCameraModal}
            removeImage={isSignedInUser ? removeImage : null}
          />
        </AccordionContainer.Content>
      </AccordionContainer>
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
