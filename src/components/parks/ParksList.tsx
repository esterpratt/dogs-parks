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
import { useMemo } from 'react';
import { useDelayedLoading } from '../../hooks/useDelayedLoading';

interface ParksListProps {
  className?: string;
}

const ParksList: React.FC<ParksListProps> = ({ className }) => {
  const { isLoading, data: parks } = useQuery({
    queryKey: ['parks'],
    queryFn: fetchParksJSON,
  });

  const showLoader = useDelayedLoading({ isLoading });

  const parksToSort = useMemo(() => {
    return parks?.map((park) => ({
      ...park,
      ...park.location,
    }));
  }, [parks]);

  const sortedParks = useDistance(parksToSort);

  const searchParksFunc = (park: Park, searchInput: string) => {
    return (
      park.name.toLowerCase().includes(searchInput.toLowerCase()) ||
      park.address.toLowerCase().includes(searchInput.toLowerCase())
    );
  };

  const NoResultsLayout = (
    <div className={styles.noResults}>
      <span>Can’t sniff out your park?</span>
      <span>
        Help us by <Link to="new">adding the park details!</Link>
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
