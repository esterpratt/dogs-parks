import { Outlet } from 'react-router-dom';
import { NavbarBottom } from './components/NavbarBottom';
import styles from './RootLayout.module.scss';
import { usePreventFocusOnScroll } from './hooks/usePreventFocusOnScroll';
import useKeyboardFix from './hooks/useKeyboardFix';
import classnames from 'classnames';
import { useSafeArea } from './hooks/useSafeArea';
import { usePrefetchRoutesOnIdle } from './hooks/usePrefetchRoutesOnIdle';
import { LocationPermissionModal } from './components/LocationPermissionModal';
import { isIos } from './utils/platform';
import { useKeyboardPreFocus } from './hooks/useKeyboardPreFocus';
import { useUrlHandler } from './hooks/useUrlHandler';
import { useThemeMode } from './hooks/useThemeMode';
import { usePushNotifications } from './hooks/usePushNotifications';
import { useNotificationsRealtime } from './hooks/api/useNotificationsRealtime';

const RootLayout = () => {
  useUrlHandler();
  usePreventFocusOnScroll();
  useThemeMode();
  usePushNotifications();
  useNotificationsRealtime();
  const keyboardHeight = useKeyboardFix();
  useSafeArea();
  const safeAreaAddition = !isIos()
    ? 'var(--safe-area-inset-bottom, 0px)'
    : '14px';

  // warms up the keyboard pre-focus to avoid a delay when the keyboard is opened for the first time
  useKeyboardPreFocus();

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
          style={{
            '--keyboard-height': `calc(${keyboardHeight}px + ${safeAreaAddition})`,
          }}
        />
      </div>
      <NavbarBottom />
      <LocationPermissionModal />
    </>
  );
};

export { RootLayout };
