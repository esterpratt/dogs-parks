import { Link } from 'react-router';
import classnames from 'classnames';
import { Park } from '../../types/park';
import { SearchList } from '../SearchList';
import styles from './ParksList.module.scss';
import { ParkPreview } from './ParkPreview';
import { useDistance } from '../../hooks/useDistance';
import { fetchParksJSON } from '../../services/parks';
import { useQuery } from '@tanstack/react-query';
import { Loader } from '../Loader';
import { useContext, useMemo } from 'react';
import { useDelayedLoading } from '../../hooks/useDelayedLoading';
import { UserContext } from '../../context/UserContext';

interface ParksListProps {
  className?: string;
}

const ParksList: React.FC<ParksListProps> = ({ className }) => {
  const { user } = useContext(UserContext);
  const { isLoading, data: parks } = useQuery({
    queryKey: ['parks'],
    queryFn: fetchParksJSON,
  });

  const showLoader = useDelayedLoading({ isLoading });

  const parksToSort = useMemo(() => {
    return parks?.map((park) => ({
      ...park,
      latitude: park.location.lat,
      longitude: park.location.long,
    }));
  }, [parks]);

  const sortedParks = useDistance(parksToSort);

  const searchParksFunc = (park: Park, searchInput: string) => {
    return (
      park.name.toLowerCase().includes(searchInput.toLowerCase()) ||
      park.address.toLowerCase().includes(searchInput.toLowerCase())
    );
  };

  const NoResultsLayout = user ? (
    <div className={styles.noResults}>
      <span>Can’t sniff out your park?</span>
      <span>
        Help us by <Link to="new">adding the park details!</Link>
      </span>
    </div>
  ) : (
    <div className={styles.noResults}>
      <span>Sorry, can’t sniff out your park</span>
      <span>
        <Link to="/signin">Sign In</Link> to add your park!
      </span>
    </div>
  );

  if (showLoader) {
    return <Loader />;
  }

  return (
    <SearchList
      items={sortedParks}
      placeholder="Search Dogs Park"
      noResultsLayout={NoResultsLayout}
      itemKeyfn={(park) => park.id}
      filterFunc={searchParksFunc}
      containerClassName={classnames(styles.list, className)}
    >
      {(park) => <ParkPreview park={park} className={styles.park} />}
    </SearchList>
  );
};

export { ParksList };
