import { WeatherData } from '@/types';

export async function getWeather(location: string, apiKey: string, unit: 'celsius' | 'fahrenheit' = 'fahrenheit'): Promise<WeatherData> {
  const units = unit === 'celsius' ? 'metric' : 'imperial';
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${apiKey}&units=${units}`;

  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Weather fetch failed: ${res.status}`);
  }

  const data = await res.json();
  const temp = Math.round(data.main.temp);
  const feelsLike = Math.round(data.main.feels_like);
  const condition = data.weather[0].main as string;
  const description = data.weather[0].description as string;

  const rainyConditions = ['Rain', 'Drizzle', 'Thunderstorm', 'Snow'];
  const coldThreshold = unit === 'celsius' ? 10 : 50;
  const hotThreshold = unit === 'celsius' ? 27 : 80;

  return {
    temperature: temp,
    feelsLike,
    condition,
    description,
    humidity: data.main.humidity,
    windSpeed: Math.round(data.wind.speed),
    city: data.name,
    country: data.sys.country,
    icon: data.weather[0].icon,
    isRaining: rainyConditions.includes(condition),
    isCold: temp < coldThreshold,
    isHot: temp > hotThreshold,
  };
}
