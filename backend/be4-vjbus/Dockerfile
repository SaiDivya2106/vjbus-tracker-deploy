FROM python:3.11-slim
WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir \
    eventlet \
    flask \
    flask_cors \
    flask_socketio

COPY . .
EXPOSE 3000
CMD ["python3", "server.py"]