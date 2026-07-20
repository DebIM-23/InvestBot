# Use Node image with Debian base (so we can install Python)
FROM node:20-slim

# Install Python 3.11 and pip
RUN apt-get update && \
    apt-get install -y python3 python3-pip python3-venv && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ---- Python setup ----
COPY python/requirements.txt ./python/
RUN pip3 install --break-system-packages -r python/requirements.txt

COPY python/data_fetcher.py ./python/

# ---- Node setup ----
COPY package.json ./
RUN npm install

COPY server.js ./
COPY init-db.js ./

# ---- Start script ----
COPY start.sh ./
RUN chmod +x start.sh

# Expose the Node port
EXPOSE 3000

CMD ["./start.sh"]
