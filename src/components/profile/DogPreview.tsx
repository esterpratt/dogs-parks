import classnames from 'classnames';
import { Mars, Venus } from 'lucide-react';
import { Dog, GENDER } from '../../types/dog';
import { getAge } from '../../utils/time';
import { Card } from '../card/Card';
import { Image } from '../Image';
import DogIcon from '../../assets/dog.svg?react';
import styles from './DogPreview.module.scss';

interface DogPreviewProps {
  dog: Dog;
  image?: string | null;
}

const DogPreview: React.FC<DogPreviewProps> = ({ dog, image }) => {
  const { name, birthday, gender } = dog;
  const age = !birthday ? null : getAge(birthday);

  return (
    <Card
      imgCmp={
        <>
          {image ? (
            <div className={styles.imgContainer}>
              <Image src={image} className={styles.img} />
            </div>
          ) : (
            <div className={classnames(styles.img, styles.empty)}>
              <DogIcon width={64} height={64} />
            </div>
          )}
        </>
      }
      detailsCmp={
        <div className={styles.details}>
          <div className={styles.upper}>
            <span className={styles.name}>{name}</span>
            {gender && (
              <>
                {gender === GENDER.FEMALE ? (
                  <Venus size={18} color={styles.green} />
                ) : (
                  <Mars size={18} color={styles.green} />
                )}
              </>
            )}
          </div>
          {age !== null && (
            <div className={styles.age}>
              {age.diff === 0
                ? 'Just born'
                : age.diff > 0
                ? `${age.diff} ${age.unit} old`
                : `${age.diff} ${age.unit} old. No wonder ${
                    gender === GENDER.FEMALE ? 'she' : 'he'
                  } looks so good!`}
            </div>
          )}
        </div>
      }
    />
  );
};

export { DogPreview };
