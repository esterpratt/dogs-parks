import { useState, lazy, Suspense } from 'react';
import { FaPlus } from 'react-icons/fa';
import { useMutation, useQuery } from '@tanstack/react-query';
import { fetchAllParkImages, uploadParkImage } from '../../services/parks';
import { queryClient } from '../../services/react-query';
import { ParkGallery } from './ParkGallery';
import { Loading } from '../Loading';
import { AccordionContainer } from '../accordion/AccordionContainer';

const CameraModal = lazy(() => import('../camera/CameraModal'));

interface ParkGalleryContainerProps {
  parkId: string;
}

const ParkGalleryContainer: React.FC<ParkGalleryContainerProps> = ({
  parkId,
}) => {
  const [isAddImageModalOpen, setIsAddImageModalOpen] = useState(false);

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
      <AccordionContainer>
        <AccordionContainer.TitleWithIcon
          title="Gallery"
          showIcon
          Icon={FaPlus}
          onClickIcon={onClickAddPhoto}
          iconSize={14}
        />
        <AccordionContainer.Content>
          <ParkGallery
            images={parkImages ?? []}
            openCameraModal={() => setIsAddImageModalOpen(true)}
          />
        </AccordionContainer.Content>
      </AccordionContainer>
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

export { ParkGalleryContainer };
