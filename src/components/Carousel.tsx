import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import AddPhotoImg from '../assets/addPhoto.png';
import styles from './Carousel.module.scss';

interface CarouselProps {
  images: string[];
  addImage?: (() => void) | null;
}

const Carousel: React.FC<CarouselProps> = ({ images = [], addImage }) => {
  const settings = {
    className: 'center',
    infinite: false,
    slidesToShow: 3,
    slidesToScroll: 1,
  };

  return (
    <div className="slider-container">
      <Slider {...settings}>
        {images.map((img) => (
          <img className={styles.image} src={img} key={img} />
        ))}
        {addImage && (
          <img className={styles.image} src={AddPhotoImg} onClick={addImage} />
        )}
      </Slider>
    </div>
  );
};

export { Carousel };
