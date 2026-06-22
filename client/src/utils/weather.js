const API_KEY = '71641a4da1c46edc4c0de0cdd483a405';
const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';

export async function getWeatherByCoords(lat, lon) {
  try {
    const response = await fetch(
      `${BASE_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
    );
    if (!response.ok) {
      throw new Error('Weather data not available');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return null;
  }
}

export async function getLocationName(lat, lon) {
  try {
    const response = await fetch(
      `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`
    );
    if (!response.ok) {
      throw new Error('Location data not available');
    }
    const data = await response.json();
    if (data && data.length > 0) {
      return data[0].name;
    }
    return 'Unknown Location';
  } catch (error) {
    console.error('Error fetching location name:', error);
    return 'Unknown Location';
  }
}

export function getWeatherIcon(iconCode) {
  return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
}
