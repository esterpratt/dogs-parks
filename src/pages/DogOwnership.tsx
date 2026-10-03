import { useContext, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { MoveLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '../components/Button';
import { Loader } from '../components/Loader';
import { UserContext } from '../context/UserContext';
import { useFetchFriends } from '../hooks/api/useFetchFriends';
import {
  cancelDogInvite,
  createDogInvite,
  fetchDogOwnershipCapabilities,
  fetchPendingDogInvites,
  fetchPendingDogOwnershipRequests,
} from '../services/dog-ownership';
import { queryClient } from '../services/react-query';
import styles from './DogOwnership.module.scss';

const DogOwnership = () => {
  const { dogId } = useParams();
  const { t } = useTranslation();
  const { userId } = useContext(UserContext);
  const [resultMessage, setResultMessage] = useState('');
  const inviteKeys = useRef(new Map<string, string>());
  const { friends, isLoadingFriends } = useFetchFriends({ userId });
  const queryKey = ['dogOwnershipActions', dogId];

  const { data: capabilities, isLoading: isLoadingCapabilities } = useQuery({
    queryKey: ['dogOwnershipCapabilities', dogId],
    queryFn: () => fetchDogOwnershipCapabilities(dogId!),
    enabled: !!dogId,
  });
  const { data: invites = [] } = useQuery({
    queryKey: [...queryKey, 'invites'],
    queryFn: () => fetchPendingDogInvites(dogId!),
    enabled: capabilities?.role === 'PRIMARY_OWNER',
  });
  const { data: requests = [] } = useQuery({
    queryKey: [...queryKey, 'requests'],
    queryFn: () => fetchPendingDogOwnershipRequests(dogId!),
    enabled: capabilities?.role === 'PRIMARY_OWNER',
  });

  const refreshActions = () => {
    queryClient.invalidateQueries({ queryKey });
    queryClient.invalidateQueries({
      queryKey: ['dogOwnershipCapabilities', dogId],
    });
  };
  const { mutate: inviteFriend, isPending: isInviting } = useMutation({
    mutationFn: (friendId: string) => {
      const idempotencyKey = inviteKeys.current.get(friendId) ?? uuidv4();
      inviteKeys.current.set(friendId, idempotencyKey);
      return createDogInvite(dogId!, friendId, idempotencyKey);
    },
    onSuccess: (result, friendId) => {
      // A confirmed response ends this retry window; a later invite is a new action.
      inviteKeys.current.delete(friendId);
      setResultMessage(t(`dogOwnership.outcomes.${result.outcome}`));
      refreshActions();
    },
  });
  const { mutate: cancelInvite } = useMutation({
    mutationFn: cancelDogInvite,
    onSuccess: refreshActions,
  });

  if (isLoadingCapabilities || isLoadingFriends) {
    return <Loader style={{ paddingTop: '64px' }} />;
  }

  if (!capabilities?.enabled || capabilities.role !== 'PRIMARY_OWNER') {
    return null;
  }

  const invitedUserIds = new Set(
    invites.map((invite) => invite.invitee_user_id),
  );
  const eligibleFriends =
    friends?.filter((friend) => !invitedUserIds.has(friend.id)) ?? [];

  return (
    <main className={styles.container}>
      <div className={styles.header}>
        <Link to={`/dogs/${dogId}`} aria-label={t('dogOwnership.back')}>
          <MoveLeft size={20} />
        </Link>
        <h1>{t('dogOwnership.manageTitle')}</h1>
      </div>
      <div className={styles.content}>
        <section className={styles.section}>
          <h2>{t('dogOwnership.inviteTitle')}</h2>
          {eligibleFriends.length === 0 ? (
            <p className={styles.message}>
              {t('dogOwnership.noEligibleFriends')}
            </p>
          ) : (
            <div className={styles.list}>
              {eligibleFriends.map((friend) => (
                <div className={styles.row} key={friend.id}>
                  <span>{friend.name}</span>
                  <Button
                    disabled={isInviting}
                    onClick={() => inviteFriend(friend.id)}
                    type="button"
                  >
                    {t('dogOwnership.invite')}
                  </Button>
                </div>
              ))}
            </div>
          )}
          {resultMessage ? (
            <p className={styles.message}>{resultMessage}</p>
          ) : null}
        </section>

        <section className={styles.section}>
          <h2>{t('dogOwnership.pendingInvites')}</h2>
          {invites.length === 0 ? (
            <p className={styles.message}>{t('dogOwnership.nonePending')}</p>
          ) : (
            invites.map((invite) => (
              <div className={styles.row} key={invite.id}>
                <span>{invite.invitee_user_id}</span>
                <Button
                  onClick={() => cancelInvite(invite.id)}
                  type="button"
                  variant="secondary"
                >
                  {t('dogOwnership.cancel')}
                </Button>
              </div>
            ))
          )}
        </section>

        <section className={styles.section}>
          <h2>{t('dogOwnership.pendingRequests')}</h2>
          {requests.length === 0 ? (
            <p className={styles.message}>{t('dogOwnership.nonePending')}</p>
          ) : (
            requests.map((request) => (
              <Link
                key={request.id}
                to={`/ownership-actions/request/${request.id}`}
              >
                {t('dogOwnership.reviewRequest')}
              </Link>
            ))
          )}
        </section>
      </div>
    </main>
  );
};

export default DogOwnership;
