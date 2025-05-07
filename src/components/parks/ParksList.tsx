import { Link } from 'react-router-dom';
import { useContext } from 'react';
import classnames from 'classnames';
import { useQuery } from '@tanstack/react-query';
import { Map } from 'lucide-react';
import { Park } from '../../types/park';
import { SearchList } from '../searchList/SearchList';
import { ParkPreview } from './ParkPreview';
import { fetchSortedParks } from '../../utils/fetchSortedParks';
import { fetchParksJSON } from '../../services/parks';
import { Loader } from '../Loader';
import { UserContext } from '../../context/UserContext';
import { Button } from '../Button';
import { SearchInput, SearchInputProps } from '../inputs/SearchInput';
import { useUserLocation } from '../../context/LocationContext';
import styles from './ParksList.module.scss';
import { useDelayedLoading } from '../../hooks/useDelayedLoading';

interface ParksListProps {
  className?: string;
}

const ParksList: React.FC<ParksListProps> = ({ className }) => {
  const { user } = useContext(UserContext);
  const { data: parks, isLoading: isLoadingParks } = useQuery({
    queryKey: ['parks'],
    queryFn: fetchParksJSON,
  });

  const userLocation = useUserLocation((state) => state.userLocation);

  const { data: sortedParks, isLoading: isLoadingSortedParks } = useQuery({
    queryKey: ['sortedParks', userLocation],
    queryFn: () => fetchSortedParks(parks!, userLocation),
    enabled: !!parks && !!userLocation,
  });

  const { showLoader } = useDelayedLoading({
    isLoading: isLoadingParks || isLoadingSortedParks,
  });

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
        <Link to="/login?mode=login">Log In</Link> to add your park!
      </span>
    </div>
  );

  if (showLoader || !sortedParks) {
    return <Loader />;
  }

  return (
    <SearchList
      isInfinite
      items={sortedParks}
      placeholder="Search Park"
      noResultsLayout={NoResultsLayout}
      itemKeyfn={(park) => park.id}
      filterFunc={searchParksFunc}
      containerClassName={classnames(styles.list, className)}
      renderSearchInput={(props: SearchInputProps) => {
        return (
          <div className={styles.searchContainer}>
            <SearchInput {...props} className={styles.inputContainer} />
            <Link to="/" className={styles.mapLink}>
              <Button variant="round">
                <Map size={24} />
              </Button>
            </Link>
          </div>
        );
      }}
    >
      {(park) => <ParkPreview park={park} className={styles.park} />}
    </SearchList>
  );
};

export { ParksList };
