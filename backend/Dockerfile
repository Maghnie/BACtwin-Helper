FROM node:18-slim

# Install system dependencies for compiling native modules
RUN apt-get update && apt-get install -y \
    build-essential \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies, forcing sqlite3 to build from source
RUN npm install --build-from-source

# Optional: verify sqlite3 is rebuilt
RUN npm rebuild sqlite3 --build-from-source

# Copy rest of the backend code
COPY . .

EXPOSE 4000
CMD ["npm", "start"]