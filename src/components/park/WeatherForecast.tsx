import { useQuery } from '@tanstack/react-query';
import { getWeatherForecast } from '../../services/weather';
import { getWeatherInfo } from '../../utils/weather';
import styles from './WeatherForecast.module.scss';

interface WeatherForecastProps {
  lat: number;
  long: number;
}

const ONE_MINUTE = 60 * 1000;

const WeatherForecast = (props: WeatherForecastProps) => {
  const { lat, long } = props;
  const { data: forecast } = useQuery({
    queryKey: ['weather', lat, long],
    queryFn: () => getWeatherForecast({ latitude: lat, longitude: long }),
    staleTime: ONE_MINUTE,
    gcTime: ONE_MINUTE,
    refetchInterval: ONE_MINUTE,
  });

  if (!forecast) {
    return null;
  }

  const { Icon, description, color, backgroundColor } = getWeatherInfo(
    forecast.weatherCode
  );

  return (
    <div className={styles.container}>
      <div
        className={styles.iconContainer}
        style={{
          border: `1px solid ${color}`,
          backgroundColor: backgroundColor,
        }}
      >
        <Icon size={28} color={color} />
      </div>
      <div className={styles.textContainer}>
        <div>
          {Math.round(forecast.temperature)}°C, {description.toLowerCase()}
        </div>
        <div>
          Rain is {forecast.precipitationProbability}% likely in the next hour
        </div>
      </div>
    </div>
  );
};

export { WeatherForecast };
