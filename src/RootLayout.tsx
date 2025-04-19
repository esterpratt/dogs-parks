import { Outlet } from 'react-router';
import { NavbarBottom } from './components/NavbarBottom';
import styles from './RootLayout.module.scss';
import { usePreventFocusOnScroll } from './hooks/usePreventFocusOnScroll';
import useKeyboardFix from './hooks/useKeyboardFix';
import classnames from 'classnames';
import { useSafeArea } from './hooks/useSafeArea';

const RootLayout = () => {
  usePreventFocusOnScroll();
  const keyboardHeight = useKeyboardFix();
  useSafeArea();

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
    </>
  );
};

export { RootLayout };
