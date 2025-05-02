import classnames from 'classnames';
import { Trophy } from 'lucide-react';
import styles from './FavoriteRibbon.module.scss';

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
