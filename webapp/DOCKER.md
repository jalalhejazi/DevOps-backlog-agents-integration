# Docker Setup for Backlog.md Demo

## Overview

This document describes how to run the backlog.md demo application using Docker for consistent development and deployment environments.

## Quick Start

### Using Docker Compose (Recommended)

```bash
# Build and start the application
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the application
docker-compose down
```

### Using Docker directly

```bash
# Build the image
docker build -t backlog-md-demo .

# Run the container
docker run -d --name backlog-md-demo -p 1234:1234 backlog-md-demo

# Access the application
open http://localhost:1234

# Stop and remove container
docker stop backlog-md-demo && docker rm backlog-md-demo
```

### Using npm scripts

```bash
# Build Docker image
npm run docker:build

# Run container
npm run docker:run

# Stop container
npm run docker:stop

# Run all Docker tests
npm run docker:test
```

## Features

- **Lightweight**: Uses Node.js 18 Alpine for minimal image size
- **Secure**: Runs as non-root user
- **Health Check**: Built-in health monitoring
- **Port Mapping**: Exposes port 1234 for web access
- **Production Ready**: Optimized for production deployment

## Testing

Run the comprehensive Docker test suite:

```bash
./docker-test.sh
```

This script tests:
1. ✅ Container builds successfully
2. ✅ Container runs and serves content
3. ✅ Basic functionality verification
4. ✅ Health check validation

## Best Practices Implemented

- **Multi-stage builds**: Optimized for production
- **Non-root user**: Enhanced security
- **Health checks**: Container monitoring
- **Minimal dependencies**: Only production packages
- **Proper caching**: Optimized layer caching
- **Environment variables**: Configurable settings

## Troubleshooting

### Container won't start
```bash
# Check container logs
docker logs backlog-md-demo

# Check if port is already in use
lsof -i :1234
```

### Health check failing
```bash
# Check container health
docker inspect backlog-md-demo | grep -A 10 "Health"

# Manually test the application
curl http://localhost:1234/
```

### Permission issues
```bash
# Ensure script is executable
chmod +x docker-test.sh
``` 