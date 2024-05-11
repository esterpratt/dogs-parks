import classnames from 'classnames';
import { PiDog } from 'react-icons/pi';
import { IoMdFemale, IoMdMale } from 'react-icons/io';
import { Dog, GENDER } from '../../types/dog';
import styles from './DogPreview.module.scss';
import { IconContext } from 'react-icons';

interface DogPreviewProps {
  dog: Dog;
}

const DogPreview: React.FC<DogPreviewProps> = ({ dog }) => {
  const { name, age, gender, primaryImage } = dog;

  return (
    <div className={styles.container}>
      <div className={styles.imgContainer}>
        {primaryImage ? (
          <img src={primaryImage} className={styles.img} />
        ) : (
          <div className={classnames(styles.img, styles.empty)}>
            <PiDog size={64} />
          </div>
        )}
      </div>
      <div className={styles.details}>
        <div className={styles.upper}>
          <span className={styles.name}>{name}</span>
          {gender && (
            <IconContext.Provider value={{ className: styles.icon }}>
              {gender === GENDER.FEMALE ? <IoMdFemale /> : <IoMdMale />}
            </IconContext.Provider>
          )}
        </div>
        {age && (
          <div className={styles.age}>
            {age} Year{age > 1 && 's'} old
          </div>
        )}
      </div>
    </div>
  );
};

export { DogPreview };
