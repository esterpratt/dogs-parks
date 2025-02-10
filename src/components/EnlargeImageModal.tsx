import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { IconContext } from 'react-icons';
import { IoTrashOutline } from 'react-icons/io5';
import { Modal } from './Modal';
import { useOrientationContext } from '../context/OrientationContext';
import styles from './EnlargeImageModal.module.scss';

interface CarouselProps {
  isOpen: boolean;
  imgSrc: string;
  setImgSrc: (imgSrc: string) => void;
  onClose: () => void;
  onClickDeleteImage?: () => void;
}

const EnlargeImageModal: React.FC<CarouselProps> = ({
  isOpen,
  onClose,
  onClickDeleteImage,
  imgSrc,
  setImgSrc,
}) => {
  const orientation = useOrientationContext((state) => state.orientation);

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      width="90%"
      height={orientation === 'landscape' ? '95%' : '65%'}
      variant="appear"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.9)' }}
    >
      <div
        className={styles.modalImage}
        onTransitionEnd={() => !isOpen && setImgSrc('')}
      >
        <img src={imgSrc} />
        {!!onClickDeleteImage && (
          <IconContext.Provider value={{ className: styles.trashIcon }}>
            <IoTrashOutline onClick={onClickDeleteImage} />
          </IconContext.Provider>
        )}
      </div>
    </Modal>
  );
};

export { EnlargeImageModal };
