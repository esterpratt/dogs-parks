import { Link } from 'react-router-dom';
import { Button } from '../components/Button';
import { useTranslation } from 'react-i18next';
import styles from './About.module.scss';

const MAIL = 'esterpratt@gmail.com';

const About = () => {
  const { t } = useTranslation();
  return (
    <div className={styles.container}>
      <div>
        <h3>{t('about.welcomeTitle')}</h3>
        <span>{t('about.welcomeBody')}</span>
      </div>
      <div>
        <h2>{t('about.helpTitle')}</h2>
        <span>
          {t('about.helpBody')}{' '}
          <Link to={`mailto:${MAIL}`}>
            <Button className={styles.button} variant="simple">
              {MAIL}.
            </Button>
          </Link>
        </span>
      </div>
      <div>
        <Link to="/privacy-policy">
          <Button variant="simple" className={styles.button}>
            {t('about.privacyCta')}
          </Button>
        </Link>
      </div>
      <div>
        <span>{t('about.earlyBody')}</span>
      </div>
      <div>
        <span>{t('about.thankYou')}</span>
      </div>
      <div>
        <span>{t('about.createdBy')} </span>
        <Link to="https://github.com/esterpratt">
          <Button className={styles.button} variant="simple">
            {t('about.createdByName')}
          </Button>
        </Link>
      </div>

      <div>
        <span>{t('about.inspiredByTitle')} </span>
        {t('about.inspiredByBody')}
      </div>
      <div>
        <span>{t('about.specialThanks')}</span>
      </div>
    </div>
  );
};

export default About;
