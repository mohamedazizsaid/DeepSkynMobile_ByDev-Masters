import apiClient from './api-client';

let Location: any = null;

// Try to import expo-location, but handle gracefully if not available
try {
  Location = require('expo-location');
} catch (e) {
  console.warn('expo-location not available');
}

export interface WeatherData {
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
  temperature: number;
  feelsLike: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  pressure: number;
  uvIndex: number;
  sunrise: string;
  sunset: string;
  cloudCover: number;
  weatherCode: number;
  precipitation?: number;
  visibility?: number;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
}

export interface AIAdviceResponse {
  advice: string;
  emoji: string;
  urgency: 'low' | 'medium' | 'high';
}

const WMO_CODES: { [key: number]: { condition: string; icon: string; description: string } } = {
  0: { condition: 'clear', icon: '☀️', description: 'Dégagé' },
  1: { condition: 'mostly_clear', icon: '🌤️', description: 'Presque dégagé' },
  2: { condition: 'partly_cloudy', icon: '⛅', description: 'Partiellement nuageux' },
  3: { condition: 'overcast', icon: '☁️', description: 'Couvert' },
  45: { condition: 'foggy', icon: '🌫️', description: 'Brouillard' },
  61: { condition: 'light_rain', icon: '🌧️', description: 'Pluie légère' },
  63: { condition: 'moderate_rain', icon: '🌧️', description: 'Pluie modérée' },
  65: { condition: 'heavy_rain', icon: '⛈️', description: 'Pluie intense' },
  95: { condition: 'thunderstorm', icon: '⛈️', description: 'Orage' },
};

export const getLocation = async (): Promise<LocationData> => {
  try {
    if (!Location) {
      throw new Error('Location module not available');
    }
    
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.warn('Location permission denied');
      return { latitude: 36.8065, longitude: 10.1657, city: 'Tunis', country: 'Tunisia' };
    }

    const location = await Location.getCurrentPositionAsync({});
    const [geocode] = await Location.reverseGeocodeAsync({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      city: geocode?.city || geocode?.region,
      country: geocode?.country,
    };
  } catch (error) {
    console.error('Location error:', error);
    return { latitude: 36.8065, longitude: 10.1657, city: 'Tunis', country: 'Tunisia' };
  }
};

export const getWeatherData = async (latitude: number, longitude: number, city?: string, country?: string): Promise<WeatherData> => {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,pressure_msl,cloud_cover,uv_index&daily=sunrise,sunset&temperature_unit=celsius&wind_speed_unit=kmh&timezone=auto`;

    const response = await fetch(url);
    if (!response.ok) throw new Error('Weather API error');

    const data = await response.json();
    const current = data.current;
    const daily = data.daily;

    const weatherInfo = WMO_CODES[current.weather_code] || { condition: 'unknown', icon: '🌐', description: 'Inconnu' };

    return {
      latitude,
      longitude,
      city,
      country,
      temperature: current.temperature_2m,
      feelsLike: current.apparent_temperature,
      condition: weatherInfo.condition,
      humidity: current.relative_humidity_2m,
      windSpeed: current.wind_speed_10m,
      pressure: current.pressure_msl,
      uvIndex: current.uv_index,
      sunrise: daily.sunrise[0],
      sunset: daily.sunset[0],
      cloudCover: current.cloud_cover,
      weatherCode: current.weather_code,
      precipitation: 0,
      visibility: 10,
    };
  } catch (error) {
    console.error('Weather data fetch error:', error);
    throw error;
  }
};

export const getWeatherAdvice = async (weatherData: WeatherData): Promise<AIAdviceResponse> => {
  try {
    const response = await apiClient.post('/api/weather/advice', {
      temperature: weatherData.temperature,
      condition: weatherData.condition,
      humidity: weatherData.humidity,
      uvIndex: weatherData.uvIndex,
      city: weatherData.city || 'Votre localisation',
    });
    return response.data;
  } catch (error) {
    console.error('Weather advice error:', error);
    return {
      advice: `À ${weatherData.city || 'votre localisation'}, il fait ${Math.round(weatherData.temperature)}°C.`,
      emoji: '🌍',
      urgency: 'low',
    };
  }
};

export const fetchCompleteWeatherData = async (): Promise<{ weather: WeatherData; advice: AIAdviceResponse }> => {
  const location = await getLocation();
  const weather = await getWeatherData(location.latitude, location.longitude, location.city, location.country);
  const advice = await getWeatherAdvice(weather);
  return { weather, advice };
};
