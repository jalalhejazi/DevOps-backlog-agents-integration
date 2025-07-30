# Multi-stage build for nginx-based static file serving
# Stage 1: Build stage (for potential future build steps)
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files (for potential future build steps)
COPY package*.json ./

# Copy source files
COPY . .

# Stage 2: Production stage with nginx
FROM nginx:1.25-alpine

# Remove default nginx configuration
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/

# Copy static files from builder stage
COPY --from=builder /app/index.html /usr/share/nginx/html/
COPY --from=builder /app/*.css /usr/share/nginx/html/ 2>/dev/null || true
COPY --from=builder /app/*.js /usr/share/nginx/html/ 2>/dev/null || true
COPY --from=builder /app/assets/ /usr/share/nginx/html/assets/ 2>/dev/null || true

# Create a non-root user for security
RUN addgroup -g 1001 -S nginx-user && \
    adduser -S nginx-user -u 1001 -G nginx-user

# Set proper permissions
RUN chown -R nginx-user:nginx-user /usr/share/nginx/html && \
    chown -R nginx-user:nginx-user /var/cache/nginx && \
    chown -R nginx-user:nginx-user /var/log/nginx && \
    chown -R nginx-user:nginx-user /etc/nginx/conf.d

# Create pid directory and set permissions
RUN mkdir -p /var/run/nginx && \
    chown -R nginx-user:nginx-user /var/run/nginx

# Switch to non-root user
USER nginx-user

# Expose port 1234 (matches the application's default port)
EXPOSE 1234

# Health check to ensure nginx is serving content
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:1234/health || exit 1

# Start nginx in foreground mode
CMD ["nginx", "-g", "daemon off;"]
