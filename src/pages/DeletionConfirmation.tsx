import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/Button';
import styles from './DeletionConfirmation.module.scss';

const DeletionConfirmation: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { t } = useTranslation();

  useEffect(() => {
    localStorage.removeItem('userDeleted');
  }, []);

  useEffect(() => {
    if (!state?.userDeleted) {
      navigate('/', { replace: true });
    }
  }, [state, navigate]);

  return (
    <div className={styles.content}>
      <span>{t('deletionConfirmation.confirmation1')}</span>
      <span>{t('deletionConfirmation.confirmation2')}</span>
      <Link to="/">
        <Button>{t('deletionConfirmation.goHome')}</Button>
      </Link>
    </div>
  );
};

export default DeletionConfirmation;
