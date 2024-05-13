import { useContext } from 'react';
import { Tabs } from '../tabs/Tabs';
import { ParkVisitorsContext } from '../../context/ParkVisitorsContext';

const ParkTabs = () => {
  const { visitors } = useContext(ParkVisitorsContext);
  return (
    <Tabs
      tabs={[
        { text: 'General Info', url: '' },
        { text: 'Reviews', url: 'Reviews' },
        {
          text: 'Visitors',
          url: 'visitors',
          disabled: !visitors.friends.length && !visitors.others.length,
        },
      ]}
    />
  );
};

export { ParkTabs };
