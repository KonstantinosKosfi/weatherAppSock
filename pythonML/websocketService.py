from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from typing import Set
import asyncio
import json
from datetime import datetime
import logging
from weather_station import WeatherStation

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()
weather_station = WeatherStation()


class ConnectionManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        self.running = False

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)
        logger.info(f"Client connected. Total connections: {len(self.active_connections)}")

    async def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        logger.info(f"Client disconnected. Total connections: {len(self.active_connections)}")

    async def broadcast(self, message: str):
        disconnected = set()
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except WebSocketDisconnect:
                disconnected.add(connection)
            except Exception as e:
                logger.error(f"Error sending message: {e}")
                disconnected.add(connection)

        for connection in disconnected:
            await self.disconnect(connection)

    async def start_weather_updates(self):
        self.running = True
        while self.running and len(self.active_connections) > 0:
            try:
                weather_data = {
                    "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    "generated_by": "KonstantinosKos",
                    "current_weather": [],
                    "predictions": []
                }

                for city in weather_station.cities:
                    current = weather_station.generate_weather_data(city)
                    prediction = weather_station.predict_next_weather(current)

                    weather_data["current_weather"].append(current)
                    weather_data["predictions"].append(prediction)

                await self.broadcast(json.dumps(weather_data))
                await asyncio.sleep(5)

            except Exception as e:
                logger.error(f"Error in weather update loop: {e}")
                await asyncio.sleep(1)

    def stop_weather_updates(self):
        self.running = False


manager = ConnectionManager()


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        if len(manager.active_connections) == 1:
            asyncio.create_task(manager.start_weather_updates())

        while True:
            await websocket.receive_text()

    except WebSocketDisconnect:
        await manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        await manager.disconnect(websocket)
    finally:
        await manager.disconnect(websocket)

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "connections": len(manager.active_connections),
        "service": "Weather WebSocket Service"
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
