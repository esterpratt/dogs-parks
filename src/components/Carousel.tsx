import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import AddPhotoImg from '../assets/addPhoto.png';
import styles from './Carousel.module.scss';
import { useState } from 'react';
import { Modal } from './Modal';

interface CarouselProps {
  images: string[];
  addImage?: (() => void) | null;
}

const Carousel: React.FC<CarouselProps> = ({ images = [], addImage }) => {
  const [imageToEnlarge, setImageToEnlarge] = useState<string>('');

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
            <img
              className={styles.image}
              src={AddPhotoImg}
              onClick={addImage}
            />
          )}
        </Slider>
      </div>
      <Modal
        open={!!imageToEnlarge}
        onClose={() => setImageToEnlarge('')}
        width="95%"
        height="65%"
        variant="appear"
        className={styles.modal}
      >
        <div className={styles.modalImage}>
          <img src={imageToEnlarge}></img>
        </div>
      </Modal>
    </>
  );
};

export { Carousel };
