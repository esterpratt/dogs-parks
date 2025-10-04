import {
  LucideIcon,
  Sun,
  CloudSun,
  Cloud,
  CloudFog,
  CloudRain,
  CloudLightning,
  Snowflake,
} from 'lucide-react';
import { WeatherCode } from '../types/weather';

interface WeatherInfo {
  description: string;
  Icon: LucideIcon;
  color: string;
  backgroundColor: string;
}

interface GetWeatherInfoParams {
  code: WeatherCode;
  t: (key: string) => string;
}

export const getWeatherInfo = ({
  code,
  t,
}: GetWeatherInfoParams): WeatherInfo => {
  const simplifiedCode = (() => {
    if (code === WeatherCode.CLEAR_SKY) return WeatherCode.CLEAR_SKY;
    if (code === WeatherCode.MAINLY_CLEAR) return WeatherCode.MAINLY_CLEAR;
    if ([WeatherCode.PARTLY_CLOUDY, WeatherCode.OVERCAST].includes(code))
      return WeatherCode.PARTLY_CLOUDY;
    if ([WeatherCode.FOG, WeatherCode.DEPOSITING_RIME_FOG].includes(code))
      return WeatherCode.FOG;
    if (
      [
        WeatherCode.LIGHT_DRIZZLE,
        WeatherCode.MODERATE_DRIZZLE,
        WeatherCode.SLIGHT_RAIN,
        WeatherCode.SLIGHT_RAIN_SHOWERS,
        WeatherCode.LIGHT_FREEZING_DRIZZLE,
        WeatherCode.LIGHT_FREEZING_RAIN,
      ].includes(code)
    )
      return WeatherCode.SLIGHT_RAIN;
    if (
      [
        WeatherCode.DENSE_DRIZZLE,
        WeatherCode.MODERATE_RAIN,
        WeatherCode.HEAVY_RAIN,
        WeatherCode.MODERATE_RAIN_SHOWERS,
        WeatherCode.VIOLENT_RAIN_SHOWERS,
        WeatherCode.DENSE_FREEZING_DRIZZLE,
        WeatherCode.HEAVY_FREEZING_RAIN,
      ].includes(code)
    )
      return WeatherCode.HEAVY_RAIN;
    if (
      [
        WeatherCode.THUNDERSTORM,
        WeatherCode.THUNDERSTORM_WITH_SLIGHT_HAIL,
        WeatherCode.THUNDERSTORM_WITH_HEAVY_HAIL,
      ].includes(code)
    )
      return WeatherCode.THUNDERSTORM;
    if (
      [
        WeatherCode.SLIGHT_SNOW,
        WeatherCode.MODERATE_SNOW,
        WeatherCode.HEAVY_SNOW,
        WeatherCode.SNOW_GRAINS,
        WeatherCode.SLIGHT_SNOW_SHOWERS,
        WeatherCode.HEAVY_SNOW_SHOWERS,
      ].includes(code)
    )
      return WeatherCode.SLIGHT_SNOW;

    return WeatherCode.PARTLY_CLOUDY;
  })();

  switch (simplifiedCode) {
    case WeatherCode.CLEAR_SKY:
      return {
        description: t('weather.descriptions.clearSky'),
        Icon: Sun,
        color: 'var(--weather-orange)',
        backgroundColor: 'var(--light-orange)',
      };
    case WeatherCode.MAINLY_CLEAR:
      return {
        description: t('weather.descriptions.mainlyClear'),
        Icon: CloudSun,
        color: 'var(--weather-orange)',
        backgroundColor: 'var(--light-orange)',
      };
    case WeatherCode.PARTLY_CLOUDY:
      return {
        description: t('weather.descriptions.cloudy'),
        Icon: Cloud,
        color: 'var(--weather-blue)',
        backgroundColor: 'var(--light-blue)',
      };
    case WeatherCode.FOG:
      return {
        description: t('weather.descriptions.foggy'),
        Icon: CloudFog,
        color: 'var(--weather-blue)',
        backgroundColor: 'var(--light-blue)',
      };
    case WeatherCode.SLIGHT_RAIN:
      return {
        description: t('weather.descriptions.lightRain'),
        Icon: CloudRain,
        color: 'var(--weather-blue)',
        backgroundColor: 'var(--light-blue)',
      };
    case WeatherCode.HEAVY_RAIN:
      return {
        description: t('weather.descriptions.heavyRain'),
        Icon: CloudRain,
        color: 'var(--weather-blue)',
        backgroundColor: 'var(--light-blue)',
      };
    case WeatherCode.THUNDERSTORM:
      return {
        description: t('weather.descriptions.thunderstorm'),
        Icon: CloudLightning,
        color: 'var(--weather-blue)',
        backgroundColor: 'var(--light-blue)',
      };
    case WeatherCode.SLIGHT_SNOW:
      return {
        description: t('weather.descriptions.snow'),
        Icon: Snowflake,
        color: 'var(--weather-blue)',
        backgroundColor: 'var(--light-blue)',
      };
    default:
      return {
        description: t('weather.descriptions.unknown'),
        Icon: Sun,
        color: 'var(--weather-orange)',
        backgroundColor: 'var(--light-orange)',
      };
  }
};
