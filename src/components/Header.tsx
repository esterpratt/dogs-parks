import classnames from 'classnames';
import { ReactNode } from 'react';
import styles from './Header.module.scss';

interface HeaderProps {
  size?: 'small' | 'medium' | 'large';
  containerClassName?: string;
  bottomClassName?: string;
  imgsClassName?: string;
  prevLinksCmp?: ReactNode | null;
  imgCmp: ReactNode;
  bottomCmp: ReactNode;
  children?: ReactNode;
}

const Header = (props: HeaderProps) => {
  const {
    size = 'medium',
    imgCmp,
    bottomCmp,
    prevLinksCmp,
    containerClassName,
    bottomClassName,
    imgsClassName,
    children,
  } = props;

  return (
    <div
      className={classnames(styles.header, styles[size], containerClassName)}
    >
      {!!prevLinksCmp && prevLinksCmp}
      <div className={classnames(styles.imgsContainer, imgsClassName)}>
        {imgCmp}
      </div>
      <div className={classnames(styles.bottom, bottomClassName)}>
        {bottomCmp}
      </div>
      {!!children && children}
    </div>
  );
};

export { Header };
