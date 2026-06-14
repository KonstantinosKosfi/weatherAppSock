FROM python:3.11-slim

WORKDIR /app

COPY req.txt .
RUN pip install --no-cache-dir -r req.txt

COPY . .
RUN python initialize_model_py.py

EXPOSE 8000

CMD ["python", "websocketService.py"]
