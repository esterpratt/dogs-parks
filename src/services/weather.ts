import { WeatherForecast, WeatherResponse } from '../types/weather';

interface GetWeatherForecastProps {
  latitude: number;
  longitude: number;
  timezone?: string;
}

const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast';

/**
 * Fetches weather forecast for the next hour for a specific location
 */
export const getWeatherForecast = async ({
  latitude,
  longitude,
  timezone = 'auto',
}: GetWeatherForecastProps): Promise<WeatherForecast | null> => {
  try {
    // Get forecast for next 2 hours to ensure we have data for the current hour
    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      timezone,
      forecast_days: '1',
      hourly: 'temperature_2m,precipitation_probability,weathercode',
    });

    const response = await fetch(`${OPEN_METEO_URL}?${params}`);

    if (!response.ok) {
      throw new Error('Weather forecast request failed');
    }

    const data: WeatherResponse = await response.json();

    // Find the index of the current hour
    const now = new Date();
    const currentHourIndex = data.hourly.time.findIndex((time) => {
      const forecastTime = new Date(time);
      return forecastTime.getHours() === now.getHours();
    });

    if (currentHourIndex === -1) {
      throw new Error('Could not find current hour in forecast data');
    }

    // Return weather data for the current hour
    return {
      temperature: data.hourly.temperature_2m[currentHourIndex],
      precipitationProbability:
        data.hourly.precipitation_probability[currentHourIndex],
      weatherCode: data.hourly.weathercode[currentHourIndex],
      time: data.hourly.time[currentHourIndex],
    };
  } catch (error) {
    console.error('Error fetching weather forecast:', error);
    return null;
  }
};
