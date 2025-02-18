import { useState } from 'react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { FaPlus } from 'react-icons/fa';
import classnames from 'classnames';
import { IconContext } from 'react-icons';
import { Modal } from './Modal';
import { Button } from './Button';
import { useOrientationContext } from '../context/OrientationContext';
import { EnlargeImageModal } from './EnlargeImageModal';
import styles from './Carousel.module.scss';

interface CarouselProps {
  images: string[];
  addImage?: (() => void) | null;
  removeImage?: ((imgPath: string) => void) | null;
}

const Carousel: React.FC<CarouselProps> = ({
  images = [],
  addImage,
  removeImage,
}) => {
  const [imageToEnlarge, setImageToEnlarge] = useState<string>('');
  const [isApproveDeleteModalOpen, setIsApproveDeleteModalOpen] =
    useState(false);
  const [isEnlargedImageModalOpen, setIsEnlargeImageModalOpen] =
    useState(false);
  const orientation = useOrientationContext((state) => state.orientation);

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
    slidesToShow: 3,
    slidesToScroll: 1,
  };

  const onClickImage = (img: string) => {
    setImageToEnlarge(img);
    setIsEnlargeImageModalOpen(true);
  };

  return (
    <>
      <div className="slider-container">
        <Slider {...settings}>
          {images.map((img) => (
            <img
              className={styles.image}
              src={img}
              key={img}
              onClick={() => onClickImage(img)}
            />
          ))}
          {addImage && (
            <div
              className={classnames(styles.image, styles.addImage)}
              onClick={addImage}
            >
              <div className={styles.plusContent}>
                <IconContext.Provider value={{ className: styles.plusIcon }}>
                  <FaPlus />
                </IconContext.Provider>
                <span>Add photo</span>
              </div>
            </div>
          )}
        </Slider>
      </div>
      <Modal
        open={isApproveDeleteModalOpen}
        onClose={() => setIsApproveDeleteModalOpen(false)}
        height={orientation === 'landscape' ? '95%' : '40%'}
        variant="center"
        className={styles.approveModal}
      >
        <div className={styles.approveContent}>
          <span>Hold your leash!</span>
          <span>
            Are you sure you want to send this pic to a farm up north where it
            can run free forever?
          </span>
        </div>
        <Button
          variant="danger"
          onClick={onDeleteImage}
          className={styles.deleteButton}
        >
          Delete
        </Button>
      </Modal>
      <EnlargeImageModal
        isOpen={isEnlargedImageModalOpen}
        onClose={() => setIsEnlargeImageModalOpen(false)}
        imgSrc={imageToEnlarge}
        setImgSrc={setImageToEnlarge}
        onClickDeleteImage={
          removeImage ? () => setIsApproveDeleteModalOpen(true) : null
        }
      />
    </>
  );
};

export { Carousel };
