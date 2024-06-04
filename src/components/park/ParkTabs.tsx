import { useGetParkVisitors } from '../../hooks/api/useGetParkVisitors';
import { Tabs } from '../tabs/Tabs';

interface ParkTabsProps {
  parkId: string;
}

const ParkTabs: React.FC<ParkTabsProps> = ({ parkId }) => {
  const { visitorsIds } = useGetParkVisitors(parkId);

  return (
    <Tabs
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
