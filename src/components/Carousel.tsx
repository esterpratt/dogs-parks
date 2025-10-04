import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Slider from 'react-slick';
import { Plus, Trash2, X } from 'lucide-react';
import classnames from 'classnames';
import { usePreventVerticalScrollOnHorizontalSwipe } from '../hooks/usePreventVerticalScrollOnHorizontalSwipe';
import { Button } from './Button';
import { isRTL } from '../utils/language';
import { EnlargeImageModal } from './EnlargeImageModal';
import { TopModal } from './modals/TopModal';
import { Image } from './Image';
import { Loader } from './Loader';
import styles from './Carousel.module.scss';

interface CarouselProps {
  images: string[];
  addImage?: (() => void) | null;
  removeImage?: ((imgPath: string) => void) | null;
  setPrimaryImage?: ((imgPath: string) => void) | null;
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
    if (removeImage) {
      removeImage(imageToEnlarge);
    }
    setIsApproveDeleteModalOpen(false);
    setIsEnlargeImageModalOpen(false);
  };

  const { i18n } = useTranslation();
  const isRTLValue = isRTL(i18n.language);

  const settings = {
    className: 'center',
    infinite: false,
    slidesToShow: 2,
    slidesToScroll: 1,
    swipeToSlide: true,
    rtl: isRTLValue,
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
        <Slider
          {...settings}
          className={classnames(styles.container, {
            [styles.loading]: showLoader,
          })}
        >
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
