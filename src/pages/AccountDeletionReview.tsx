import { useContext, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { MoveLeft, Trash2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/Button';
import { Loader } from '../components/Loader';
import { TopModal } from '../components/modals/TopModal';
import { UserContext } from '../context/UserContext';
import { fetchAccountDeletionReview } from '../services/account-deletion';
import { getSuccessorSelections } from '../utils/accountDeletion';
import styles from './AccountDeletionReview.module.scss';

const AccountDeletionReview = () => {
  const { userDeletion, userId } = useContext(UserContext);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successorSelections, setSuccessorSelections] = useState<
    Record<string, string>
  >({});
  const {
    data: reviewItems = [],
    isError: isReviewError,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['accountDeletionReview', userId],
    queryFn: () => fetchAccountDeletionReview(userId!),
    enabled: !!userId,
  });

  const getSelectedSuccessor = (
    dogId: string,
    defaultMemberId: string | null
  ) => successorSelections[dogId] ?? defaultMemberId ?? '';

  const onDeleteAccount = async () => {
    setIsDeleting(true);
    setErrorMessage('');

    const reviewWithSelections = reviewItems.map((item) => ({
      ...item,
      selectedSuccessorMemberId: getSelectedSuccessor(
        item.dogId,
        item.selectedSuccessorMemberId
      ),
    }));

    try {
      const result = await userDeletion(
        getSuccessorSelections(reviewWithSelections)
      );
      navigate('/user-deleted', {
        replace: true,
        state: {
          cleanupPending: result.outcome === 'DELETED_WITH_CLEANUP_PENDING',
          recoveryReference: result.recoveryReference,
          userDeleted: true,
        },
      });
    } catch {
      // Preparation failures happen before Auth deletion and remain safe to retry.
      setIsDeleting(false);
      setIsConfirmationOpen(false);
      setErrorMessage(t('settings.accountDeletion.retryError'));
    }
  };

  if (isLoading) {
    return <Loader style={{ paddingTop: '64px' }} />;
  }

  if (isReviewError) {
    return (
      <main className={styles.container}>
        <p className={styles.error} role="alert">
          {t('settings.accountDeletion.loadError')}
        </p>
        <Button onClick={() => refetch()} type="button">
          {t('settings.accountDeletion.retry')}
        </Button>
      </main>
    );
  }

  return (
    <main className={styles.container}>
      <div className={styles.header}>
        <Link
          to={`/profile/${userId}/settings`}
          aria-label={t('settings.accountDeletion.back')}
        >
          <MoveLeft size={20} />
        </Link>
        <h1>{t('settings.accountDeletion.title')}</h1>
      </div>

      <section className={styles.intro}>
        <p>{t('settings.accountDeletion.intro')}</p>
        {reviewItems.length === 0 ? (
          <p>{t('settings.accountDeletion.noDogs')}</p>
        ) : null}
      </section>

      {reviewItems.map((item) => (
        <section className={styles.dogCard} key={item.dogId}>
          <h2>{item.dogName}</h2>
          <p>
            {t(`settings.accountDeletion.effects.${item.effect}`, {
              name: item.dogName,
            })}
          </p>
          {item.effect === 'TRANSFER_SHARED_DOG' ? (
            <label className={styles.field}>
              <span>{t('settings.accountDeletion.successorLabel')}</span>
              <select
                value={getSelectedSuccessor(
                  item.dogId,
                  item.selectedSuccessorMemberId
                )}
                onChange={(event) =>
                  setSuccessorSelections((currentSelections) => ({
                    ...currentSelections,
                    [item.dogId]: event.target.value,
                  }))
                }
              >
                {item.eligibleSuccessors.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.user_name ?? member.user_id}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </section>
      ))}

      <p className={styles.warning}>{t('settings.accountDeletion.warning')}</p>
      <Button
        className={styles.deleteButton}
        color={styles.red}
        onClick={() => setIsConfirmationOpen(true)}
        type="button"
        variant="secondary"
      >
        <Trash2 size={18} />
        {t('settings.accountDeletion.deleteAction')}
      </Button>
      {errorMessage ? (
        <p className={styles.error} role="alert">
          {errorMessage}
        </p>
      ) : null}

      <TopModal
        className={styles.confirmationModal}
        onClose={() => setIsConfirmationOpen(false)}
        open={isConfirmationOpen}
      >
        <h2>{t('settings.accountDeletion.confirmTitle')}</h2>
        <p>{t('settings.accountDeletion.confirmBody')}</p>
        <div className={styles.modalActions}>
          <Button disabled={isDeleting} onClick={onDeleteAccount} type="button">
            <Trash2 size={16} />
            {t('settings.delete')}
          </Button>
          <Button
            disabled={isDeleting}
            onClick={() => setIsConfirmationOpen(false)}
            type="button"
            variant="secondary"
          >
            <X size={16} />
            {t('settings.cancel')}
          </Button>
        </div>
      </TopModal>
    </main>
  );
};

export default AccountDeletionReview;
