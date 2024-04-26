import { useContext } from 'react';
import { ParksContext } from '../../context/ParksContextProvider';
import { Park } from '../../types/park';
import { SearchList } from '../SearchList';
import styles from './ParksList.module.scss';
import { Link } from 'react-router-dom';

const ParksList: React.FC = () => {
  const { parks } = useContext(ParksContext);

  const filterParksFunc = (park: Park, searchInput: string) => {
    return park.name.toLowerCase().includes(searchInput.toLowerCase());
  };

  return (
    <SearchList
      items={parks}
      placeholder="Search Dogs Park"
      itemKeyfn={(park) => park.id}
      filterFunc={filterParksFunc}
      containerClassName={styles.container}
    >
      {(park) => (
        <Link to={`/parks/${park.id}`} className={styles.park}>
          <p className={styles.name}>Park {park.name}</p>
          <p className={styles.address}>
            {park.address} {park.city}
          </p>
        </Link>
      )}
    </SearchList>
  );
};

export { ParksList };
