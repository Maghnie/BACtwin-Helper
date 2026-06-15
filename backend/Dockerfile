FROM node:18-slim

# Install build tools for native modules
RUN apt-get update && apt-get install -y \
    build-essential \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy only package files first (better layer caching)
COPY package*.json ./

# Remove any potential node_modules from host (safety)
RUN rm -rf node_modules

# Install dependencies and force rebuild of native modules
RUN npm install --build-from-source

# Optional: explicitly rebuild sqlite3
RUN npm rebuild sqlite3 --build-from-source

# Copy the rest of the code
COPY . .

EXPOSE 4000
CMD ["npm", "start"]