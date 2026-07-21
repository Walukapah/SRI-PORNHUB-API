# Use Node.js base image (Python included)
FROM node:18-slim

# Install Python3 and required packages
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json ./

# Install Node.js dependencies
RUN npm install

# Copy all project files
COPY . .

# Expose port
EXPOSE 3000

# Start the server
CMD ["node", "server.js"]
