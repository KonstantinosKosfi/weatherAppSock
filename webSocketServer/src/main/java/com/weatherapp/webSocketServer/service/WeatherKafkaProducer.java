package com.weatherapp.webSocketServer.service;

import com.weatherapp.webSocketServer.domain.topics.KafkaTopics;
import com.weatherapp.webSocketServer.domain.topics.Metadata;
import com.weatherapp.webSocketServer.payload.ws.WeatherPayload;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import static com.weatherapp.webSocketServer.domain.topics.KafkaTopics.*;

@RequiredArgsConstructor
@Service
@Slf4j
public class WeatherKafkaProducer {
    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void sendCurrentWeather(WeatherPayload weatherDataList) {
        weatherDataList.getCurrentWeather().forEach(data -> {
                    log.info("Send data to CURRENT_WEATHER_TOPIC: {}", data);
                    kafkaTemplate.send(CURRENT_WEATHER_TOPIC, data.getCity(), data);
                }
        );
    }

    public void sendPredictions(WeatherPayload predictionList) {
        predictionList.getPredictions().forEach(data ->{
                    log.info("Send data to PREDICTIONS_TOPIC: {}", data);
                    kafkaTemplate.send(PREDICTIONS_TOPIC, data.getCity(), data);
                }
        );
    }

    public void sendMetadata(String timestamp, String generatedBy) {
        Metadata metadata = new Metadata(timestamp, generatedBy);
        kafkaTemplate.send(METADATA_TOPIC, generatedBy, metadata);
    }
}
