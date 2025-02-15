# Web Scraper

A service for scheduling automated web scraping tasks with email notifications.

## Features

- Scheduled web scraping using cron jobs
- Email notifications with scraping results
- Containerized deployment support
- Kubernetes-ready configuration

## Getting Started

### Environment Setup

1. Create your environment configuration:
```bash
cp .env.example .env
```

2. Configure the required environment variables in `.env`

### Local Development

1. Install dependencies and start the development server:
```bash
yarn && yarn dev
```

### Docker Setup

Launch the service using Docker Compose:
```bash
docker-compose up -d
```

## Deployment

### Kubernetes Deployment

1. Ensure your `.env` file is properly configured
2. Deploy to your Kubernetes cluster:
```bash
yarn deploy
```

The service will be deployed using the configurations in the `k8s/` directory.

## Project Structure

```
.
├── docker-compose.yml    # Docker Compose configuration
├── Dockerfile           # Docker image definition
├── index.js            # Application entry point
├── k8s/                # Kubernetes configuration files
├── scripts/            # Deployment and utility scripts
└── utils/              # Helper utilities
```

## Support

For support, please open an issue in the repository.
