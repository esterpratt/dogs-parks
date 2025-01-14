import { useState } from 'react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { FaPlus } from 'react-icons/fa';
import classnames from 'classnames';
import { IconContext } from 'react-icons';
import { IoTrashOutline } from 'react-icons/io5';
import styles from './Carousel.module.scss';
import { Modal } from './Modal';
import { Button } from './Button';

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

  const onDeleteImage = () => {
    if (removeImage) {
      removeImage(imageToEnlarge);
    }
    setIsApproveDeleteModalOpen(false);
    setImageToEnlarge('');
  };

  const settings = {
    className: 'center',
    infinite: false,
    slidesToShow: 3,
    slidesToScroll: 1,
  };

  const onClickImage = (img: string) => {
    setImageToEnlarge(img);
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
        height="30%"
        variant="center"
        className={styles.approveModal}
      >
        <span className={styles.approveTitle}>
          Hold your leash! Are you sure you want to send this pic to the
          doghouse?
        </span>
        <Button
          variant="danger"
          onClick={onDeleteImage}
          className={styles.deleteButton}
        >
          Delete
        </Button>
      </Modal>
      <Modal
        open={!!imageToEnlarge}
        onClose={() => setImageToEnlarge('')}
        width="95%"
        height="65%"
        variant="appear"
        className={styles.modal}
      >
        <div className={styles.modalImage}>
          <img src={imageToEnlarge} />
          {!!removeImage && (
            <IconContext.Provider value={{ className: styles.trashIcon }}>
              <IoTrashOutline
                onClick={() => setIsApproveDeleteModalOpen(true)}
              />
            </IconContext.Provider>
          )}
        </div>
      </Modal>
    </>
  );
};

export { Carousel };
