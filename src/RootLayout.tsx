import { Outlet } from 'react-router-dom';
import { NavbarBottom } from './components/NavbarBottom';
import styles from './RootLayout.module.scss';
import { usePreventFocusOnScroll } from './hooks/usePreventFocusOnScroll';
import useKeyboardFix from './hooks/useKeyboardFix';
import classnames from 'classnames';
import { useSafeArea } from './hooks/useSafeArea';
import { usePrefetchRoutesOnIdle } from './hooks/usePrefetchRoutesOnIdle';
import { LocationPermissionModal } from './components/LocationPermissionModal';

const RootLayout = () => {
  usePreventFocusOnScroll();
  const keyboardHeight = useKeyboardFix();
  useSafeArea();

  // prefetch pages
  usePrefetchRoutesOnIdle(['profile', 'park', 'parks', 'users']);

  return (
    <>
      <div className={styles.appContent}>
        <Outlet />
        <div
          className={classnames(styles.keyboardHeightContainer, {
            [styles.withExtraHeight]: !!keyboardHeight,
          })}
          style={{ '--keyboard-height': `${keyboardHeight}px` }}
        />
      </div>
      <NavbarBottom />
      <LocationPermissionModal />
    </>
  );
};

export { RootLayout };
