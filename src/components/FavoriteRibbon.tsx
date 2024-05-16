import { IconContext } from 'react-icons';
import { IoRibbonSharp } from 'react-icons/io5';
import classnames from 'classnames';
import styles from './FavoriteRibbon.module.scss';

interface FavoriteRibbonProps {
  className?: string;
}

const FavoriteRibbon: React.FC<FavoriteRibbonProps> = ({ className }) => {
  return (
    <div className={classnames(styles.favorite, className)}>
      <IconContext.Provider value={{ className: styles.ribbon }}>
        <IoRibbonSharp />
      </IconContext.Provider>
      <span>Favorite Park!</span>
    </div>
  );
};

export { FavoriteRibbon };
