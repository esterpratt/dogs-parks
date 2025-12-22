import { Suspense } from 'react';
import { Await, useLoaderData } from 'react-router-dom';

import { Loader } from '../components/Loader';
import type { ProfileLoaderData } from '../loaders/userLoader';
import { ProfileResolved } from './ProfileResolved';

const Profile: React.FC = () => {
  const { profile } = useLoaderData() as ProfileLoaderData;

  return (
    <Suspense fallback={<Loader style={{ paddingTop: '64px' }} />}>
      <Await resolve={profile}>
        {(resolvedProfile) => (
          <ProfileResolved
            user={resolvedProfile.user}
            dogs={resolvedProfile.dogs}
          />
        )}
      </Await>
    </Suspense>
  );
};

export default Profile;
