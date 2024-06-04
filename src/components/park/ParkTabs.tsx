import { useGetParkVisitors } from '../../hooks/api/useGetParkVisitors';
import { TabsList } from '../tabsCmps/TabsList';

interface ParkTabsProps {
  parkId: string;
}

const ParkTabs: React.FC<ParkTabsProps> = ({ parkId }) => {
  const { visitorsIds } = useGetParkVisitors(parkId);

  return (
    <TabsList
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
