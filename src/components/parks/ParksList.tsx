import { useTranslation } from 'react-i18next';
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
import { useInitLocation } from '../../hooks/useInitLocation';
import styles from './ParksList.module.scss';
import { useDelayedLoading } from '../../hooks/useDelayedLoading';

interface ParksListProps {
  className?: string;
}

const ParksList: React.FC<ParksListProps> = ({ className }) => {
  const { t } = useTranslation();
  const { user } = useContext(UserContext);
  const userLocation = useInitLocation();

  const { data: parks, isLoading: isLoadingParks } = useQuery({
    queryKey: ['parks'],
    queryFn: fetchParksJSON,
    retry: 0,
  });

  const { data: sortedParks, isLoading: isLoadingSortedParks } = useQuery({
    queryKey: ['sortedParks', userLocation],
    queryFn: () => fetchSortedParks(parks!, userLocation),
    enabled: !!parks,
    retry: 0,
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
      <span>{t('parks.noResults.titleSignedIn')}</span>
      <span>
        {t('parks.noResults.helpPrefix')}{' '}
        <Link to="new">{t('parks.noResults.helpLink')}</Link>
      </span>
    </div>
  ) : (
    <div className={styles.noResults}>
      <span>{t('parks.noResults.titleSignedOut')}</span>
      <span>
        <Link to="/login?mode=login">{t('newPark.loginLink')}</Link>{' '}
        {t('parks.noResults.ctaSignedOutSuffix')}
      </span>
    </div>
  );

  if (showLoader || !sortedParks) {
    return <Loader style={{ paddingTop: '64px' }} />;
  }

  return (
    <SearchList
      isInfinite
      items={sortedParks}
      placeholder={t('parks.search.placeholder')}
      noResultsLayout={NoResultsLayout}
      itemKeyfn={(park) => park.id}
      filterFunc={searchParksFunc}
      containerClassName={classnames(styles.list, className)}
      renderSearchInput={(props: SearchInputProps) => {
        return (
          <div className={styles.searchContainer}>
            <SearchInput
              {...props}
              className={styles.inputContainer}
              inputTestId="park-search-input"
            />
            <Link to="/">
              <Button variant="round">
                <Map size={24} />
              </Button>
            </Link>
          </div>
        );
      }}
    >
      {(park) => <ParkPreview park={park} />}
    </SearchList>
  );
};

export { ParksList };
