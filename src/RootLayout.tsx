import { Outlet } from 'react-router';
import { NavbarTop } from './components/NavbarTop';
import { NavbarBottom } from './components/NavbarBottom';
import styles from './RootLayout.module.scss';
import { usePreventScrollOnFocus } from './hooks/usePreventScrollOnFocus';

const RootLayout = () => {
  usePreventScrollOnFocus();

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
