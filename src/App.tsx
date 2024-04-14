import './App.scss';
import { Map } from './components/Map';
import { ParksContextProvider } from './context/ParksContextProvider';

const App = () => {
  return (
    <ParksContextProvider>
      <div>
        <Map />
      </div>
    </ParksContextProvider>
  );
};

export default App;
