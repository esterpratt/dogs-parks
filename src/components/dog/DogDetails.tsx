import { MouseEvent, useMemo } from 'react';
import {
  Activity,
  Ruler,
  ScrollText,
  ShieldX,
  Thermometer,
} from 'lucide-react';
import { Dog } from '../../types/dog';
import { Button } from '../Button';
import { Section } from '../section/Section';
import styles from './DogDetails.module.scss';

interface DogDeatilsProps {
  dog: Dog;
  onEditDog: (event: MouseEvent<HTMLButtonElement>) => void;
  userName?: string;
  isSignedInUser: boolean;
}

const DogDetails: React.FC<DogDeatilsProps> = ({
  dog,
  isSignedInUser,
  onEditDog,
  userName,
}) => {
  const dogDetailsTextMap = useMemo(
    () => [
      {
        label: 'Size',
        data: dog.size,
        icon: <Ruler color={styles.green} size={32} />,
      },
      {
        label: 'Temperament',
        data: dog.temperament,
        icon: <Thermometer color={styles.green} size={32} />,
      },
      {
        label: 'Energy',
        data: dog.energy,
        icon: <Activity color={styles.green} size={32} />,
      },
      {
        label: 'Possessive',
        data: dog.possessive,
        icon: <ShieldX color={styles.green} size={32} />,
      },
    ],
    [dog]
  );

  const existedData = dogDetailsTextMap.filter((detail) => detail.data);

  return (
    <Section
      className={styles.container}
      titleCmp={
        <div className={styles.title}>
          <span>About</span>
        </div>
      }
      contentCmp={
        <div className={styles.content}>
          {!existedData.length && (
            <>
              {isSignedInUser ? (
                <Button
                  variant="secondary"
                  className={styles.button}
                  onClick={onEditDog}
                >
                  Add your dog's details
                </Button>
              ) : (
                <div className={styles.empty}>
                  <span className={styles.userName}>{userName} </span>
                  <span>did not add their dog's details yet</span>
                </div>
              )}
            </>
          )}
          {!!existedData.length && (
            <div className={styles.charactersContainer}>
              {existedData.map((rowData, index) => {
                return (
                  <div key={index} className={styles.character}>
                    <div className={styles.iconContainer}>{rowData.icon}</div>
                    <div className={styles.textContainer}>
                      <div>{rowData.label}</div>
                      <div>{rowData.data}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {!!dog.description && (
            <div className={styles.description}>
              <div className={styles.descriptionTitle}>
                <ScrollText color={styles.green} size={16} />
                <span>Description</span>
              </div>
              <div className={styles.descriptionText}>{dog.description}</div>
            </div>
          )}
        </div>
      }
    />
  );
};

export { DogDetails };
