import { Await, useLoaderData } from 'react-router-dom';
import { Suspense } from 'react';
import { Loader } from '../components/Loader';
import { Park as ParkType } from '../types/park';
import { ParkResolved } from './ParkResolved';

const Park: React.FC = () => {
  const { park } = useLoaderData() as { park: Promise<ParkType> };

  return (
    <Suspense fallback={<Loader />}>
      <Await resolve={park}>
        {(resolvedPark) => <ParkResolved park={resolvedPark} />}
      </Await>
    </Suspense>
  );
};

export { Park };
