import { Outlet } from 'react-router';
import { Navbar } from './components/Navbar';
import styles from './RootLayout.module.scss';

const RootLayout = () => {
  return (
    <>
      <Navbar />
      <div className={styles.appContainer}>
        <Outlet />
      </div>
    </>
  );
};

export { RootLayout };
