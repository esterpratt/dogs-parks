import { useContext /* ChangeEvent, useState */ } from 'react';
import { ParksContext } from '../../context/ParksContext';
import { Park } from '../../types/park';
import { SearchList } from '../SearchList';
import styles from './ParksList.module.scss';
import { Link } from 'react-router-dom';
import { ParkPreview } from './ParkPreview';
// import { RadioInputs } from '../inputs/RadioInputs';

interface ParksListProps {
  className?: string;
}

const ParksList: React.FC<ParksListProps> = ({ className }) => {
  const { parks } = useContext(ParksContext);
  // const [sortBy, setSortBy] = useState('city');

  const filterParksFunc = (park: Park, searchInput: string) => {
    return park.name.toLowerCase().includes(searchInput.toLowerCase());
  };

  // const onSort = (event: ChangeEvent<HTMLInputElement>) => {
  //   setSortBy(event.target.value);
  // };

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
      {/* <div className={styles.sort}>
        <RadioInputs
          options={[
            { value: 'rank', id: 'rank' },
            { value: 'location', id: 'location' },
            { value: 'city', id: 'city' },
            { value: 'size', id: 'size' },
          ]}
          name="Sort by"
          value={sortBy}
          onOptionChange={onSort}
        />
      </div>
      <div className={styles.filter}>
        <RadioInputs
          options={[
            { value: 'with shade', id: 'shade' },
            { value: 'with water', id: 'water' },
            { value: 'friends there', id: 'friends' },
            { value: 'big', id: 'big' },
          ]}
          name="Filter by"
          value={sortBy}
          onOptionChange={onSort}
        />
      </div> */}
      <SearchList
        items={parks}
        placeholder="Search Dogs Park"
        noResultsLayout={NoResultsLayout}
        itemKeyfn={(park) => park.id}
        filterFunc={filterParksFunc}
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
