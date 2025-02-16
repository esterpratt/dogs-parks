import { useState, lazy, Suspense, useContext } from 'react';
import { FaPlus } from 'react-icons/fa';
import { useMutation, useQuery } from '@tanstack/react-query';
import { fetchAllParkImages, uploadParkImage } from '../../services/parks';
import { queryClient } from '../../services/react-query';
import { ParkGallery } from './ParkGallery';
import { AccordionContainer } from '../accordion/AccordionContainer';
import { UserContext } from '../../context/UserContext';
import { Link } from 'react-router';
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
      <AccordionContainer>
        <AccordionContainer.TitleWithIcon
          title="Gallery"
          showIcon={!!userId}
          Icon={FaPlus}
          onClickIcon={onClickAddPhoto}
          iconSize={14}
        />
        <AccordionContainer.Content>
          {userId ? (
            <ParkGallery
              images={parkImages ?? []}
              openCameraModal={() => setIsAddImageModalOpen(true)}
            />
          ) : (
            <div className={styles.noData}>
              <span>No photos for this park yet. </span>
              <span>
                <Link to="/signin"> Sign In</Link> to add data.
              </span>
            </div>
          )}
        </AccordionContainer.Content>
      </AccordionContainer>
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
