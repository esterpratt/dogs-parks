export interface WeatherResponse {
  latitude: number;
  longitude: number;
  elevation: number;
  generationtime_ms: number;
  utc_offset_seconds: number;
  timezone: string;
  timezone_abbreviation: string;
  hourly: {
    time: string[];
    temperature_2m: number[];
    precipitation_probability: number[];
    weathercode: number[];
  };
  hourly_units: {
    temperature_2m: string;
    precipitation_probability: string;
    weathercode: string;
  };
}

export interface WeatherForecast {
  temperature: number;
  precipitationProbability: number;
  weatherCode: number;
  time: string;
}

// Simplified weather codes, but we keep all WMO codes for API compatibility
export enum WeatherCode {
  // Our simplified categories
  CLEAR_SKY = 0,
  MAINLY_CLEAR = 1,
  PARTLY_CLOUDY = 2,
  FOG = 45,
  SLIGHT_RAIN = 61,
  HEAVY_RAIN = 65,
  THUNDERSTORM = 95,
  SLIGHT_SNOW = 71,

  // Keep the rest for API mapping
  OVERCAST = 3,
  DEPOSITING_RIME_FOG = 48,
  LIGHT_DRIZZLE = 51,
  MODERATE_DRIZZLE = 53,
  DENSE_DRIZZLE = 55,
  LIGHT_FREEZING_DRIZZLE = 56,
  DENSE_FREEZING_DRIZZLE = 57,
  MODERATE_RAIN = 63,
  LIGHT_FREEZING_RAIN = 66,
  HEAVY_FREEZING_RAIN = 67,
  MODERATE_SNOW = 73,
  HEAVY_SNOW = 75,
  SNOW_GRAINS = 77,
  SLIGHT_RAIN_SHOWERS = 80,
  MODERATE_RAIN_SHOWERS = 81,
  VIOLENT_RAIN_SHOWERS = 82,
  SLIGHT_SNOW_SHOWERS = 85,
  HEAVY_SNOW_SHOWERS = 86,
  THUNDERSTORM_WITH_SLIGHT_HAIL = 96,
  THUNDERSTORM_WITH_HEAVY_HAIL = 99
}
