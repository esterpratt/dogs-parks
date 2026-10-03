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
  cancelPrimaryTransfer,
  createDogInvite,
  fetchDogDeletionProposal,
  createPrimaryTransfer,
  fetchPendingDogInvites,
  fetchPendingDogOwnershipRequests,
  fetchPendingPrimaryTransfers,
  proposeDogDeletion,
} from '../services/dog-ownership';
import { fetchDogPage } from '../services/dogs';
import { queryClient } from '../services/react-query';
import { DeleteDogModal } from '../components/dog/DeleteDogModal';
import styles from './DogOwnership.module.scss';

const DogOwnership = () => {
  const { dogId } = useParams();
  const { t } = useTranslation();
  const { userId } = useContext(UserContext);
  const [resultMessage, setResultMessage] = useState('');
  const [isDeleteDogModalOpen, setIsDeleteDogModalOpen] = useState(false);
  const [selectedTransferMemberId, setSelectedTransferMemberId] = useState('');
  const inviteKeys = useRef(new Map<string, string>());
  const transferKey = useRef<string | null>(null);
  const deletionKey = useRef<string | null>(null);
  const { friends, isLoadingFriends } = useFetchFriends({ userId });
  const queryKey = ['dogOwnershipActions', dogId];

  const { data: dogPage, isLoading: isLoadingCapabilities } = useQuery({
    queryKey: ['dogPage', dogId],
    queryFn: () => fetchDogPage(dogId!),
    enabled: !!dogId,
  });
  const capabilities = dogPage?.capabilities;
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
  const members = dogPage?.members ?? [];
  const { data: transfers = [] } = useQuery({
    queryKey: [...queryKey, 'transfers'],
    queryFn: () => fetchPendingPrimaryTransfers(dogId!),
    enabled: capabilities?.role === 'PRIMARY_OWNER',
  });
  // Deletion controls are fetched only after server capabilities enable the
  // shared ownership surface for an authenticated current owner.
  const { data: deletionProposal } = useQuery({
    queryKey: [...queryKey, 'deletion'],
    queryFn: () => fetchDogDeletionProposal(dogId!),
    enabled: capabilities?.is_owner === true,
  });

  const refreshActions = () => {
    queryClient.invalidateQueries({ queryKey });
    queryClient.invalidateQueries({ queryKey: ['dogPage', dogId] });
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
  const { mutate: offerTransfer, isPending: isOfferingTransfer } = useMutation({
    mutationFn: (memberId: string) => {
      const idempotencyKey = transferKey.current ?? uuidv4();
      transferKey.current = idempotencyKey;
      return createPrimaryTransfer(dogId!, memberId, idempotencyKey);
    },
    onSuccess: (result) => {
      transferKey.current = null;
      setResultMessage(t(`dogOwnership.outcomes.${result.outcome}`));
      refreshActions();
    },
  });
  const { mutate: cancelTransfer } = useMutation({
    mutationFn: cancelPrimaryTransfer,
    onSuccess: refreshActions,
  });
  const { mutate: proposeDeletion, isPending: isProposingDeletion } =
    useMutation({
      mutationFn: () => {
        const idempotencyKey = deletionKey.current ?? uuidv4();
        deletionKey.current = idempotencyKey;
        return proposeDogDeletion(dogId!, idempotencyKey);
      },
      onSuccess: () => {
        deletionKey.current = null;
        refreshActions();
      },
    });

  if (isLoadingCapabilities || isLoadingFriends) {
    return <Loader style={{ paddingTop: '64px' }} />;
  }

  if (!dogPage || !capabilities) {
    return (
      <main className={styles.container}>
        <p>{t('dogOwnership.outcomes.DOG_UNAVAILABLE')}</p>
      </main>
    );
  }
  if (!dogPage.viewer.is_owner) {
    return (
      <main className={styles.container}>
        <p>{t('dogOwnership.outcomes.FORBIDDEN')}</p>
      </main>
    );
  }

  const invitedUserIds = new Set(
    invites.map((invite) => invite.invitee_user_id),
  );
  const eligibleFriends =
    friends?.filter((friend) => !invitedUserIds.has(friend.id)) ?? [];
  const eligibleTransferMembers = members.filter(
    (member) => member.role === 'CO_OWNER',
  );

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
          <h2>{t('dogOwnership.ownersTitle')}</h2>
          {members.map((member) => (
            <div className={styles.row} key={member.id}>
              <span>{member.user_name ?? member.user_id}</span>
              <span>{t(`dogOwnership.roles.${member.role}`)}</span>
            </div>
          ))}
        </section>

        {capabilities.enabled && capabilities.role === 'PRIMARY_OWNER' ? (
          <>
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
                <p className={styles.message}>
                  {t('dogOwnership.nonePending')}
                </p>
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
                <p className={styles.message}>
                  {t('dogOwnership.nonePending')}
                </p>
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

            <section className={styles.section}>
              <h2>{t('dogOwnership.transferTitle')}</h2>
              {transfers.length > 0 ? (
                transfers.map((transfer) => (
                  <div className={styles.row} key={transfer.id}>
                    <Link to={`/ownership-actions/transfer/${transfer.id}`}>
                      {t('dogOwnership.transferPending')}
                    </Link>
                    <Button
                      onClick={() => cancelTransfer(transfer.id)}
                      type="button"
                      variant="secondary"
                    >
                      {t('dogOwnership.cancel')}
                    </Button>
                  </div>
                ))
              ) : (
                <div className={styles.actions}>
                  <select
                    value={
                      selectedTransferMemberId ||
                      eligibleTransferMembers[0]?.id ||
                      ''
                    }
                    onChange={(event) =>
                      setSelectedTransferMemberId(event.target.value)
                    }
                  >
                    {eligibleTransferMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.user_name ?? member.user_id}
                      </option>
                    ))}
                  </select>
                  <Button
                    disabled={
                      isOfferingTransfer || eligibleTransferMembers.length === 0
                    }
                    onClick={() =>
                      offerTransfer(
                        selectedTransferMemberId ||
                          eligibleTransferMembers[0]?.id ||
                          '',
                      )
                    }
                    type="button"
                  >
                    {t('dogOwnership.transferAction')}
                  </Button>
                </div>
              )}
            </section>
          </>
        ) : null}

        {capabilities.enabled && capabilities.can_leave ? (
          <Link to={`/dogs/${dogId}/ownership/leave`}>
            {t('dogOwnership.leaveAction')}
          </Link>
        ) : null}

        {capabilities.enabled && (capabilities.active_owner_count ?? 0) > 1 ? (
          <section className={styles.section}>
            <h2>{t('dogOwnership.deletionTitle')}</h2>
            {deletionProposal ? (
              <Link
                to={`/dogs/${dogId}/ownership/deletion/${deletionProposal.id}`}
              >
                {t('dogOwnership.reviewDeletion')}
              </Link>
            ) : capabilities.role === 'PRIMARY_OWNER' ? (
              <Button
                disabled={isProposingDeletion}
                onClick={() => proposeDeletion()}
                type="button"
                variant="secondary"
              >
                {t('dogOwnership.proposeDeletion')}
              </Button>
            ) : (
              <p className={styles.message}>
                {t('dogOwnership.noDeletionProposal')}
              </p>
            )}
          </section>
        ) : null}

        {members.length === 1 && dogPage.viewer.role === 'PRIMARY_OWNER' ? (
          <section className={styles.section}>
            <h2>{t('settings.deleteDogButton', { name: dogPage.dog.name })}</h2>
            <Button
              onClick={() => setIsDeleteDogModalOpen(true)}
              type="button"
              variant="secondary"
            >
              {t('common.actions.delete')}
            </Button>
          </section>
        ) : null}
      </div>
      <DeleteDogModal
        dog={dogPage.dog}
        isOpen={isDeleteDogModalOpen}
        onClose={() => setIsDeleteDogModalOpen(false)}
      />
    </main>
  );
};

export default DogOwnership;
