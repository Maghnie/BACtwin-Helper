FROM node:18-slim

# Install system dependencies for native modules (sqlite3, bacstack, etc.)
RUN apt-get update && apt-get install -y \
    build-essential \
    python3 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files first (better caching)
COPY package*.json ./

# Install dependencies – this will recompile sqlite3 for the container's glibc
RUN npm install

# Copy the rest of the backend code
COPY . .

# Expose the port your app runs on
EXPOSE 4000

# Start the server
CMD ["npm", "start"]