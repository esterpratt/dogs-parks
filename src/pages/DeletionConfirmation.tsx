import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/Button';
import { ACCOUNT_DELETION_RECOVERY_REFERENCE_KEY } from '../utils/consts';
import styles from './DeletionConfirmation.module.scss';

const DeletionConfirmation: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { t } = useTranslation();
  const storedDeletion = localStorage.getItem('userDeleted') === '1';
  const storedRecoveryReference = localStorage.getItem(
    ACCOUNT_DELETION_RECOVERY_REFERENCE_KEY
  );
  const recoveryReference = state?.recoveryReference ?? storedRecoveryReference;
  const cleanupPending = state?.cleanupPending || !!recoveryReference;

  useEffect(() => {
    localStorage.removeItem('userDeleted');
    localStorage.removeItem(ACCOUNT_DELETION_RECOVERY_REFERENCE_KEY);
  }, []);

  useEffect(() => {
    if (!state?.userDeleted && !storedDeletion) {
      navigate('/', { replace: true });
    }
  }, [state, navigate, storedDeletion]);

  return (
    <div className={styles.content}>
      <span>{t('deletionConfirmation.confirmation1')}</span>
      <span>{t('deletionConfirmation.confirmation2')}</span>
      {cleanupPending ? (
        <div>
          <strong>{t('deletionConfirmation.cleanupPendingTitle')}</strong>
          <p>{t('deletionConfirmation.cleanupPendingBody')}</p>
          <p>
            {t('deletionConfirmation.recoveryReference', {
              reference: recoveryReference,
            })}
          </p>
          <a href="mailto:esterpratt@gmail.com">esterpratt@gmail.com</a>
        </div>
      ) : null}
      <Link to="/">
        <Button>{t('deletionConfirmation.goHome')}</Button>
      </Link>
    </div>
  );
};

export default DeletionConfirmation;
