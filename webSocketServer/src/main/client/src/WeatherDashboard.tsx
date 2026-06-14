import React, { useEffect, useState } from 'react';

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
    city: string;
    temperature: Temperature;
    condition: string;
}

interface WeatherResponse {
    timestamp?: string;
    generated_by?: string;
    current_weather: WeatherData[];
    predictions: Prediction[];
}

const MAX_RECONNECT_ATTEMPTS = 5;
const WEATHER_SOCKET_URL = import.meta.env.VITE_WEATHER_SOCKET_URL ?? 'ws://localhost:8000/ws';

const formatTemperature = (value: number) => `${value.toFixed(1)} C`;
const formatTimestamp = (value?: string) => {
    if (!value) {
        return 'Waiting for first update';
    }

    return new Date(value).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
};

const getTemperatureBand = (temperature: number) => {
    if (temperature >= 30) {
        return 'hot';
    }

    if (temperature >= 24) {
        return 'warm';
    }

    if (temperature >= 16) {
        return 'mild';
    }

    return 'cool';
};

const WeatherDashboard: React.FC = () => {
    const [weatherData, setWeatherData] = useState<WeatherResponse | null>(null);
    const [connected, setConnected] = useState(false);
    const [reconnectAttempts, setReconnectAttempts] = useState(0);

    const temperatures = weatherData?.current_weather.map((weather) => weather.temperature.celsius) ?? [];
    const averageTemperature = temperatures.length
        ? temperatures.reduce((sum, temperature) => sum + temperature, 0) / temperatures.length
        : null;
    const hottestCity = weatherData?.current_weather.reduce<WeatherData | null>((hottest, weather) => {
        if (!hottest || weather.temperature.celsius > hottest.temperature.celsius) {
            return weather;
        }

        return hottest;
    }, null);

    useEffect(() => {
        let ws: WebSocket | null = null;
        let reconnectTimeout: ReturnType<typeof setTimeout> | undefined;
        let pingInterval: ReturnType<typeof setInterval> | undefined;
        let attempts = 0;
        let closedByEffect = false;

        const connect = () => {
            ws = new WebSocket(WEATHER_SOCKET_URL);

            ws.onopen = () => {
                attempts = 0;
                setConnected(true);
                setReconnectAttempts(0);
                pingInterval = setInterval(() => {
                    if (ws?.readyState === WebSocket.OPEN) {
                        ws.send('ping');
                    }
                }, 10000);
            };

            ws.onmessage = (event) => {
                setWeatherData(JSON.parse(event.data) as WeatherResponse);
            };

            ws.onclose = () => {
                if (pingInterval) {
                    clearInterval(pingInterval);
                }

                setConnected(false);

                if (!closedByEffect && attempts < MAX_RECONNECT_ATTEMPTS) {
                    attempts += 1;
                    setReconnectAttempts(attempts);
                    reconnectTimeout = setTimeout(connect, 5000);
                }
            };

            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };
        };

        connect();

        return () => {
            closedByEffect = true;
            ws?.close();
            if (reconnectTimeout) {
                clearTimeout(reconnectTimeout);
            }
            if (pingInterval) {
                clearInterval(pingInterval);
            }
        };
    }, []);

    return (
        <main className="dashboard-shell">
            <header className="hero">
                <div className="hero-copy">
                    <p className="eyebrow">Open-Meteo current conditions</p>
                    <h1>Greek Weather Monitor</h1>
                    <p className="hero-subtitle">
                        Live current readings for major Greek cities with a lightweight local prediction stream.
                    </p>
                </div>
                <div className="hero-status">
                    <div className={`connection-status ${connected ? 'connected' : 'disconnected'}`}>
                        <span className="status-indicator" />
                        <span>{connected ? 'Connected' : 'Disconnected'}</span>
                        {!connected && reconnectAttempts > 0 && (
                            <span className="reconnect-count">Retry {reconnectAttempts}/5</span>
                        )}
                    </div>
                    <span className="last-update">Updated {formatTimestamp(weatherData?.timestamp)}</span>
                </div>
            </header>

            <section className="summary-grid" aria-label="Weather summary">
                <div className="summary-panel">
                    <span className="summary-label">Cities</span>
                    <strong>{weatherData?.current_weather.length ?? 0}</strong>
                </div>
                <div className="summary-panel">
                    <span className="summary-label">Average</span>
                    <strong>{averageTemperature === null ? '--' : formatTemperature(averageTemperature)}</strong>
                </div>
                <div className="summary-panel">
                    <span className="summary-label">Warmest</span>
                    <strong>{hottestCity ? hottestCity.city : '--'}</strong>
                    {hottestCity && <span>{formatTemperature(hottestCity.temperature.celsius)}</span>}
                </div>
                <div className="summary-panel">
                    <span className="summary-label">Source</span>
                    <strong>Open-Meteo</strong>
                </div>
            </section>

            {!weatherData && (
                <section className="loading-state">
                    <span className="loading-dot" />
                    <span>Loading weather data...</span>
                </section>
            )}

            <section className="weather-grid">
                {weatherData?.current_weather.map((weather, index) => {
                    const prediction = weatherData.predictions[index];

                    return (
                        <article
                            key={weather.city}
                            className={`weather-card ${getTemperatureBand(weather.temperature.celsius)}`}
                        >
                            <div className="card-topline">
                                <div className="city-name">
                                    <span>{weather.city}</span>
                                    <span className="condition-badge">{weather.condition}</span>
                                </div>
                                <span className="coordinates">
                                    {weather.coordinates.lat.toFixed(2)}, {weather.coordinates.lon.toFixed(2)}
                                </span>
                            </div>

                            <div className="temperature-value">
                                {formatTemperature(weather.temperature.celsius)}
                            </div>

                            <div className="metric-grid">
                                <div className="metric">
                                    <span>Fahrenheit</span>
                                    <strong>{weather.temperature.fahrenheit.toFixed(1)} F</strong>
                                </div>
                                <div className="metric">
                                    <span>Humidity</span>
                                    <strong>{weather.humidity}%</strong>
                                </div>
                                <div className="metric">
                                    <span>Wind</span>
                                    <strong>{weather.wind_speed.kph} km/h</strong>
                                </div>
                                <div className="metric">
                                    <span>Pressure</span>
                                    <strong>{weather.pressure} hPa</strong>
                                </div>
                            </div>

                            {prediction && (
                                <div className="prediction-section">
                                    <div className="prediction-title">Prediction in 5s</div>
                                    <div className="weather-info">
                                        <span>Temperature</span>
                                        <span>{formatTemperature(prediction.temperature.celsius)}</span>
                                    </div>
                                    <div className="weather-info">
                                        <span>Condition</span>
                                        <span>{prediction.condition}</span>
                                    </div>
                                </div>
                            )}

                            <div className="timestamp">
                                Last updated {formatTimestamp(weather.timestamp)}
                            </div>
                        </article>
                    );
                })}
            </section>
        </main>
    );
};

export default WeatherDashboard;
