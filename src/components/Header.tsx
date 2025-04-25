import classnames from 'classnames';
import { ReactNode } from 'react';
import styles from './Header.module.scss';

interface HeaderProps {
  containerClassName?: string;
  bottomClassName?: string;
  imgsClassName?: string;
  prevLinksCmp?: ReactNode | null;
  imgCmp: ReactNode;
  bottomCmp: ReactNode;
}

const Header = (props: HeaderProps) => {
  const {
    imgCmp,
    bottomCmp,
    prevLinksCmp,
    containerClassName,
    bottomClassName,
    imgsClassName,
  } = props;

  return (
    <div className={classnames(styles.header, containerClassName)}>
      {!!prevLinksCmp && <div className={styles.prevLinks}>{prevLinksCmp}</div>}
      <div className={classnames(styles.imgsContainer, imgsClassName)}>
        {imgCmp}
      </div>
      <div className={classnames(styles.bottom, bottomClassName)}>
        {bottomCmp}
      </div>
    </div>
  );
};

export { Header };
