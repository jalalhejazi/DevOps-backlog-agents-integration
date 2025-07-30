# Use Node.js 18 Alpine for smaller image size
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application files
COPY . .

# Expose port 1234 (matches the application's default port)
EXPOSE 1234

# Create a non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /app
USER nodejs

# Health check to ensure the application is running
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:1234/ || exit 1

# Start the application
CMD ["npm", "start"] 