import { useContext, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { MoveLeft } from 'lucide-react';
import { PrevLinks } from '../components/PrevLinks';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/Button';
import { Loader } from '../components/Loader';
import { UserContext } from '../context/UserContext';
import {
  fetchDogOwnershipAction,
  respondToDogInvite,
  respondToDogOwnershipRequest,
  respondToPrimaryTransfer,
} from '../services/dog-ownership';
import { fetchDogPage } from '../services/dogs';
import { queryClient } from '../services/react-query';
import { DogOwnershipActionType } from '../types/dog-ownership';
import styles from './DogOwnership.module.scss';

const OwnershipAction = () => {
  const { actionId, actionType } = useParams();
  const { userId } = useContext(UserContext);
  const { t } = useTranslation();
  const [disclosureAccepted, setDisclosureAccepted] = useState(false);
  const [outcome, setOutcome] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const responseRef = useRef<HTMLElement>(null);
  const [responseHeight, setResponseHeight] = useState<number>();
  const normalizedType: DogOwnershipActionType =
    actionType === 'request'
      ? 'request'
      : actionType === 'transfer'
        ? 'transfer'
        : 'invite';
  const queryKey = ['dogOwnershipAction', normalizedType, actionId];

  const { data: action, isLoading } = useQuery({
    queryKey,
    queryFn: () => fetchDogOwnershipAction(normalizedType, actionId!),
    enabled: !!actionId,
  });
  const { data: dogPage, isLoading: isLoadingCapabilities } = useQuery({
    queryKey: ['dogPage', action?.dog_id],
    queryFn: () => fetchDogPage(action!.dog_id),
    enabled: !!action?.dog_id,
  });
  const capabilities = dogPage?.capabilities;
  const { mutate: respond, isPending } = useMutation({
    mutationFn: (approve: boolean) =>
      normalizedType === 'invite'
        ? respondToDogInvite(actionId!, approve, disclosureAccepted)
        : normalizedType === 'transfer'
          ? respondToPrimaryTransfer(actionId!, approve)
          : respondToDogOwnershipRequest(actionId!, approve),
    onSuccess: async (result) => {
      // The local result replaces the decision form immediately. Await the
      // refresh without briefly rendering old pending controls beside it.
      setOutcome(result.outcome);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey }),
        queryClient.invalidateQueries({
          queryKey: ['dogPage', action?.dog_id],
        }),
        queryClient.invalidateQueries({
          queryKey: ['dogOwnershipActions', action?.dog_id],
        }),
        queryClient.invalidateQueries({ queryKey: ['userDogs'] }),
      ]);
    },
    onError: () => setErrorMessage(t('dogOwnership.requestError')),
  });

  const handleRespond = (approve: boolean) => {
    // Preserve the measured card height even for long translations or small
    // screens, so replacing the form with its result does not move content.
    setResponseHeight(responseRef.current?.getBoundingClientRect().height);
    setErrorMessage('');
    respond(approve);
  };

  if (isLoading || isLoadingCapabilities) {
    return <Loader style={{ paddingTop: '64px' }} />;
  }
  if (!action) {
    return (
      <main className={styles.container}>
        <p>{t('dogOwnership.outcomes.NOT_FOUND')}</p>
      </main>
    );
  }
  if (!capabilities?.enabled) {
    return null;
  }

  const isPendingAction = action.status === 'PENDING';
  const hasResponded = [
    'ACCEPTED',
    'APPROVED',
    'DECLINED',
    'CANCELED',
    'EXPIRED',
    'NO_CHANGE',
  ].includes(outcome);
  const canRespond =
    normalizedType === 'invite'
      ? 'invitee_user_id' in action && action.invitee_user_id === userId
      : normalizedType === 'transfer'
        ? 'to_user_id' in action && action.to_user_id === userId
        : 'primary_user_id_at_creation' in action &&
          action.primary_user_id_at_creation === userId;

  return (
    <main className={styles.container}>
      <PrevLinks
        links={{
          to: `/dogs/${action.dog_id}`,
          icon: <MoveLeft size={16} />,
          text: t('dogOwnership.back'),
        }}
      />
      <h1 className={styles.pageTitle}>
        {t(`dogOwnership.${normalizedType}ResponseTitle`)}
      </h1>
      <section
        ref={responseRef}
        style={{ minHeight: responseHeight }}
        className={`${styles.section} ${styles.response}`}
        aria-busy={isPending}
      >
        <h2>{dogPage?.dog.name}</h2>
        {!isPendingAction || outcome ? (
          <p role="status">
            {t(`dogOwnership.outcomes.${outcome || action.status}`)}
          </p>
        ) : null}
        {isPendingAction && canRespond && !hasResponded ? (
          <div className={styles.actions}>
            <p className={styles.message}>
              {t(
                normalizedType === 'transfer'
                  ? 'dogOwnership.transferResponseHelp'
                  : 'dogOwnership.disclosure',
              )}
            </p>
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
              onClick={() => handleRespond(true)}
              type="button"
            >
              {t('dogOwnership.approve')}
            </Button>
            <Button
              disabled={isPending}
              onClick={() => handleRespond(false)}
              type="button"
              variant="secondary"
            >
              {t('dogOwnership.decline')}
            </Button>
          </div>
        ) : null}
        {errorMessage ? (
          <p role="alert" className={styles.error}>
            {errorMessage}
          </p>
        ) : null}
        {!isPendingAction || hasResponded ? (
          <Link className={styles.actionLink} to={`/dogs/${action.dog_id}`}>
            {t('dogOwnership.back')}
          </Link>
        ) : null}
      </section>
    </main>
  );
};

// Route changes between notification actions must start a fresh decision form.
const OwnershipActionRoute = () => {
  const { actionType, actionId } = useParams();
  return <OwnershipAction key={`${actionType}:${actionId}`} />;
};

export default OwnershipActionRoute;
