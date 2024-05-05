import { Tabs } from '../Tabs/Tabs';

const ProfileTabs = () => {
  return (
    <Tabs
      tabs={[
        { text: 'Info', url: '' },
        { text: 'Friends', url: 'friends' },
        {
          text: 'My Reviews',
          url: 'reviews',
        },
      ]}
    />
  );
};

export { ProfileTabs };
