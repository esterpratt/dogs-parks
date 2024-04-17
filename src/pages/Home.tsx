import { Map } from '../components/Map';
import { ParksList } from '../components/ParksList';
import { ParksContextProvider } from '../context/ParksContextProvider';

const Home: React.FC = () => {
  return (
    <ParksContextProvider>
      <Map />
      <ParksList />
    </ParksContextProvider>
  );
};

export { Home };
