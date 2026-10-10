import { useContext, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { OwnershipModal } from '../components/dog/OwnershipModal';
import { useTranslation } from 'react-i18next';
import { Checkbox } from '../components/inputs/Checkbox';
import { useNotification } from '../context/NotificationContext';
import { Loader } from '../components/Loader';
import { UserContext } from '../context/UserContext';
import { leaveDogOwnership } from '../services/dog-ownership';
import { fetchDogPage } from '../services/dogs';
import { queryClient } from '../services/react-query';
import styles from './DogOwnership.module.scss';

const DogOwnershipLeave = () => {
  const { dogId } = useParams();
  const { userId } = useContext(UserContext);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [confirmed, setConfirmed] = useState(false);
  const [selectedSuccessorId, setSelectedSuccessorId] = useState('');
  const { notify } = useNotification();
  const { data: dogPage, isLoading: isLoadingCapabilities } = useQuery({
    queryKey: ['dogPage', dogId],
    queryFn: () => fetchDogPage(dogId!),
    enabled: !!dogId,
  });
  const capabilities = dogPage?.capabilities;
  const members = dogPage?.members ?? [];
  const { mutate: leave, isPending } = useMutation({
    onError: () => notify(t('dogOwnership.requestError'), true),
    mutationFn: () =>
      leaveDogOwnership(
        dogId!,
        capabilities!.ownership_version!,
        capabilities?.role === 'PRIMARY_OWNER'
          ? selectedSuccessorId || eligibleSuccessors[0]?.id || null
          : null,
      ),
    onSuccess: (result) => {
      notify(
        t(`dogOwnership.outcomes.${result.outcome}`),
        result.outcome !== 'LEFT',
      );
      queryClient.invalidateQueries({ queryKey: ['dogPage', dogId] });
      queryClient.invalidateQueries({ queryKey: ['userDogs'] });
      if (result.outcome === 'LEFT') {
        navigate(`/dogs/${dogId}`, { replace: true });
        return;
      }
    },
  });
  const eligibleSuccessors = members.filter(
    (member) => member.role === 'CO_OWNER' && member.user_id !== userId,
  );

  if (isLoadingCapabilities) {
    return <Loader style={{ paddingTop: '64px' }} />;
  }
  if (!dogPage) {
    return (
      <main className={styles.container}>
        <p>{t('dogOwnership.outcomes.DOG_UNAVAILABLE')}</p>
      </main>
    );
  }
  if (
    !capabilities?.enabled ||
    !capabilities.can_leave ||
    capabilities.ownership_version === undefined
  ) {
    return null;
  }

  return (
    <OwnershipModal
      title={t('dogOwnership.leaveTitle')}
      onClose={() => navigate(`/dogs/${dogId}/ownership`, { replace: true })}
      isPending={isPending}
      onSave={() => leave()}
      saveText={t('dogOwnership.leaveAction')}
      disabled={!confirmed}
    >
      <>
        <p>{t('dogOwnership.leaveWarning')}</p>
        {capabilities.role === 'PRIMARY_OWNER' ? (
          <label className={styles.field}>
            <span>{t('dogOwnership.successorLabel')}</span>
            <select
              value={selectedSuccessorId || eligibleSuccessors[0]?.id || ''}
              onChange={(event) => setSelectedSuccessorId(event.target.value)}
            >
              {eligibleSuccessors.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.user_name ?? t('dogOwnership.memberFallback')}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <Checkbox
          id="ownership-leave-confirm"
          isChecked={confirmed}
          onChange={() => setConfirmed(!confirmed)}
          label={t('dogOwnership.leaveConfirm')}
        />
      </>
    </OwnershipModal>
  );
};

export default DogOwnershipLeave;
