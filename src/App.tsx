import './App.css';
import { Map } from './components/Map';
import { ParksContextProvider } from './context/ParksContextProvider';

function App() {
  return (
    <ParksContextProvider>
      <div>
        <Map />
      </div>
    </ParksContextProvider>
  );
}

export default App;
