FROM node:20-alpine

# Install build deps for better-sqlite3
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy backend
COPY backend/package.json ./
RUN npm install --production

COPY backend/server.js ./

# Copy frontend
COPY frontend/ ./frontend/

# Data directory for SQLite
VOLUME ["/data"]

EXPOSE 4500

CMD ["node", "server.js"]
