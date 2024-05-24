import { Tabs } from '../tabs/Tabs';
import { useParkVisitors } from '../../hooks/api/useParkVisitors';

interface ParkTabsProps {
  parkId: string;
}

const ParkTabs: React.FC<ParkTabsProps> = ({ parkId }) => {
  const { visitorsIds } = useParkVisitors(parkId);

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
