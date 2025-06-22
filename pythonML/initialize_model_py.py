import joblib

from weather_ml import WeatherPredictor
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
import random

def generate_training_data(days=30):
    data = []
    start_date = datetime.now() - timedelta(days=days)
    
    weather_conditions = [
        "Sunny", "Partly Cloudy", "Cloudy", "Rain", 
        "Thunderstorm", "Clear", "Overcast", "Light Rain"
    ]
    
    for day in range(days):
        current_date = start_date + timedelta(days=day)
        for hour in range(24):
            # Base temperature with daily and seasonal variation
            base_temp = 20 + 5 * np.sin(2 * np.pi * day / 365)  # seasonal variation
            base_temp += 3 * np.sin(2 * np.pi * hour / 24)  # daily variation
            
            data.append({
                'hour': hour,
                'day': current_date.day,
                'month': current_date.month,
                'day_of_week': current_date.weekday(),
                'humidity': random.randint(30, 90),
                'wind_speed': random.uniform(0, 30),
                'pressure': random.randint(980, 1025),
                'condition': random.choice(weather_conditions),
                'temperature': base_temp + random.uniform(-2, 2)
            })
    
    return pd.DataFrame(data)

def train_and_save_model():
    print("Generating training data...")
    df = generate_training_data()
    
    print("Training weather prediction model...")
    predictor = WeatherPredictor()
    
    # Prepare features with correct column names
    features = pd.DataFrame({
        'hour': df['hour'],
        'day': df['day'],
        'month': df['month'],
        'day_of_week': df['day_of_week'],
        'humidity': df['humidity'],
        'wind_speed': df['wind_speed'],
        'pressure': df['pressure'],
        'condition_encoded': predictor.label_encoder.transform(df['condition'])
    })
    
    # Fit scaler
    predictor.scaler.fit(features)
    
    # Train model
    predictor.model.fit(
        predictor.scaler.transform(features),
        df['temperature']
    )
    
    # Save the model
    predictor.save_model('weather_model.joblib')
    print("Model saved as 'weather_model.joblib'")
    print(joblib.load('weather_model.joblib'))

if __name__ == "__main__":
    train_and_save_model()