import { ReactNode } from 'react';
import { IconContext } from 'react-icons';
import classnames from 'classnames';
import styles from './ParkIcon.module.scss';

interface ParkIconProps {
  iconCmp: ReactNode;
  textCmp: ReactNode;
  iconClassName?: string;
}

const ParkIcon: React.FC<ParkIconProps> = ({
  iconCmp,
  textCmp,
  iconClassName,
}) => {
  return (
    <div className={styles.container}>
      <IconContext.Provider
        value={{
          className: classnames(styles.icon, iconClassName),
        }}
      >
        {iconCmp}
      </IconContext.Provider>
      {textCmp}
    </div>
  );
};

export { ParkIcon };
