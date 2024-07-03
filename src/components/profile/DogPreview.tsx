import classnames from 'classnames';
import { PiDog } from 'react-icons/pi';
import { IoMdFemale, IoMdMale } from 'react-icons/io';
import { Dog, GENDER } from '../../types/dog';
import styles from './DogPreview.module.scss';
import { IconContext } from 'react-icons';
import { getAge } from '../../utils/time';

const LOADING = 'loading';

interface DogPreviewProps {
  dog: Dog;
  image: string | null;
}

const DogPreview: React.FC<DogPreviewProps> = ({ dog, image }) => {
  const { name, birthday, gender } = dog;
  const age = !birthday ? null : getAge(birthday);

  return (
    <div className={styles.container}>
      <div className={styles.imgContainer}>
        {image ? (
          image === LOADING ? (
            <div className={classnames(styles.img, styles.empty)}>
              <span>Loading...</span>
            </div>
          ) : (
            <img src={image} className={styles.img} />
          )
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
        {age !== null && (
          <div className={styles.age}>
            {age.diff === 0 ? 'Just Born' : `${age.diff} ${age.unit} old`}
          </div>
        )}
      </div>
    </div>
  );
};

export { DogPreview, LOADING };
