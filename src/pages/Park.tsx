import { useContext } from 'react';
import { useLoaderData } from 'react-router';
import { Park as ParkType } from '../types/park';
import { ParkGallery } from '../components/park/ParkGallery';
import { ParkCheckIn } from '../components/park/ParkCheckIn';
import { BusyHours } from '../components/park/BusyHours';
import { ParkVisitors } from '../components/park/ParkVisitors';
import { ReviewsPreview } from '../components/park/ReviewsPreview';
import { ParkDetails } from '../components/park/ParkDetails';
import { ParkVisitorsContextProvider } from '../components/park/ParkVisitorsContext';
import { Accordion } from '../components/Accordion';
import { AccordionTitle } from '../components/AccordionTitle';
import { AccordionContent } from '../components/AccordionContent';
import { UserContext } from '../context/UserContext';
import { FavoriteButton } from '../components/park/FavoriteButton';
import styles from './Park.module.scss';

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
        <Accordion>
          <AccordionTitle>More about this park</AccordionTitle>
          <AccordionContent>
            <ParkDetails
              size={park.size}
              ground={park.materials}
              shade={park.hasShade}
              water={park.hasWater}
            />
          </AccordionContent>
        </Accordion>
        <Accordion>
          <AccordionTitle>Busy hours</AccordionTitle>
          <AccordionContent>
            <BusyHours parkId={park.id} />
          </AccordionContent>
        </Accordion>
        <Accordion>
          <AccordionTitle>Gallery</AccordionTitle>
          <AccordionContent>
            <ParkGallery parkId={park.id} />
          </AccordionContent>
        </Accordion>
        <Accordion>
          <AccordionTitle>Visiting the park right now</AccordionTitle>
          <AccordionContent>
            <ParkVisitors parkId={park.id} />
          </AccordionContent>
        </Accordion>
        <Accordion>
          <AccordionTitle>Reviews</AccordionTitle>
          <AccordionContent>Reviews</AccordionContent>
        </Accordion>
      </div>
    </ParkVisitorsContextProvider>
  );
};

export { Park };
