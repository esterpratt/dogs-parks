import { Outlet } from 'react-router';
import { Navbar } from './components/Navbar';

const RootLayout = () => {
  return (
    <>
      <Navbar />
      <div>
        <Outlet />
      </div>
    </>
  );
};

export { RootLayout };
