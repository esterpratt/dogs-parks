import { useContext, useMemo, useState } from 'react';
import { Dumbbell, Pencil, Ruler, Sprout, Sun } from 'lucide-react';
import classnames from 'classnames';
import { Park } from '../../types/park';
import { Section } from '../section/Section';
import { Button } from '../Button';
import { UserContext } from '../../context/UserContext';
import styles from './ParkGenerals.module.scss';
import { ChooseEditParkOptionModal } from './ChooseEditParkOptionModal';
import { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';

interface ParkGeneralsProps {
  park: Park;
}

const NO_CONTENT = '?';

const getNumberContent = (value: number | null, sign?: string) => {
  let content = NO_CONTENT;
  if (value !== null) {
    content = `${value}${sign ? sign : ''}`;
  }
  return content;
};

const getBooleanContent = (value: boolean | null, t: TFunction) => {
  let content = t('parks.about.boolean.unknown');
  if (value) {
    content = t('parks.about.boolean.yes');
  } else if (value === false) {
    content = t('parks.about.boolean.no');
  }
  return content;
};

const getListContentLabels = (values: string[] | null) => {
  if (!values || values.length === 0) return NO_CONTENT;

  if (values.length === 1) return values[0];
  if (values.length === 2) return values.join(' & ');

  return values.slice(0, -1).join(', ') + ' & ' + values[values.length - 1];
};

const getSizeContent = (value: number | null, t: TFunction) => {
  let content = NO_CONTENT;
  if (value) {
    content = t('parks.about.sizeLabel.medium');
    if (value >= 100) {
      content = t('parks.about.sizeLabel.large');
    } else if (value < 50) {
      content = t('parks.about.sizeLabel.small');
    }
  }
  return content;
};

const ParkGenerals = ({ park }: ParkGeneralsProps) => {
  const { t } = useTranslation();
  const { size, materials: ground, has_facilities: facilities, shade } = park;
  const { userId } = useContext(UserContext);
  const [isEditParkModalOpen, setIsEditParkModalOpen] = useState(false);

  const groundLabels = useMemo(() => {
    if (!ground || ground.length === 0) return null;
    return ground.map((value) => {
      const key =
        value.toLowerCase() === 'sand'
          ? 'SAND'
          : value.toLowerCase() === 'dirt'
            ? 'DIRT'
            : value.toLowerCase() === 'grass'
              ? 'GRASS'
              : 'SYNTHETIC_GRASS';
      return t(`parks.about.groundOptions.${key}`);
    });
  }, [ground, t]);

  const existedData = useMemo(
    () => [
      {
        label: t('parks.about.size'),
        data: getSizeContent(size, t),
        icon: (
          <div
            style={{
              border:
                !shade || shade >= 50
                  ? `1px solid ${styles.orange}`
                  : `1px solid ${styles.blue}`,
              backgroundColor:
                !shade || shade >= 50 ? styles.lightOrange : styles.lightBlue,
            }}
          >
            <Ruler
              color={!shade || shade >= 50 ? styles.orange : styles.blue}
              size={28}
            />
          </div>
        ),
      },
      {
        label: t('parks.about.ground'),
        data: getListContentLabels(groundLabels),
        icon: (
          <div
            style={{
              border: `1px solid ${styles.green}`,
              backgroundColor: styles.lightGreen,
            }}
          >
            <Sprout color={styles.green} size={28} />
          </div>
        ),
      },
      {
        label: t('parks.about.shade'),
        data: getNumberContent(shade, '%'),
        icon: (
          <div
            style={{
              border:
                !shade || shade >= 50
                  ? `1px solid ${styles.blue}`
                  : `1px solid ${styles.orange}`,
              backgroundColor:
                !shade || shade >= 50 ? styles.lightBlue : styles.lightOrange,
            }}
          >
            <Sun
              color={!shade || shade >= 50 ? styles.blue : styles.orange}
              size={28}
            />
          </div>
        ),
      },
      {
        label: t('parks.about.facilities'),
        data: getBooleanContent(facilities, t),
        icon: (
          <div
            style={{
              border: `1px solid ${styles.red}`,
              backgroundColor: styles.lightRed,
              '--current-color': styles.red,
            }}
            className={classnames({ [styles.no]: facilities === false })}
          >
            <Dumbbell color={styles.red} size={28} />
          </div>
        ),
      },
    ],
    [facilities, groundLabels, shade, size, t]
  );

  const handleClickEditAbout = () => {
    setIsEditParkModalOpen(true);
  };

  return (
    <>
      <Section
        title={t('parks.sections.about')}
        actions={
          !!userId && (
            <Button
              variant="simple"
              color={styles.white}
              className={styles.button}
              onClick={handleClickEditAbout}
            >
              <Pencil size={18} />
            </Button>
          )
        }
        contentCmp={
          <div className={styles.container}>
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
          </div>
        }
      />
      {!!userId && (
        <ChooseEditParkOptionModal
          isOpen={isEditParkModalOpen}
          onClose={() => setIsEditParkModalOpen(false)}
          park={park}
        />
      )}
    </>
  );
};

export { ParkGenerals };
