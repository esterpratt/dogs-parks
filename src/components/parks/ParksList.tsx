import { useContext, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ParksContext } from '../../context/ParksContext';
import { Park } from '../../types/park';
import { SearchList } from '../SearchList';
import styles from './ParksList.module.scss';
import { ParkPreview } from './ParkPreview';
import { useDistance } from '../../hooks/useDistance';

interface ParksListProps {
  className?: string;
}

const ParksList: React.FC<ParksListProps> = ({ className }) => {
  const { parks } = useContext(ParksContext);
  const parksToSort = useMemo(
    () =>
      parks.map((park) => ({
        ...park,
        ...park.location,
      })),
    [parks]
  );

  const sortedParks = useDistance(parksToSort);

  const searchParksFunc = (park: Park, searchInput: string) => {
    return park.name.toLowerCase().includes(searchInput.toLowerCase());
  };

  const NoResultsLayout = (
    <div className={styles.noResults}>
      <p>Didn't find your park?</p>
      <p>
        Please consider helping us by{' '}
        <Link to="parks/new">adding the park details</Link>
      </p>
    </div>
  );

  return (
    <div className={styles.container}>
      <SearchList
        items={sortedParks}
        placeholder="Search Dogs Park"
        noResultsLayout={NoResultsLayout}
        itemKeyfn={(park) => park.id}
        filterFunc={searchParksFunc}
        containerClassName={className}
      >
        {(park) => (
          <Link to={`/parks/${park.id}`} className={styles.park}>
            <ParkPreview park={park} />
          </Link>
        )}
      </SearchList>
    </div>
  );
};

export { ParksList };
