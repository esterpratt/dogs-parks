import { useContext } from 'react';
import { Tabs } from '../tabs/Tabs';
import { ParkVisitorsContext } from '../../context/ParkVisitorsContext';

const ParkTabs = () => {
  const { friends, othersCount } = useContext(ParkVisitorsContext);

  return (
    <Tabs
      tabs={[
        { text: 'General Info', url: '' },
        { text: 'Reviews', url: 'Reviews' },
        {
          text: 'Visitors',
          url: 'visitors',
          disabled: !friends.length && !othersCount,
        },
      ]}
    />
  );
};

export { ParkTabs };
