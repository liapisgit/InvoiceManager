# Intranet Deployment

This project is configured to run on a Linux server with Docker Compose and no reverse proxy.

## What This Setup Does

- Serves the React frontend from the Express backend
- Exposes the app on `http://SERVER_IP:8080`
- Runs Postgres only inside Docker
- Runs `n8n` on its own port for admin access
- Sends uploaded invoice images from the backend to the `n8n` webhook over the Docker network

## Ports

- App website and API: `8080`
- n8n UI and webhooks: `5678`

## Prerequisites

- Linux server with Docker Engine installed
- Docker Compose plugin installed
- A free LAN port `8080`
- A free LAN port `5678` if you want to access the n8n UI from a browser

## First-Time Server Setup

1. Copy the project to the server.
2. Copy `.env.example` to `.env`.
3. Edit `.env` and replace:
   - `POSTGRES_PASSWORD`
   - `SERVER_IP_OR_HOSTNAME` inside `N8N_PUBLIC_BASE_URL`
4. If your webhook path in n8n will be different, update `N8N_WEBHOOK_PATH` (image upload) and/or `N8N_INVOICE_DATA_WEBHOOK_PATH` (invoice JSON after DB save).

Example:

```env
APP_PORT=8080
POSTGRES_USER=invoice
POSTGRES_PASSWORD=super-secret-password
POSTGRES_DB=invoice_manager
N8N_PORT=5678
N8N_PUBLIC_BASE_URL=http://192.168.1.50:5678
N8N_WEBHOOK_PATH=upload-invoice-image
N8N_INVOICE_DATA_WEBHOOK_PATH=upload-invoice-data
GENERIC_TIMEZONE=Europe/Athens
```

## Start The Stack

Build the images:

```bash
docker compose build
```

Run database migrations:

```bash
docker compose --profile tools run --rm backend-migrate
```

Start the application:

```bash
docker compose up -d
```

Check status:

```bash
docker compose ps
```

Read logs if needed:

```bash
docker compose logs -f backend
docker compose logs -f n8n
```

## Access URLs

- App: `http://SERVER_IP:8080`
- n8n: `http://SERVER_IP:5678`
- Health check: `http://SERVER_IP:8080/health`

## n8n Workflow Setup

Create an n8n workflow with a Webhook node using this path:

```text
upload-invoice-image
```

That matches the default backend value:

```text
http://n8n:5678/webhook/upload-invoice-image
```

If you change the webhook path in n8n, update `N8N_WEBHOOK_PATH` in `.env` and restart the backend:

```bash
docker compose up -d backend
```

The backend also forwards each saved invoice (JSON, including `user` from the JWT) to a second webhook. Default path:

```text
upload-invoice-data
```

Configure that workflow in n8n, or change `N8N_INVOICE_DATA_WEBHOOK_PATH` and restart the backend. For **local dev** with the API running on the host (not in Docker), set `N8N_WEBHOOK_URL` and `N8N_INVOICE_DATA_WEBHOOK_URL` in `BackEnd/.env` to `http://localhost:5678/webhook/...` instead of `http://n8n:5678/...`.

## Updating The App

After pulling new code on the server:

```bash
docker compose build
docker compose --profile tools run --rm backend-migrate
docker compose up -d
```

## Firewall Notes

- Allow LAN access to `8080`
- Allow `5678` only for admins if employees should not use the n8n UI
- Do not expose Postgres to the LAN

# When migrations dont apply

docker compose --profile tools build --no-cache backend-migrate
docker compose --profile tools run --rm backend-migrate
