import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { BellOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { UserContext } from '../../context/UserContext';
import styles from './UnavailableNotificationTarget.module.scss';

interface UnavailableNotificationTargetProps {
  descriptionKey?: string;
  actionPath?: string;
  actionLabelKey?: string;
}

const UnavailableNotificationTarget = (
  props: UnavailableNotificationTargetProps,
) => {
  const {
    descriptionKey = 'notifications.unavailable.description',
    actionPath,
    actionLabelKey,
  } = props;
  const { userId } = useContext(UserContext);
  const { t } = useTranslation();
  // Event links return to Notifications; dog and ownership links retain their
  // existing My Pack destination unless a caller supplies another action.
  const defaultActionPath = userId
    ? `/profile/${userId}/dogs`
    : '/login?mode=login';
  const defaultActionLabelKey = userId
    ? 'userDogs.titleMyPack'
    : 'login.login';

  // Keep an explanation and an explicit way forward when a saved notification
  // outlives the dog or ownership action it originally referenced.
  return (
    <main className={styles.container}>
      <section className={styles.card}>
        <span className={styles.icon} aria-hidden="true">
          <BellOff size={28} />
        </span>
        <h1 className={styles.title}>{t('notifications.unavailable.title')}</h1>
        <p className={styles.description}>{t(descriptionKey)}</p>
        <Link
          className={styles.actionLink}
          to={actionPath ?? defaultActionPath}
        >
          {t(actionLabelKey ?? defaultActionLabelKey)}
        </Link>
      </section>
    </main>
  );
};

export { UnavailableNotificationTarget };
