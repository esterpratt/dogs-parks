import { Link } from 'react-router-dom';
import { Button } from '../components/Button';
import { useTranslation } from 'react-i18next';
import styles from './PrivacyPolicy.module.scss';

const PrivacyPolicy = () => {
  const { t } = useTranslation();
  return (
    <div className={styles.wrapper}>
      <h1>{t('privacyPolicy.title')}</h1>
      <p>{t('privacyPolicy.lastUpdated')}</p>
      <div className={styles.section}>
        <h2>1. {t('privacyPolicy.introTitle')}</h2>
        <p>{t('privacyPolicy.intro')}</p>
      </div>
      <div className={styles.section}>
        <h2>2. {t('privacyPolicy.dataWeCollect.title')}</h2>
        <span>{t('privacyPolicy.dataWeCollect.lead')}</span>
        <h3>{t('privacyPolicy.dataWeCollect.personalTitle')}</h3>
        {(
          t('privacyPolicy.dataWeCollect.personalItems', {
            returnObjects: true,
          }) as unknown as string[]
        ).map((item, idx) => (
          <span key={`personal-${idx}`}>{item}</span>
        ))}
        <h3>{t('privacyPolicy.dataWeCollect.usageTitle')}</h3>
        <span>{t('privacyPolicy.dataWeCollect.usageDesc')}</span>
        <h3>{t('privacyPolicy.dataWeCollect.deviceTitle')}</h3>
        <span>{t('privacyPolicy.dataWeCollect.deviceDesc')}</span>
        <h3>{t('privacyPolicy.dataWeCollect.locationTitle')}</h3>
        <h3>{t('privacyPolicy.dataWeCollect.photosTitle')}</h3>
      </div>
      <div className={styles.section}>
        <h2>3. {t('privacyPolicy.usage.title')}</h2>
        <span>{t('privacyPolicy.usage.lead')}</span>
        <ul>
          {(
            t('privacyPolicy.usage.items', {
              returnObjects: true,
            }) as unknown as string[]
          ).map((item, idx) => (
            <li key={`usage-${idx}`}>{item}</li>
          ))}
        </ul>
      </div>
      <div className={styles.section}>
        <h2>4. {t('privacyPolicy.sharing.title')}</h2>
        <span>{t('privacyPolicy.sharing.lead')}</span>
        <ul>
          {(
            t('privacyPolicy.sharing.items', {
              returnObjects: true,
            }) as unknown as string[]
          ).map((item, idx) => (
            <li key={`share-${idx}`}>{item}</li>
          ))}
        </ul>
      </div>
      <div className={styles.section}>
        <h2>5. {t('privacyPolicy.security.title')}</h2>
        <p>{t('privacyPolicy.security.desc')}</p>
      </div>
      <div className={styles.section}>
        <h2>6. {t('privacyPolicy.delete.title')}</h2>
        <span>
          {t('privacyPolicy.delete.desc')}{' '}
          <Button variant="simple" className={styles.button}>
            <Link to="/delete-account">
              {t('privacyPolicy.delete.linkText')}.
            </Link>
          </Button>
        </span>
        <span>{t('privacyPolicy.privateOption')}</span>
      </div>
      <div className={styles.section}>
        <h2>7. {t('privacyPolicy.children.title')}</h2>
        <p>{t('privacyPolicy.children.desc')}</p>
      </div>
      <div className={styles.section}>
        <h2>8. {t('privacyPolicy.thirdParties.title')}</h2>
        <p>{t('privacyPolicy.thirdParties.desc')}</p>
        <ul>
          {(
            t('privacyPolicy.thirdParties.links', {
              returnObjects: true,
            }) as unknown as string[]
          ).map((item, idx) => (
            <li key={`link-${idx}`}>{item}</li>
          ))}
        </ul>
      </div>
      <div className={styles.section}>
        <h2>9. {t('privacyPolicy.changes.title')}</h2>
        <p>{t('privacyPolicy.changes.desc')}</p>
      </div>
      <div className={styles.section}>
        <h2>10. {t('privacyPolicy.contact.title')}</h2>
        <p>
          {t('privacyPolicy.contact.desc')}{' '}
          <a href="mailto:esterpratt@gmail.com">
            <Button variant="simple" className={styles.button}>
              esterpratt@gmail.com
            </Button>
          </a>
        </p>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
