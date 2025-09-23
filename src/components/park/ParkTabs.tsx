import { useGetParkVisitors } from '../../hooks/api/useGetParkVisitors';
import { TabsList } from '../tabs/TabsList';
import styles from './ParkTabs.module.scss';
import { useTranslation } from 'react-i18next';

interface ParkTabsProps {
  parkId: string;
}

const ParkTabs = (props: ParkTabsProps) => {
  const { parkId } = props;
  const { visitorsIds } = useGetParkVisitors(parkId);
  const { t } = useTranslation();

  return (
    <TabsList
      className={styles.tabs}
      tabs={[
        { text: t('parks.tabs.general'), url: '' },
        { text: t('parks.tabs.reviews'), url: 'Reviews' },
        {
          text: t('parks.tabs.visitors'),
          url: 'visitors',
          disabled: !visitorsIds.length,
        },
      ]}
    />
  );
};

export { ParkTabs };
