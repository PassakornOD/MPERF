#!/bin/bash
# MPERF RHEL 9 Deployment Script (with Proxy support)

PROXY_URL="http://10.4.179.130:3128"

echo ">>> [1/4] Configuring System-Wide Docker Proxy..."
sudo mkdir -p /etc/systemd/system/docker.service.d
echo "[Service]
Environment=\"HTTP_PROXY=$PROXY_URL\"
Environment=\"HTTPS_PROXY=$PROXY_URL\"
Environment=\"NO_PROXY=localhost,127.0.0.1\"" | sudo tee /etc/systemd/system/docker.service.d/http-proxy.conf

# Configure Docker Build Proxy for the current user
mkdir -p ~/.docker
echo "{
 \"proxies\": {
   \"default\": {
     \"httpProxy\": \"$PROXY_URL\",
     \"httpsProxy\": \"$PROXY_URL\",
     \"noProxy\": \"localhost,127.0.0.1\"
   }
 }
}" > ~/.docker/config.json

echo ">>> [2/4] Applying Configuration and Restarting Docker..."
sudo systemctl daemon-reload
sudo systemctl restart docker

echo ">>> [3/4] Ensuring Dockerfile is correctly patched..."
# ตรวจสอบว่ามี ENV สำหรับ Puppeteer หรือยัง ถ้าไม่มีให้แทรกเข้าไป
if ! grep -q "PUPPETEER_SKIP_DOWNLOAD" Dockerfile; then
    sed -i '/WORKDIR \/app/a ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true\nENV PUPPETEER_SKIP_DOWNLOAD=true' Dockerfile
fi

echo ">>> [4/4] Building and Deploying MPERF..."
# ส่ง Proxy เข้าไปในขั้นตอน build args ด้วยเพื่อความชัวร์
docker compose -f docker-compose.rhel.yml build \
    --build-arg http_proxy=$PROXY_URL \
    --build-arg https_proxy=$PROXY_URL \
    --no-cache

docker compose -f docker-compose.rhel.yml up -d

echo ">>> Deployment Complete!"
docker compose -f docker-compose.rhel.yml ps
