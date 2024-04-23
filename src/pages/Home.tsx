import { Map } from '../components/parks/Map';
import { ParksList } from '../components/parks/ParksList';
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
