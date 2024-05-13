import { Link } from 'react-router-dom';
import { FaWalking, FaRegClock } from 'react-icons/fa';
import classnames from 'classnames';
import { Location, Park } from '../../types/park';
import styles from './ParkPopup.module.scss';
import { useEffect, useState } from 'react';
import { fetchParkPrimaryImage } from '../../services/parks';
import { IconContext } from 'react-icons';
import { LuTrees } from 'react-icons/lu';
import { CgClose } from 'react-icons/cg';

interface ParkPopupProps {
  activePark: Park | null;
  onGetDirections: (location: Location) => void;
  directions?: google.maps.DirectionsResult;
  onClose: () => void;
}

const ParkPopup: React.FC<ParkPopupProps> = ({
  activePark,
  onGetDirections,
  directions,
  onClose,
}) => {
  const [image, setImage] = useState<string | null>(null);

  useEffect(() => {
    const getImage = async () => {
      const image = await fetchParkPrimaryImage(activePark!.id);
      if (image?.length) {
        setImage(image[0]);
      } else {
        setImage(null);
      }
    };
    if (activePark?.id) {
      getImage();
    } else {
      setImage(null);
    }
  }, [activePark]);

  return (
    <div className={classnames(styles.parkModal, !!activePark && styles.open)}>
      <CgClose onClick={onClose} size={24} className={styles.close} />
      <Link to={`/parks/${activePark?.id}`} className={styles.imgContainer}>
        {image ? (
          <img src={image} className={styles.img} />
        ) : (
          <IconContext.Provider value={{ className: styles.parkIcon }}>
            <LuTrees />
          </IconContext.Provider>
        )}
      </Link>
      <div className={styles.detailsContainer}>
        <div className={styles.details}>
          <Link to={`/parks/${activePark?.id}`} className={styles.name}>
            <span>{activePark?.name}</span>
          </Link>
          <span className={styles.address}>
            {activePark?.address}, {activePark?.city}
          </span>
        </div>
        <div className={styles.directionsContainer}>
          <div className={styles.buttons}>
            <button
              className={styles.directionsButton}
              onClick={
                activePark
                  ? () => onGetDirections(activePark.location)
                  : () => {}
              }
            >
              Get me there
            </button>
            <Link to={`/parks/${activePark?.id}`}>See Park Page</Link>
          </div>
          {directions && (
            <div className={styles.directions}>
              <div className={styles.distance}>
                <IconContext.Provider value={{ className: styles.icon }}>
                  <FaWalking />
                </IconContext.Provider>
                <span>{directions?.routes[0].legs[0].distance?.text}</span>
              </div>
              <div className={styles.duration}>
                <IconContext.Provider value={{ className: styles.icon }}>
                  <FaRegClock />
                </IconContext.Provider>
                <span>{directions?.routes[0].legs[0].duration?.text}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export { ParkPopup };
