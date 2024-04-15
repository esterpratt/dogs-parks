import { Map } from '../components/Map';
import { ParksContextProvider } from '../context/ParksContextProvider';

const Home: React.FC = () => {
  return (
    <ParksContextProvider>
      <Map />
    </ParksContextProvider>
  );
};

export { Home };
