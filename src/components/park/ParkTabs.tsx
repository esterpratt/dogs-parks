import { Tabs } from '../tabs/Tabs';
import { useParkVisitors } from '../../hooks/useParkVisitors';

interface ParkTabsProps {
  parkId: string;
}

const ParkTabs: React.FC<ParkTabsProps> = ({ parkId }) => {
  const { visitorIds } = useParkVisitors(parkId);

  return (
    <Tabs
      tabs={[
        { text: 'General Info', url: '' },
        { text: 'Reviews', url: 'Reviews' },
        {
          text: 'Visitors',
          url: 'visitors',
          disabled: !visitorIds.length,
        },
      ]}
    />
  );
};

export { ParkTabs };
