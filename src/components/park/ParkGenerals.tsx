import { Link } from 'react-router-dom';
import { useContext, useMemo, useState } from 'react';
import { Dumbbell, Pencil, Ruler, Sprout, Sun } from 'lucide-react';
import classnames from 'classnames';
import { Park } from '../../types/park';
import { useGetParkVisitors } from '../../hooks/api/useGetParkVisitors';
import { Section } from '../section/Section';
import { Button } from '../Button';
import { UserContext } from '../../context/UserContext';
import styles from './ParkGenerals.module.scss';
import { useQuery } from '@tanstack/react-query';
import { fetchUsersWithDogsByIds } from '../../services/users';
import { ChooseEditParkOptionModal } from './ChooseEditParkOptionModal';

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

const getBooleanContent = (value: boolean | null) => {
  let content = NO_CONTENT;
  if (value) {
    content = 'Yes';
  } else if (value === false) {
    content = 'No';
  }
  return content;
};

const getListContent = (values: string[] | null) => {
  if (!values || values.length === 0) return NO_CONTENT;

  const capitalized = values.map(
    (value) => value[0].toUpperCase() + value.slice(1)
  );

  if (capitalized.length === 1) return capitalized[0];
  if (capitalized.length === 2) return capitalized.join(' & ');

  return (
    capitalized.slice(0, -1).join(', ') +
    ' & ' +
    capitalized[capitalized.length - 1]
  );
};

const getSizeContent = (value: number | null) => {
  let content = NO_CONTENT;
  if (value) {
    content = 'Medium';
    if (value >= 100) {
      content = 'Large';
    } else if (value < 50) {
      content = 'Small';
    }
  }
  return content;
};

const ParkGenerals = ({ park }: ParkGeneralsProps) => {
  const {
    id: parkId,
    size,
    materials: ground,
    has_facilities: facilities,
    shade,
  } = park;
  const { userId } = useContext(UserContext);
  const { friendsInParkIds, visitorsIds } = useGetParkVisitors(parkId, userId);
  const [isEditParkModalOpen, setIsEditParkModalOpen] = useState(false);

  const friendsCount = friendsInParkIds.length;
  const othersCount = visitorsIds.length - friendsCount;

  const visitorsContent = friendsCount
    ? friendsCount.toString()
    : othersCount.toString();

  // prefetch visitors data
  useQuery({
    queryKey: ['parkVisitorsWithDogs', parkId],
    queryFn: () => fetchUsersWithDogsByIds(friendsInParkIds),
    enabled: !!friendsInParkIds.length,
    staleTime: 6000,
  });

  const existedData = useMemo(
    () => [
      {
        label: 'Size',
        data: getSizeContent(size),
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
        label: 'Ground',
        data: getListContent(ground),
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
        label: 'Shade',
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
        label: 'Facilities',
        data: getBooleanContent(facilities),
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
    [facilities, ground, shade, size]
  );

  return (
    <>
      <Section
        titleCmp={
          <div className={styles.title}>
            <span>About</span>
            {!!userId && (
              <Button
                variant="simple"
                color={styles.white}
                className={styles.button}
                onClick={() => setIsEditParkModalOpen(true)}
              >
                <Pencil size={18} />
              </Button>
            )}
          </div>
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
            <div className={styles.visitors}>
              <Button
                disabled={!friendsCount && !othersCount}
                className={styles.visitorsButton}
              >
                <Link
                  to="visitors"
                  className={classnames(styles.link, {
                    [styles.disabled]: !friendsCount && !othersCount,
                  })}
                >
                  {visitorsContent}
                </Link>
              </Button>
              <div className={styles.visitorsText}>
                <div>{friendsCount ? 'Friends' : 'Visitors'}</div>
                <div> at the park right now</div>
              </div>
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
