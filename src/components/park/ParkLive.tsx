import { Link } from 'react-router-dom';
import { useContext } from 'react';
import classnames from 'classnames';
import { Location } from '../../types/park';
import { useGetParkVisitors } from '../../hooks/api/useGetParkVisitors';
import { Section } from '../section/Section';
import { Button } from '../Button';
import { UserContext } from '../../context/UserContext';
import { useQuery } from '@tanstack/react-query';
import { fetchUsersWithDogsByIds } from '../../services/users';
import { WeatherForecast } from './WeatherForecast';
import styles from './ParkLive.module.scss';

interface ParkGeneralsProps {
  id: string;
  location: Location;
}

const ParkLive = (props: ParkGeneralsProps) => {
  const { id: parkId, location } = props;
  const { userId } = useContext(UserContext);
  const { friendsInParkIds, visitorsIds } = useGetParkVisitors(parkId, userId);

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

  return (
    <Section
      title="Live status"
      contentCmp={
        <div className={styles.container}>
          <WeatherForecast lat={location.lat} long={location.long} />
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
            <div className={styles.textContainer}>
              <div>{friendsCount ? 'Friends' : 'Visitors'}</div>
              <div>at the park right now</div>
            </div>
          </div>
        </div>
      }
    />
  );
};

export { ParkLive };
