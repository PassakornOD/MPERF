# MPERF Deployment

This guide explains how to build and deploy the MPERF application using Docker.

## Prerequisites

- [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/) installed on your machine.
- Access to the MySQL database server containing the `sarlog` database.

## Environment Configuration

Before building the images, you must configure your environment variables.

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
2. Edit the `.env` file and update the following variables with your actual database credentials:
   ```env
   DB_HOST=your-db-host
   DB_USER=your-db-user
   DB_PASSWORD=your-db-password
   DB_NAME=sarlog
   ```

## Building and Running

The application uses `docker-compose` to manage the service.

1. **Start the application:**
   To build and start the application in detached mode, run:
   ```bash
   docker-compose up -d --build
   ```

2. **Access the application:**
   Once running, the application will be accessible at `http://localhost:3000`.

## Common Commands

- **Stop the application:**
  ```bash
  docker-compose down
  ```

- **View logs:**
  ```bash
  docker-compose logs -f app
  ```

- **Restart the application (after code changes):**
  ```bash
  docker-compose restart app
  ```

## Troubleshooting

- **Database Connection:** If the application fails to start, ensure the `DB_HOST` is reachable from the container. If your DB is on the host machine, you may need to use `host.docker.internal` as the `DB_HOST`.
- **Logs:** Always check the logs if you experience unexpected behavior: `docker-compose logs -f app`.
