import { MouseEvent } from 'react';
import {
  Activity,
  Ruler,
  ScrollText,
  ShieldX,
  Thermometer,
} from 'lucide-react';
import classnames from 'classnames';
import { Dog } from '../../types/dog';
import { Button } from '../Button';
import { Section } from '../section/Section';
import styles from './DogDetails.module.scss';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();

  const dogDetailsTextMap = [
    {
      label: t('dogs.details.fields.size'),
      data: dog.size
        ? t(`dogs.size.${String(dog.size).toUpperCase()}`)
        : undefined,
      icon: (
        <div
          style={{
            border: `1px solid ${styles.green}`,
            backgroundColor: styles.lightGreen,
          }}
        >
          <Ruler color={styles.green} size={28} />
        </div>
      ),
    },
    {
      label: t('dogs.details.fields.temperament'),
      data: dog.temperament,
      icon: (
        <div
          style={{
            border: `1px solid ${styles.orange}`,
            backgroundColor: styles.lightOrange,
          }}
        >
          <Thermometer color={styles.orange} size={28} />
        </div>
      ),
    },
    {
      label: t('dogs.details.fields.energy'),
      data: dog.energy
        ? t(`dogs.energy.${String(dog.energy).toUpperCase()}`)
        : undefined,
      icon: (
        <div
          style={{
            border: `1px solid ${styles.red}`,
            backgroundColor: styles.lightRed,
          }}
        >
          <Activity color={styles.red} size={28} />
        </div>
      ),
    },
    {
      label: t('dogs.details.fields.possessive'),
      data: dog.possessive,
      icon: (
        <div
          style={{
            border: `1px solid ${styles.blue}`,
            backgroundColor: styles.lightBlue,
          }}
        >
          <ShieldX color={styles.blue} size={28} />
        </div>
      ),
    },
  ];

  const existedData = dogDetailsTextMap.filter((detail) => detail.data);

  return (
    <Section
      className={styles.container}
      title={t('dogs.details.title')}
      contentCmp={
        <div
          className={classnames(styles.content, {
            [styles.withData]: !!existedData.length,
          })}
        >
          {!existedData.length && (
            <>
              {isSignedInUser ? (
                <Button
                  variant="secondary"
                  className={styles.button}
                  onClick={onEditDog}
                >
                  {t('dogs.details.addYourDetails')}
                </Button>
              ) : (
                <div className={styles.empty}>
                  <span className={styles.userName}>{userName} </span>
                  <span>{t('dogs.details.notAddedYet')}</span>
                </div>
              )}
            </>
          )}
          {!!existedData.length && (
            <div className={styles.charactersContainer}>
              {existedData.map((rowData, index) => {
                return (
                  <div key={index} className={styles.character}>
                    {rowData.icon}
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
                <span>{t('dogs.details.description')}</span>
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
