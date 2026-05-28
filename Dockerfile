# Stage 1: Build dependencies and the application
FROM node:22-bookworm-slim AS builder

# Install system dependencies for build
RUN apt-get update && apt-get install -y \
    wget gnupg tar unzip ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Copy application code
COPY . .

# Build for standalone
RUN npm run build

# Stage 2: Runtime environment (Universal: Mac/RHEL)
FROM node:22-bookworm-slim AS runner

# Install runtime dependencies for Chromium (Works on both ARM64 and AMD64)
RUN apt-get update && apt-get install -y \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    lsb-release \
    xdg-utils \
    chromium \
    && rm -rf /var/lib/apt/lists/*

# Install tsconfig-paths globally to support script execution
RUN npm install -g tsconfig-paths

# Create directory for reports and set permissive permissions for RHEL/Linux compatibility
RUN mkdir -p /app/public/reports && chmod -R 777 /app/public/reports

# Create script for report generation
RUN echo '#!/bin/bash\n\
export NODE_PATH=/usr/local/lib/node_modules\n\
npx ts-node -r tsconfig-paths/register --transpile-only --project /app/tsconfig.scripts.json /app/scripts/generate_monthly_reports.ts "$@"' > /usr/local/bin/reportlargepdf && \
    chmod +x /usr/local/bin/reportlargepdf

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV NODE_ENV=production

WORKDIR /app

# Copy standalone build and assets from builder
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
# Need to ensure scripts and tsconfig are available for the CLI tool
COPY --from=builder /app/scripts /app/scripts
COPY --from=builder /app/src /app/src
COPY --from=builder /app/tsconfig.json /app/tsconfig.json
COPY --from=builder /app/tsconfig.scripts.json /app/tsconfig.scripts.json
COPY --from=builder /app/package.json /app/package.json
COPY --from=builder /app/node_modules /app/node_modules

# Start app
CMD ["node", "server.js"]
