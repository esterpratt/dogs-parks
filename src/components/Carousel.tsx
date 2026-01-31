import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Slider from 'react-slick';
import { Plus, Trash2, X } from 'lucide-react';
import classnames from 'classnames';
import { usePreventVerticalScrollOnHorizontalSwipe } from '../hooks/usePreventVerticalScrollOnHorizontalSwipe';
import { Button } from './Button';
import { EnlargeImageModal } from './EnlargeImageModal';
import { TopModal } from './modals/TopModal';
import { Image } from './Image';
import { Loader } from './Loader';
import styles from './Carousel.module.scss';

interface CarouselImage {
  id: string;
  src: string;
}

interface CarouselProps {
  images: CarouselImage[];
  addImage?: (() => void) | null;
  removeImage?: ((imageId: string) => void) | null;
  setPrimaryImage?: ((imageId: string) => void) | null;
  isLoading?: boolean;
}

const Carousel: React.FC<CarouselProps> = ({
  images = [],
  addImage,
  removeImage,
  setPrimaryImage,
  isLoading,
}) => {
  const { t } = useTranslation();
  const [imageToEnlarge, setImageToEnlarge] = useState<string>('');
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [isApproveDeleteModalOpen, setIsApproveDeleteModalOpen] =
    useState(false);
  const [isEnlargedImageModalOpen, setIsEnlargeImageModalOpen] =
    useState(false);
  const [showLoader, setShowLoader] = useState(false);

  useEffect(() => {
    if (isLoading) {
      setShowLoader(true);
    } else {
      setTimeout(() => {
        setShowLoader(false);
      }, 1000);
    }
  }, [isLoading]);

  const containerRef = useRef<HTMLDivElement | null>(null);
  usePreventVerticalScrollOnHorizontalSwipe(containerRef);

  const onDeleteImage = () => {
    if (removeImage && selectedImageId) {
      removeImage(selectedImageId);
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

  const onClickImage = (img: CarouselImage) => {
    setImageToEnlarge(img.src);
    setSelectedImageId(img.id);
    setIsEnlargeImageModalOpen(true);
  };

  const handleSetPrimaryImage = () => {
    if (setPrimaryImage && selectedImageId) {
      setPrimaryImage(selectedImageId);
    }
    setIsEnlargeImageModalOpen(false);
  };

  return (
    <>
      <div ref={containerRef} className="slider-container">
        <Slider
          {...settings}
          className={classnames(styles.container, {
            [styles.loading]: showLoader,
          })}
        >
          {images.map((img) => (
            <Image
              className={styles.image}
              src={img.src}
              key={img.id}
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
                <span>{t('components.carousel.addPhoto')}</span>
              </Button>
            </div>
          )}
        </Slider>
        {showLoader && <Loader inside className={styles.loader} />}
      </div>
      <TopModal
        open={isApproveDeleteModalOpen}
        onClose={() => setIsApproveDeleteModalOpen(false)}
        className={styles.approveModal}
      >
        <div className={styles.approveContent}>
          <span>{t('components.carousel.confirmTitle')}</span>
          <span>{t('components.carousel.confirmBody')}</span>
        </div>
        <div className={styles.buttonsContainer}>
          <Button
            variant="primary"
            onClick={onDeleteImage}
            className={styles.button}
          >
            <Trash2 size={16} />
            <span>{t('common.actions.delete')}</span>
          </Button>
          <Button
            variant="secondary"
            onClick={() => setIsApproveDeleteModalOpen(false)}
            className={styles.button}
          >
            <X size={16} />
            <span>{t('common.actions.cancel')}</span>
          </Button>
        </div>
      </TopModal>
      <EnlargeImageModal
        isOpen={isEnlargedImageModalOpen}
        onClose={() => setIsEnlargeImageModalOpen(false)}
        imgSrc={imageToEnlarge}
        setImgSrc={(src) => {
          setImageToEnlarge(src);
          if (!src) {
            setSelectedImageId(null);
          }
        }}
        onClickDeleteImage={
          removeImage && (() => setIsApproveDeleteModalOpen(true))
        }
        onSetPrimaryImage={setPrimaryImage ? handleSetPrimaryImage : null}
      />
    </>
  );
};

export { Carousel };
