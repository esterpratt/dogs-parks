import { useContext, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { MoveLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/Button';
import { Loader } from '../components/Loader';
import { UserContext } from '../context/UserContext';
import {
  fetchDogOwnershipAction,
  respondToDogInvite,
  respondToDogOwnershipRequest,
} from '../services/dog-ownership';
import { DogOwnershipActionType } from '../types/dog-ownership';
import styles from './DogOwnership.module.scss';

const OwnershipAction = () => {
  const { actionId, actionType } = useParams();
  const { userId } = useContext(UserContext);
  const { t } = useTranslation();
  const [disclosureAccepted, setDisclosureAccepted] = useState(false);
  const [outcome, setOutcome] = useState('');
  const normalizedType: DogOwnershipActionType =
    actionType === 'request' ? 'request' : 'invite';
  const queryKey = ['dogOwnershipAction', normalizedType, actionId];

  const {
    data: action,
    isLoading,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () => fetchDogOwnershipAction(normalizedType, actionId!),
    enabled: !!actionId,
  });
  const { mutate: respond, isPending } = useMutation({
    mutationFn: (approve: boolean) =>
      normalizedType === 'invite'
        ? respondToDogInvite(actionId!, approve, disclosureAccepted)
        : respondToDogOwnershipRequest(actionId!, approve),
    onSuccess: (result) => {
      setOutcome(result.outcome);
      refetch();
    },
  });

  if (isLoading) {
    return <Loader style={{ paddingTop: '64px' }} />;
  }
  if (!action) {
    return null;
  }

  const isPendingAction = action.status === 'PENDING';
  const canRespond =
    normalizedType === 'invite'
      ? 'invitee_user_id' in action && action.invitee_user_id === userId
      : 'primary_user_id_at_creation' in action &&
        action.primary_user_id_at_creation === userId;

  return (
    <main className={styles.container}>
      <div className={styles.header}>
        <Link to={`/dogs/${action.dog_id}`} aria-label={t('dogOwnership.back')}>
          <MoveLeft size={20} />
        </Link>
        <h1>{t(`dogOwnership.${normalizedType}ResponseTitle`)}</h1>
      </div>
      <section className={styles.section}>
        {!isPendingAction || outcome ? (
          <p>{t(`dogOwnership.outcomes.${outcome || action.status}`)}</p>
        ) : null}
        {isPendingAction && canRespond ? (
          <div className={styles.actions}>
            {normalizedType === 'invite' ? (
              <label className={styles.checkbox}>
                <input
                  checked={disclosureAccepted}
                  onChange={(event) =>
                    setDisclosureAccepted(event.target.checked)
                  }
                  type="checkbox"
                />
                <span>{t('dogOwnership.disclosureAccept')}</span>
              </label>
            ) : null}
            <Button
              disabled={
                isPending ||
                (normalizedType === 'invite' && !disclosureAccepted)
              }
              onClick={() => respond(true)}
              type="button"
            >
              {t('dogOwnership.approve')}
            </Button>
            <Button
              disabled={isPending}
              onClick={() => respond(false)}
              type="button"
              variant="secondary"
            >
              {t('dogOwnership.decline')}
            </Button>
          </div>
        ) : null}
      </section>
    </main>
  );
};

export default OwnershipAction;
