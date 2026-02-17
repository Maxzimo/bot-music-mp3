FROM node:22-bookworm

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    python3 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Asegurar comando "python"
RUN ln -sf /usr/bin/python3 /usr/bin/python

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

CMD ["node", "index.js"]
