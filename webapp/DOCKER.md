# Docker Setup for Backlog.md Demo (Nginx-based)

## Overview

This document describes how to run the backlog.md demo application using Docker with nginx as a reverse proxy for optimal static file serving and production-ready deployment.

## Quick Start

### Using Docker Compose (Recommended)

```bash
# Build and start the nginx application
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the application
docker-compose down
```

### Using Docker directly

```bash
# Build the nginx image
docker build -t backlog-md-demo .

# Run the nginx container
docker run -d --name backlog-md-demo-nginx -p 1234:1234 backlog-md-demo

# Access the application
open http://localhost:1234

# Stop and remove container
docker stop backlog-md-demo-nginx && docker rm backlog-md-demo-nginx
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

- **High Performance**: Uses nginx for efficient static file serving
- **Lightweight**: Multi-stage build with optimized nginx Alpine image
- **Secure**: Runs as non-root user with security headers
- **Production Ready**: Gzip compression, caching, and security features
- **Health Check**: Built-in health monitoring endpoint at `/health`
- **Port Mapping**: Exposes port 1234 for web access

## Nginx Configuration

The container includes a custom nginx configuration with:

- **Security Headers**: X-Frame-Options, X-XSS-Protection, CSP
- **Gzip Compression**: Automatic compression for text files
- **Caching**: Optimized caching for static assets
- **Health Check**: `/health` endpoint for monitoring
- **Error Handling**: Custom error pages

## Testing

Run the comprehensive nginx Docker test suite:

```bash
./docker-test.sh
```

This script tests:
1. ✅ Container builds successfully
2. ✅ Nginx serves static content efficiently
3. ✅ Basic functionality verification
4. ✅ Health check endpoint functionality
5. ✅ Security headers validation
6. ✅ Gzip compression testing
7. ✅ Container health monitoring

## Best Practices Implemented

- **Multi-stage builds**: Optimized for production with minimal image size
- **Non-root user**: Enhanced security with dedicated nginx user
- **Security hardening**: Security headers and access controls
- **Performance optimization**: Gzip compression and caching
- **Health monitoring**: Built-in health check endpoints
- **Production ready**: Optimized for high-performance static serving

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Docker Build  │───▶│  Nginx Alpine   │───▶│ Static Content  │
│   (Multi-stage) │    │   (Production)  │    │   (Port 1234)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
    Node.js Builder         Nginx Server           HTML/CSS Files
    (Dependencies)        (Reverse Proxy)         (Optimized)
```

## Performance Benefits

- **Faster serving**: nginx vs Node.js http-server
- **Better caching**: Advanced cache control headers
- **Compression**: Automatic gzip compression
- **Smaller image**: ~50MB vs ~180MB with Node.js
- **Better concurrency**: nginx connection handling

## Troubleshooting

### Container won't start
```bash
# Check nginx container logs
docker logs backlog-md-demo-nginx

# Check if port is already in use
lsof -i :1234

# Verify nginx configuration
docker exec backlog-md-demo-nginx nginx -t
```

### Health check failing
```bash
# Test health endpoint directly
curl http://localhost:1234/health

# Check container health status
docker inspect backlog-md-demo-nginx | grep -A 10 "Health"

# Check nginx status
docker exec backlog-md-demo-nginx ps aux | grep nginx
```

### Permission issues
```bash
# Ensure script is executable
chmod +x docker-test.sh

# Check file permissions in container
docker exec backlog-md-demo-nginx ls -la /usr/share/nginx/html/
```

### Performance tuning
```bash
# Monitor nginx access logs
docker logs -f backlog-md-demo-nginx

# Check resource usage
docker stats backlog-md-demo-nginx
```