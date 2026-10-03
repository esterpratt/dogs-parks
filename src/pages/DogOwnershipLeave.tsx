import { useContext, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { MoveLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/Button';
import { Loader } from '../components/Loader';
import { UserContext } from '../context/UserContext';
import {
  leaveDogOwnership,
} from '../services/dog-ownership';
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
  const [resultMessage, setResultMessage] = useState('');
  const { data: dogPage, isLoading: isLoadingCapabilities } = useQuery({
    queryKey: ['dogPage', dogId],
    queryFn: () => fetchDogPage(dogId!),
    enabled: !!dogId,
  });
  const capabilities = dogPage?.capabilities;
  const members = dogPage?.members ?? [];
  const { mutate: leave, isPending } = useMutation({
    mutationFn: () =>
      leaveDogOwnership(
        dogId!,
        capabilities!.ownership_version!,
        capabilities?.role === 'PRIMARY_OWNER'
          ? selectedSuccessorId || eligibleSuccessors[0]?.id || null
          : null,
      ),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['dogPage', dogId] });
      queryClient.invalidateQueries({ queryKey: ['userDogs'] });
      if (result.outcome === 'LEFT') {
        navigate(`/dogs/${dogId}`, { replace: true });
        return;
      }
      setResultMessage(t(`dogOwnership.outcomes.${result.outcome}`));
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
    <main className={styles.container}>
      <div className={styles.header}>
        <Link
          to={`/dogs/${dogId}/ownership`}
          aria-label={t('dogOwnership.back')}
        >
          <MoveLeft size={20} />
        </Link>
        <h1>{t('dogOwnership.leaveTitle')}</h1>
      </div>
      <section className={styles.section}>
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
                  {member.user_name ?? member.user_id}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label className={styles.checkbox}>
          <input
            checked={confirmed}
            onChange={(event) => setConfirmed(event.target.checked)}
            type="checkbox"
          />
          <span>{t('dogOwnership.leaveConfirm')}</span>
        </label>
        <Button
          disabled={!confirmed || isPending}
          onClick={() => leave()}
          type="button"
        >
          {t('dogOwnership.leaveAction')}
        </Button>
        {resultMessage ? <p className={styles.error}>{resultMessage}</p> : null}
      </section>
    </main>
  );
};

export default DogOwnershipLeave;
