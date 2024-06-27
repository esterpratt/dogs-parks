import classnames from 'classnames';
import { useGetParkVisitors } from '../../hooks/api/useGetParkVisitors';
import { TabsList } from '../tabs/TabsList';
import styles from './ParkTabs.module.scss';

interface ParkTabsProps {
  parkId: string;
  className?: string;
}

const ParkTabs: React.FC<ParkTabsProps> = ({ parkId, className }) => {
  const { visitorsIds } = useGetParkVisitors(parkId);

  return (
    <TabsList
      className={classnames(styles.tabs, className)}
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
