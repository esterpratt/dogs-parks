import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useContext, useMemo } from 'react';
import classnames from 'classnames';
import { useQuery } from '@tanstack/react-query';
import { Map } from 'lucide-react';
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
import { useParksCrossLanguageFilter } from '../../hooks/useParksCrossLanguageFilter';
import { useAppLocale } from '../../hooks/useAppLocale';
import { parksKey } from '../../hooks/api/keys';

interface ParksListProps {
  className?: string;
}

const ParksList: React.FC<ParksListProps> = ({ className }) => {
  const { t } = useTranslation();
  const currentLanguage = useAppLocale();
  const { user } = useContext(UserContext);
  const userLocation = useInitLocation();

  const { data: parks, isLoading: isLoadingParks } = useQuery({
    queryKey: parksKey(currentLanguage),
    queryFn: () => fetchParksJSON({ language: currentLanguage }),
    placeholderData: (previous) => previous,
    retry: 0,
  });

  const { filterFunc: crossLangFilter, isLoading: isBuildingIndex } =
    useParksCrossLanguageFilter();

  const sortedParks = useMemo(() => {
    if (!parks?.length) {
      return [];
    }

    return fetchSortedParks(parks!, userLocation);
  }, [parks, userLocation]);

  const { showLoader } = useDelayedLoading({
    isLoading: isLoadingParks || isBuildingIndex,
  });

  const NoResultsLayout = user ? (
    <div className={styles.noResults}>
      <span>{t('parks.noResults.user.title')}</span>
      <span>
        {t('parks.noResults.user.helpPrefix')}{' '}
        <Link to="new">{t('parks.noResults.user.helpLink')}</Link>
      </span>
    </div>
  ) : (
    <div className={styles.noResults}>
      <span>{t('parks.noResults.noUser.title')}</span>
      <span>
        <Link to="/login?mode=login">
          {t('parks.noResults.noUser.loginLink')}
        </Link>{' '}
        {t('parks.noResults.noUser.loginSuffix')}
      </span>
    </div>
  );

  if (showLoader) {
    return <Loader style={{ paddingTop: '64px' }} />;
  }

  return (
    <SearchList
      isInfinite
      items={sortedParks}
      placeholder={t('parks.search.placeholder')}
      noResultsLayout={NoResultsLayout}
      itemKeyfn={(park) => park.id}
      filterFunc={crossLangFilter}
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
