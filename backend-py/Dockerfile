# Build context is the repo root (see docker-compose.yml), mirroring backend/Dockerfile's
# convention so both backends are built the same way.
FROM python:3.13-slim

WORKDIR /app

COPY backend-py/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY backend-py/app ./app
COPY backend-py/alembic ./alembic
COPY backend-py/alembic.ini ./
COPY backend-py/entrypoint.sh ./

RUN mkdir -p /app/storage/attachments /app/storage/avatars
RUN chmod +x entrypoint.sh

ENV ENVIRONMENT=production
EXPOSE 8000

HEALTHCHECK --interval=10s --timeout=5s --start-period=15s --retries=5 \
  CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8000/api/health').status==200 else 1)"

ENTRYPOINT ["./entrypoint.sh"]
