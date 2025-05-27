import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { useRef, useState } from 'react';
import Slider from 'react-slick';
import { Plus, Trash2, X } from 'lucide-react';
import { Button } from './Button';
import { EnlargeImageModal } from './EnlargeImageModal';
import { TopModal } from './modals/TopModal';
import styles from './Carousel.module.scss';
import { Image } from './Image';
import { usePreventVerticalScrollOnHorizontalSwipe } from '../hooks/usePreventVerticalScrollOnHorizontalSwipe';

interface CarouselProps {
  images: string[];
  addImage?: (() => void) | null;
  removeImage?: ((imgPath: string) => void) | null;
  setPrimaryImage?: ((imgPath: string) => void) | null;
}

const Carousel: React.FC<CarouselProps> = ({
  images = [],
  addImage,
  removeImage,
  setPrimaryImage,
}) => {
  const [imageToEnlarge, setImageToEnlarge] = useState<string>('');
  const [isApproveDeleteModalOpen, setIsApproveDeleteModalOpen] =
    useState(false);
  const [isEnlargedImageModalOpen, setIsEnlargeImageModalOpen] =
    useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  usePreventVerticalScrollOnHorizontalSwipe(containerRef);

  const onDeleteImage = () => {
    if (removeImage) {
      removeImage(imageToEnlarge);
    }
    setIsApproveDeleteModalOpen(false);
    setIsEnlargeImageModalOpen(false);
  };

  const settings = {
    className: 'center',
    infinite: false,
    slidesToShow: 2,
    slidesToScroll: 1,
    swipeToSlide: true,
  };

  const onClickImage = (img: string) => {
    setImageToEnlarge(img);
    setIsEnlargeImageModalOpen(true);
  };

  const handleSetPrimaryImage = () => {
    if (setPrimaryImage) {
      setPrimaryImage(imageToEnlarge);
    }
    setIsEnlargeImageModalOpen(false);
  };

  return (
    <>
      <div ref={containerRef} className="slider-container">
        <Slider {...settings} className={styles.container}>
          {images.map((img) => (
            <Image
              className={styles.image}
              src={img}
              key={img}
              onClick={() => onClickImage(img)}
            />
          ))}
          {addImage && (
            <div className={styles.buttonContainer}>
              <Button
                variant="secondary"
                onClick={addImage}
                className={styles.addImage}
              >
                <Plus size={48} className={styles.plus} />
                <span>Add photo</span>
              </Button>
            </div>
          )}
        </Slider>
      </div>
      <TopModal
        open={isApproveDeleteModalOpen}
        onClose={() => setIsApproveDeleteModalOpen(false)}
        className={styles.approveModal}
      >
        <div className={styles.approveContent}>
          <span>Hold your leash!</span>
          <span>
            Are you sure you want to send this pic to a farm up north where it
            can run free forever?
          </span>
        </div>
        <div className={styles.buttonsContainer}>
          <Button
            variant="primary"
            onClick={onDeleteImage}
            className={styles.button}
          >
            <Trash2 size={16} />
            <span>Delete</span>
          </Button>
          <Button
            variant="secondary"
            onClick={() => setIsApproveDeleteModalOpen(false)}
            className={styles.button}
          >
            <X size={16} />
            <span>Cancel</span>
          </Button>
        </div>
      </TopModal>
      <EnlargeImageModal
        isOpen={isEnlargedImageModalOpen}
        onClose={() => setIsEnlargeImageModalOpen(false)}
        imgSrc={imageToEnlarge}
        setImgSrc={setImageToEnlarge}
        onClickDeleteImage={
          removeImage && (() => setIsApproveDeleteModalOpen(true))
        }
        onSetPrimaryImage={setPrimaryImage ? handleSetPrimaryImage : null}
      />
    </>
  );
};

export { Carousel };
