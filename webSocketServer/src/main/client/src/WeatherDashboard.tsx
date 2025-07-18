import React, { useEffect, useState } from 'react';
// import './WeatherDashboard.css';

interface Coordinates {
    lat: number;
    lon: number;
}

interface Temperature {
    celsius: number;
    fahrenheit: number;
}

interface WindSpeed {
    kph: number;
    mph: number;
}

interface WeatherData {
    city: string;
    condition: string;
    coordinates: Coordinates;
    temperature: Temperature;
    humidity: number;
    wind_speed: WindSpeed;
    pressure: number;
    timestamp: string;
}

interface Prediction {
    temperature: Temperature;
    condition: string;
}

interface WeatherResponse {
    current_weather: WeatherData[];
    predictions: Prediction[];
}

const getWeatherEmoji = (condition: string): string => {
    const emojiMap: Record<string, string> = {
        'Sunny': '☀️',
        'Partly Cloudy': '⛅',
        'Cloudy': '☁️',
        'Rain': '🌧️',
        'Thunderstorm': '⛈️',
        'Clear': '🌤️',
        'Overcast': '☁️',
        'Light Rain': '🌦️'
    };
    return emojiMap[condition] || '🌡️';
};

const WeatherDashboard: React.FC = () => {
    const [weatherData, setWeatherData] = useState<WeatherResponse | null>(null);
    const [connected, setConnected] = useState<boolean>(false);
    const [reconnectAttempts, setReconnectAttempts] = useState<number>(0);

    useEffect(() => {
        let ws: WebSocket;
        let reconnectTimeout: NodeJS.Timeout;
        const maxReconnectAttempts = 5;

        const connect = () => {
            ws = new WebSocket('ws://localhost:8000/ws');

            ws.onopen = () => {
                let pingInterval: NodeJS.Timeout;

                ws.onopen = () => {
                    // ...your existing code...
                    pingInterval = setInterval(() => {
                        ws.send('ping');
                    }, 10000); // every 10 seconds
                };

// In your cleanup function (in the return of useEffect):
                return () => {
                    ws?.close();
                    clearTimeout(reconnectTimeout);
                    clearInterval(pingInterval); // add this line
                };
            };

            ws.onmessage = (event) => {
                const data = JSON.parse(event.data) as WeatherResponse;
                setWeatherData(data);
            };

            ws.onclose = () => {
                console.log('Disconnected from weather service');
                setConnected(false);
                if (reconnectAttempts < maxReconnectAttempts) {
                    const attempts = reconnectAttempts + 1;
                    setReconnectAttempts(attempts);
                    console.log(`Reconnecting attempt ${attempts}/${maxReconnectAttempts}...`);
                    reconnectTimeout = setTimeout(connect, 5000);
                }
            };

            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };
        };

        connect();

        return () => {
            ws?.close();
            clearTimeout(reconnectTimeout);
        };
    }, [reconnectAttempts]);

    return (
        <div>
            <header className="header">
                <h1>Weather Dashboard</h1>
                <div className={`connection-status ${connected ? 'connected' : 'disconnected'}`}>
                    <span className="status-indicator"></span>
                    <span>{connected ? 'Connected' : 'Disconnected'}</span>
                </div>
            </header>

            <div className="weather-grid">
                {weatherData?.current_weather.map((weather, index) => {
                    const prediction = weatherData.predictions[index];
                    return (
                        <div key={index} className="weather-card">
                            <div className="city-name">
                                <span>{weather.city} {getWeatherEmoji(weather.condition)}</span>
                                <span className="coordinates">
                                    {weather.coordinates.lat.toFixed(2)}°, {weather.coordinates.lon.toFixed(2)}°
                                </span>
                            </div>

                            <div className="weather-info">
                                <span>Temperature</span>
                                <span>{weather.temperature.celsius}°C / {weather.temperature.fahrenheit}°F</span>
                            </div>

                            <div className="weather-info">
                                <span>Condition</span>
                                <span>{weather.condition}</span>
                            </div>

                            <div className="weather-info">
                                <span>Humidity</span>
                                <span>{weather.humidity}%</span>
                            </div>

                            <div className="weather-info">
                                <span>Wind Speed</span>
                                <span>{weather.wind_speed.kph} km/h ({weather.wind_speed.mph} mph)</span>
                            </div>

                            <div className="weather-info">
                                <span>Pressure</span>
                                <span>{weather.pressure} hPa</span>
                            </div>

                            <div className="prediction-section">
                                <div className="prediction-title">Prediction (in 5s)</div>
                                <div className="weather-info">
                                    <span>Temperature</span>
                                    <span>{prediction.temperature.celsius}°C / {prediction.temperature.fahrenheit}°F</span>
                                </div>
                                <div className="weather-info">
                                    <span>Condition</span>
                                    <span>{prediction.condition} {getWeatherEmoji(prediction.condition)}</span>
                                </div>
                            </div>

                            <div className="timestamp">
                                Last updated: {new Date(weather.timestamp).toLocaleTimeString()}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default WeatherDashboard;
