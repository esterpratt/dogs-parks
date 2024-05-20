import { Outlet } from 'react-router';
import { NavbarTop } from './components/NavbarTop';
import { NavbarBottom } from './components/NavbarBottom';
import styles from './RootLayout.module.scss';

const RootLayout = () => {
  return (
    <>
      <NavbarTop />
      <div className={styles.appContent}>
        <Outlet />
      </div>
      <NavbarBottom />
    </>
  );
};

export { RootLayout };
