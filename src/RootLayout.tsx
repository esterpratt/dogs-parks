import { Outlet } from 'react-router';
import { NavbarTop } from './components/NavbarTop';
import { NavbarBottom } from './components/NavbarBottom';
import styles from './RootLayout.module.scss';
import { useCallback, useRef } from 'react';
import { useInputFocus } from './hooks/useInputFocus';

const RootLayout = () => {
  const ref = useRef<HTMLElement>(null);

  const onFocus = useCallback(() => {
    if (ref.current) {
      ref.current.style.display = 'none';
    }
  }, [ref]);

  const onBlur = useCallback(() => {
    if (ref.current) {
      ref.current.style.display = 'flex';
    }
  }, [ref]);

  useInputFocus(onFocus, onBlur);

  return (
    <>
      <NavbarTop />
      <div className={styles.appContent}>
        <Outlet />
      </div>
      <NavbarBottom ref={ref} />
    </>
  );
};

export { RootLayout };
