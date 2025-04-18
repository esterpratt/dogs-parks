import classnames from 'classnames';
import styles from './FavoriteRibbon.module.scss';
import { Trophy } from 'lucide-react';

interface FavoriteRibbonProps {
  className?: string;
}

const FavoriteRibbon: React.FC<FavoriteRibbonProps> = ({ className }) => {
  return (
    <div className={classnames(styles.favorite, className)}>
      <Trophy className={styles.ribbon} />
      <span>Favorite Park!</span>
    </div>
  );
};

export { FavoriteRibbon };
