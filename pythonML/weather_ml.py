import joblib
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler, LabelEncoder

MODEL_FILE = "weather_model.joblib"


class WeatherPredictor:
    def __init__(self):
        self.scaler = StandardScaler()
        self.label_encoder = LabelEncoder()
        self.model = RandomForestRegressor(n_estimators=100, random_state=42)
        self.weather_conditions = [
            "Sunny", "Partly Cloudy", "Cloudy", "Rain",
            "Thunderstorm", "Clear", "Overcast", "Light Rain"
        ]
        # Define feature names
        self.feature_names = [
            'hour', 'day', 'month', 'day_of_week',
            'humidity', 'wind_speed', 'pressure', 'condition_encoded'
        ]

        # Initialize label encoder with weather conditions
        self.label_encoder.fit(self.weather_conditions)

        # Initialize scaler with sample data
        sample_data = pd.DataFrame({
            'hour': [12, 0, 6, 18],
            'day': [1, 15, 30, 7],
            'month': [1, 4, 7, 10],
            'day_of_week': [0, 2, 4, 6],
            'humidity': [60, 75, 80, 65],
            'wind_speed': [10, 15, 5, 20],
            'pressure': [1013, 1008, 1020, 1015],
            'condition_encoded': self.label_encoder.transform(['Sunny', 'Cloudy', 'Rain', 'Clear'])
        })
        self.scaler.fit(sample_data)

        # Initialize model with basic predictions
        self.model.fit(sample_data, [20, 15, 18, 22])  # Sample temperatures

    def predict(self, features):
        # Ensure features have correct column names
        if isinstance(features, pd.DataFrame):
            features = features.reindex(columns=self.feature_names)
        else:
            features = pd.DataFrame(features, columns=self.feature_names)

        features_scaled = self.scaler.transform(features)
        return self.model.predict(features_scaled)

    def save_model(self, filename=MODEL_FILE):
        joblib.dump({
            'model': self.model,
            'scaler': self.scaler,
            'label_encoder': self.label_encoder,
            'feature_names': self.feature_names
        }, filename)

    @staticmethod
    def load_model(filename=MODEL_FILE):
        predictor = WeatherPredictor()
        try:
            saved_model = joblib.load(filename)
            predictor.model = saved_model['model']
            predictor.scaler = saved_model['scaler']
            predictor.label_encoder = saved_model['label_encoder']
            predictor.feature_names = saved_model.get('feature_names', predictor.feature_names)
        except FileNotFoundError:
            print(f"No saved model found at {filename}. Using default initialization.")
        return predictor
