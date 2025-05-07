import { useGetParkVisitors } from '../../hooks/api/useGetParkVisitors';
import { TabsList } from '../tabs/TabsList';
import styles from './ParkTabs.module.scss';

interface ParkTabsProps {
  parkId: string;
}

const ParkTabs = (props: ParkTabsProps) => {
  const { parkId } = props;
  const { visitorsIds } = useGetParkVisitors(parkId);

  return (
    <TabsList
      className={styles.tabs}
      tabs={[
        { text: 'General Info', url: '' },
        { text: 'Reviews', url: 'Reviews' },
        {
          text: 'Visitors',
          url: 'visitors',
          disabled: !visitorsIds.length,
        },
      ]}
    />
  );
};

export { ParkTabs };
