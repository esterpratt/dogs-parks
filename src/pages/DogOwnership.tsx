import { useContext, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link, Outlet, useParams } from 'react-router-dom';
import {
  UserRound,
  UserPlus,
  ArrowRightLeft,
  LogOut,
  Trash2,
} from 'lucide-react';
import { OwnershipModal } from '../components/dog/OwnershipModal';
import { useConfirm } from '../context/ConfirmModalContext';
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
  const { showModal } = useConfirm();
  const [activeModal, setActiveModal] = useState<'invite' | 'transfer' | null>(
    null,
  );
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
  const { data: invites = [], isLoading: isLoadingInvites } = useQuery({
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

  // Await cache refreshes so controls cannot reappear between server states.
  const refreshActions = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey }),
      queryClient.invalidateQueries({ queryKey: ['dogPage', dogId] }),
    ]);
  const { mutate: inviteFriend, isPending: isInviting } = useMutation({
    onError: () => setResultMessage(t('dogOwnership.requestError')),
    mutationFn: (friendId: string) => {
      const idempotencyKey = inviteKeys.current.get(friendId) ?? uuidv4();
      inviteKeys.current.set(friendId, idempotencyKey);
      return createDogInvite(dogId!, friendId, idempotencyKey);
    },
    onSuccess: (result, friendId) => {
      // A confirmed response ends this retry window; a later invite is a new action.
      inviteKeys.current.delete(friendId);
      setResultMessage(t(`dogOwnership.outcomes.${result.outcome}`));
      return refreshActions();
    },
  });
  const { mutate: cancelInvite, isPending: isCancelingInvite } = useMutation({
    onError: () => setResultMessage(t('dogOwnership.requestError')),
    mutationFn: cancelDogInvite,
    onSuccess: refreshActions,
  });
  const { mutate: offerTransfer, isPending: isOfferingTransfer } = useMutation({
    onError: () => setResultMessage(t('dogOwnership.requestError')),
    mutationFn: (memberId: string) => {
      const idempotencyKey = transferKey.current ?? uuidv4();
      transferKey.current = idempotencyKey;
      return createPrimaryTransfer(dogId!, memberId, idempotencyKey);
    },
    onSuccess: (result) => {
      transferKey.current = null;
      setResultMessage(t(`dogOwnership.outcomes.${result.outcome}`));
      if (result.outcome === 'CREATED') {
        setActiveModal(null);
      }
      return refreshActions();
    },
  });
  const { mutate: cancelTransfer, isPending: isCancelingTransfer } =
    useMutation({
      onError: () => setResultMessage(t('dogOwnership.requestError')),
      mutationFn: cancelPrimaryTransfer,
      onSuccess: refreshActions,
    });
  const { mutateAsync: proposeDeletion, isPending: isProposingDeletion } =
    useMutation({
      onError: () => setResultMessage(t('dogOwnership.requestError')),
      mutationFn: () => {
        const idempotencyKey = deletionKey.current ?? uuidv4();
        deletionKey.current = idempotencyKey;
        return proposeDogDeletion(dogId!, idempotencyKey);
      },
      onSuccess: () => {
        deletionKey.current = null;
        return refreshActions();
      },
    });

  if (isLoadingCapabilities) {
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
  // Existing co-owners remain friends but are already part of this dog; avoid
  // offering invitations that the server would correctly reject as duplicates.
  const ownerUserIds = new Set(members.map((member) => member.user_id));
  const eligibleFriends =
    friends?.filter(
      (friend) =>
        !invitedUserIds.has(friend.id) && !ownerUserIds.has(friend.id),
    ) ?? [];
  const eligibleTransferMembers = members.filter(
    (member) => member.role === 'CO_OWNER',
  );

  const openModal = (modal: 'invite' | 'transfer') => {
    setResultMessage('');
    setActiveModal(modal);
  };
  const friendName = (friendId: string) =>
    friends?.find((friend) => friend.id === friendId)?.name ??
    t('dogOwnership.memberFallback');

  return (
    <div className={styles.content}>
      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <h2>{t('dogOwnership.ownersTitle')}</h2>
          <span className={styles.count} dir="ltr">
            {members.length} / 8
          </span>
        </div>
        {/* Display the primary owner first without changing succession order. */}
        {[...members]
          .sort(
            (first, second) =>
              Number(second.role === 'PRIMARY_OWNER') -
              Number(first.role === 'PRIMARY_OWNER'),
          )
          .map((member) => (
            <div className={styles.row} key={member.id}>
              <span className={styles.person}>
                <UserRound className={styles.avatar} size={36} />
                {member.user_name ?? t('dogOwnership.memberFallback')}
              </span>
              <span className={styles.role}>
                {t(`dogOwnership.roles.${member.role}`)}
              </span>
            </div>
          ))}
        {capabilities.enabled && capabilities.role === 'PRIMARY_OWNER' ? (
          <Button
            variant="secondary"
            onClick={() => openModal('invite')}
            disabled={!capabilities.can_invite}
          >
            <UserPlus size={18} /> {t('dogOwnership.inviteTitle')}
          </Button>
        ) : null}
      </section>

      {capabilities.enabled && capabilities.role === 'PRIMARY_OWNER' ? (
        <>
          {/* Empty administrative sections stay out of the everyday profile. */}
          {invites.length > 0 ? (
            <section className={styles.section}>
              <h2>{t('dogOwnership.pendingInvites')}</h2>
              {invites.map((invite) => (
                <div className={styles.row} key={invite.id}>
                  <span>{friendName(invite.invitee_user_id)}</span>
                  <Button
                    disabled={isCancelingInvite}
                    onClick={() => cancelInvite(invite.id)}
                    type="button"
                    variant="simple"
                  >
                    {t('dogOwnership.cancel')}
                  </Button>
                </div>
              ))}
            </section>
          ) : null}
          {requests.length > 0 ? (
            <section className={styles.section}>
              <h2>{t('dogOwnership.pendingRequests')}</h2>
              {requests.map((request) => (
                <Link
                  className={styles.actionLink}
                  key={request.id}
                  to={`/ownership-actions/request/${request.id}`}
                >
                  <span>{friendName(request.requester_user_id)}</span>
                  <span>{t('dogOwnership.reviewRequest')}</span>
                </Link>
              ))}
            </section>
          ) : null}
          {transfers.length > 0 ? (
            <section className={styles.section}>
              {transfers.map((transfer) => (
                <div className={styles.row} key={transfer.id}>
                  <Link
                    className={styles.actionLink}
                    to={`/ownership-actions/transfer/${transfer.id}`}
                  >
                    {t('dogOwnership.transferPending')}
                  </Link>
                  <Button
                    disabled={isCancelingTransfer}
                    onClick={() => cancelTransfer(transfer.id)}
                    variant="simple"
                  >
                    {t('dogOwnership.cancel')}
                  </Button>
                </div>
              ))}
            </section>
          ) : null}
        </>
      ) : null}

      <div className={styles.secondaryActions}>
        {capabilities.enabled &&
        capabilities.role === 'PRIMARY_OWNER' &&
        eligibleTransferMembers.length > 0 &&
        transfers.length === 0 ? (
          <Button
            variant="simple"
            onClick={() => openModal('transfer')}
            disabled={!capabilities.can_transfer}
          >
            <ArrowRightLeft size={18} /> {t('dogOwnership.transferTitle')}
          </Button>
        ) : null}
        {capabilities.enabled && capabilities.can_leave ? (
          <Link
            className={styles.actionLink}
            to={`/dogs/${dogId}/ownership/leave`}
          >
            <LogOut size={18} /> {t('dogOwnership.leaveAction')}
          </Link>
        ) : null}
        {capabilities.enabled && (capabilities.active_owner_count ?? 0) > 1 ? (
          deletionProposal ? (
            <Link
              className={styles.actionLink}
              to={`/dogs/${dogId}/ownership/deletion/${deletionProposal.id}`}
            >
              <Trash2 size={18} /> {t('dogOwnership.reviewDeletion')}
            </Link>
          ) : capabilities.role === 'PRIMARY_OWNER' ? (
            <Button
              variant="simple"
              className={styles.danger}
              disabled={isProposingDeletion}
              onClick={() =>
                showModal({
                  title: t('dogOwnership.deletionWarning'),
                  confirmText: t('dogOwnership.proposeDeletion'),
                  onConfirm: async () => {
                    await proposeDeletion();
                  },
                })
              }
            >
              <Trash2 size={18} /> {t('dogOwnership.proposeDeletion')}
            </Button>
          ) : null
        ) : null}
        {members.length === 1 && dogPage.viewer.role === 'PRIMARY_OWNER' ? (
          <Button
            variant="simple"
            className={styles.danger}
            onClick={() => setIsDeleteDogModalOpen(true)}
          >
            <Trash2 size={18} />{' '}
            {t('settings.deleteDogButton', { name: dogPage.dog.name })}
          </Button>
        ) : null}
      </div>
      {resultMessage && !activeModal ? (
        <p role="status" className={styles.message}>
          {resultMessage}
        </p>
      ) : null}

      {activeModal === 'invite' ? (
        <OwnershipModal
          title={t('dogOwnership.inviteTitle')}
          onClose={() => setActiveModal(null)}
          isPending={isInviting}
        >
          <p className={styles.message}>{t('dogOwnership.disclosure')}</p>
          {isLoadingFriends || isLoadingInvites ? (
            <Loader inside />
          ) : eligibleFriends.length === 0 ? (
            <p>{t('dogOwnership.noEligibleFriends')}</p>
          ) : (
            eligibleFriends.map((friend) => (
              <div className={styles.row} key={friend.id}>
                <span>{friend.name}</span>
                <Button
                  disabled={isInviting || !capabilities.can_invite}
                  onClick={() => inviteFriend(friend.id)}
                >
                  {t('dogOwnership.invite')}
                </Button>
              </div>
            ))
          )}
          <p className={styles.status} role="status">
            {resultMessage}
          </p>
        </OwnershipModal>
      ) : null}
      {activeModal === 'transfer' ? (
        <OwnershipModal
          title={t('dogOwnership.transferTitle')}
          onClose={() => setActiveModal(null)}
          isPending={isOfferingTransfer}
        >
          <p className={styles.message}>{t('dogOwnership.transferHelp')}</p>
          <label className={styles.field}>
            <span>{t('dogOwnership.successorLabel')}</span>
            <select
              value={
                selectedTransferMemberId || eligibleTransferMembers[0]?.id || ''
              }
              onChange={(event) =>
                setSelectedTransferMemberId(event.target.value)
              }
            >
              {eligibleTransferMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.user_name ?? t('dogOwnership.memberFallback')}
                </option>
              ))}
            </select>
          </label>
          <Button
            disabled={
              isOfferingTransfer ||
              !capabilities.can_transfer ||
              eligibleTransferMembers.length === 0
            }
            onClick={() =>
              offerTransfer(
                selectedTransferMemberId ||
                  eligibleTransferMembers[0]?.id ||
                  '',
              )
            }
          >
            {t('dogOwnership.transferAction')}
          </Button>
          <p className={styles.status} role="status">
            {resultMessage}
          </p>
        </OwnershipModal>
      ) : null}
      <DeleteDogModal
        dog={dogPage.dog}
        isOpen={isDeleteDogModalOpen}
        onClose={() => setIsDeleteDogModalOpen(false)}
      />
      <Outlet />
    </div>
  );
};

export default DogOwnership;
