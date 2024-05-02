import { useContext } from 'react';
import { Outlet, useLoaderData } from 'react-router';
import { Park as ParkType } from '../types/park';
import { ParkCheckIn } from '../components/park/ParkCheckIn';
import { ReviewsPreview } from '../components/park/ReviewsPreview';
import { ParkVisitorsContextProvider } from '../context/ParkVisitorsContext';
import { UserContext } from '../context/UserContext';
import { FavoriteButton } from '../components/park/FavoriteButton';
import styles from './Park.module.scss';
import { Tabs } from '../components/Tabs/Tabs';

interface ParkData {
  park: ParkType;
  image: string;
}

const Park: React.FC = () => {
  const { park, image } = useLoaderData() as ParkData;
  const { user } = useContext(UserContext);

  return (
    <ParkVisitorsContextProvider parkId={park.id} userId={user?.id}>
      <img src={image} className={styles.image} />
      <div className={styles.contentContainer}>
        <div className={styles.basicDetails}>
          <div>
            <span className={styles.name}>{park.name}</span>
            <span className={styles.address}>{park.address}</span>
            <ReviewsPreview parkId={park.id} />
          </div>
          {user && (
            <div className={styles.userEngagement}>
              <div>
                <FavoriteButton parkId={park.id} userId={user.id} />
                <ParkCheckIn
                  parkId={park.id}
                  userId={user.id}
                  userName={user.name}
                />
              </div>
            </div>
          )}
        </div>
        <Tabs
          tabs={[
            { text: 'General Info', url: '' },
            { text: 'Reviews', url: 'Reviews' },
            { text: 'Visitors', url: 'visitors' },
          ]}
        />
        <div className={styles.outletContainer}>
          <Outlet context={park} />
        </div>
      </div>
    </ParkVisitorsContextProvider>
  );
};

export { Park };
