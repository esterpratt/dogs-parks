import classnames from 'classnames';
import { Trophy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import styles from './FavoriteRibbon.module.scss';

interface FavoriteRibbonProps {
  className?: string;
}

const FavoriteRibbon: React.FC<FavoriteRibbonProps> = ({ className }) => {
  const { t } = useTranslation();
  return (
    <div className={classnames(styles.favorite, className)}>
      <Trophy className={styles.ribbon} />
      <span>{t('parks.favorite.ribbon')}</span>
    </div>
  );
};

export { FavoriteRibbon };
