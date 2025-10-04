import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import classnames from 'classnames';
import { useQuery } from '@tanstack/react-query';
import { getWeatherInfo } from '../../utils/weather';
import styles from './WeatherButton.module.scss';
import { WeatherForecast } from '../../types/weather';
import { getWeatherForecast } from '../../services/weather';

interface WeatherButtonProps {
  lat: number;
  long: number;
}

const ONE_MINUTE = 60 * 1000;

const WeatherButton: React.FC<WeatherButtonProps> = ({ lat, long }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const { data: forecast } = useQuery<WeatherForecast | null>({
    queryKey: ['weather', lat, long],
    queryFn: () => getWeatherForecast({ latitude: lat, longitude: long }),
    staleTime: ONE_MINUTE,
    gcTime: ONE_MINUTE,
    refetchInterval: ONE_MINUTE,
  });

  if (!forecast) {
    return null;
  }

  // if (forecast.precipitationProbability <= 5) {
  //   return null;
  // }

  const { Icon, description, color, backgroundColor } = getWeatherInfo({
    code: forecast.weatherCode,
    t,
  });

  const onToggle = () => {
    setOpen((prev) => !prev);
  };

  return (
    <div
      className={styles.weatherButtonWrapper}
      style={
        {
          ['--weather-accent' as unknown as string]: color,
        } as React.CSSProperties
      }
    >
      <button
        type="button"
        aria-expanded={open}
        aria-label={t('weather.button.ariaLabel')}
        onClick={onToggle}
        className={styles.button}
      >
        <div
          className={styles.innerCircle}
          style={{ background: backgroundColor }}
        >
          <Icon size={28} color={color} />
        </div>
      </button>
      <div
        className={classnames(styles.content, { [styles.contentOpen]: open })}
        aria-hidden={!open}
      >
        <div className={styles.row}>
          <span>{Math.round(forecast.temperature)}°C</span>
          <span className={styles.dot} aria-hidden>
            •
          </span>
          <span>{description}</span>
        </div>
        <div className={styles.row}>
          <span>
            {t('weather.chanceOfRainNextHour', {
              count: forecast.precipitationProbability,
            })}
          </span>
        </div>
      </div>
    </div>
  );
};

export { WeatherButton };
