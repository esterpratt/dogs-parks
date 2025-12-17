import { useTranslation } from 'react-i18next';
import classnames from 'classnames';
import { Mars, Venus } from 'lucide-react';
import { Dog, GENDER } from '../../types/dog';
import { getLocalizedDogAgeText } from '../../utils/dogAge';
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
  const { t } = useTranslation();
  const ageText = getLocalizedDogAgeText({ birthday, gender, t });

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
                  <Venus className={styles.genderIcon} color={styles.green} />
                ) : (
                  <Mars className={styles.genderIcon} color={styles.green} />
                )}
              </>
            )}
          </div>
          {ageText !== null && <div className={styles.age}>{ageText}</div>}
        </div>
      }
    />
  );
};

export { DogPreview };
